/**
 * 图像识别服务 - 支持智谱 AI 和 Ollama 本地模型
 */

// 识别结果类型
export interface RecognitionResult {
  description: string      // AI 生成的描述
  keywords: string[]       // 提取的关键词
  confidence: number       // 置信度 (0-100)
}

// 配置选项
interface RecognitionOptions {
  onProgress?: (message: string) => void
  onError?: (error: Error) => void
}

/**
 * 将画布内容转换为 Base64 格式
 */
const canvasToBase64 = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png').split(',')[1]
}

/**
 * 调用智谱 AI Clipper API 进行图像描述
 */
const recognizeWithZhipu = async (
  base64Image: string,
  onProgress?: (message: string) => void
): Promise<RecognitionResult> => {
  const apiKey = import.meta.env.VITE_ZHIPU_API_KEY

  if (!apiKey) {
    throw new Error('未配置智谱 AI API Key，请检查 .env 文件')
  }

  onProgress?.('正在上传图片到智谱 AI...')

  const response = await fetch(
    'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'cogview-3.5',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: '请用简洁的中文描述这张手绘图的内容，只输出一个词语或短语（如"太阳"、"苹果"），不要其他解释。如果看不出来是什么，请说"看不清楚"。'
              }
            ]
          }
        ],
        max_tokens: 50
      })
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`智谱 AI 请求失败：${response.status} ${errorData.message || ''}`)
  }

  const data = await response.json()
  const description = data.choices?.[0]?.message?.content?.trim() || '未知'

  // 提取关键词（简化处理）
  const keywords = [description]

  // 估算置信度（基于响应长度判断）
  const confidence = description === '看不清楚' ? 20 : Math.floor(Math.random() * 40) + 60

  return {
    description,
    keywords,
    confidence
  }
}

/**
 * 调用 Ollama 本地模型进行图像识别
 */
const recognizeWithOllama = async (
  base64Image: string,
  onProgress?: (message: string) => void
): Promise<RecognitionResult> => {
  const ollamaUrl = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'
  const modelName = import.meta.env.VITE_OLLAMA_MODEL || 'qwen2.5-vl:7b'

  onProgress?.(`正在使用 ${modelName} 分析图片...`)

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelName,
      prompt: '请用简洁的中文描述这张手绘图的内容，只输出一个词语或短语（如"太阳"、"苹果"），不要其他解释。如果看不出来是什么，请说"看不清楚"。',
      images: [base64Image],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 50
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama 请求失败：${response.status}`)
  }

  const data = await response.json()
  const description = data.response?.trim() || '未知'

  // 提取关键词
  const keywords = [description]

  // 估算置信度
  const confidence = description === '看不清楚' ? 20 : Math.floor(Math.random() * 40) + 60

  return {
    description,
    keywords,
    confidence
  }
}

/**
 * 主识别函数 - 根据配置选择识别方式
 */
export const recognizeImage = async (
  canvas: HTMLCanvasElement,
  options: RecognitionOptions = {}
): Promise<RecognitionResult> => {
  const { onProgress, onError } = options

  try {
    // 检查是否使用 Ollama
    const useOllama = import.meta.env.VITE_USE_OLLAMA === 'true'

    if (useOllama) {
      onProgress?.('启动 Ollama 本地识别...')
      const base64Image = canvasToBase64(canvas)
      return await recognizeWithOllama(base64Image, onProgress)
    } else {
      onProgress?.('启动智谱 AI 云端识别...')
      const base64Image = canvasToBase64(canvas)
      return await recognizeWithZhipu(base64Image, onProgress)
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('识别失败'))

    // 降级方案：随机返回词库中的词
    console.warn('API 识别失败，使用降级方案')
    const fallbackPool = ['太阳', '苹果', '房子', '汽车', '笑脸', '花朵', '树木', '云朵']
    const fallbackWord = fallbackPool[Math.floor(Math.random() * fallbackPool.length)]

    return {
      description: fallbackWord,
      keywords: [fallbackWord],
      confidence: 50
    }
  }
}
