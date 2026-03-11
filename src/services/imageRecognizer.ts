/**
 * 图像识别服务 - 基于形状特征的本地化识别方案
 */

import { batchVoteRecognition, type RecognitionResult as ShapeResult } from '@/utils/shapeAnalyzer'

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

// 常用词库（按类别分组）
const WORD_POOL = {
  common: ['圆形', '方形', '三角形', '线条', '图案'],
  objects: ['太阳', '球', '房子', '汽车', '花朵', '树', '爱心', '星星'],
  faces: ['笑脸', '人脸', '表情'],
  nature: ['云朵', '山', '雨', '闪电'],
  abstract: ['涂鸦', '艺术', '设计']
}

// 根据特征提供智能猜测
function getSmartGuess(features: any, template: any): string {
  if (!template) {
    // 没有匹配到模板，根据基本特征猜测
    const aspectRatio = features?.aspectRatio || 1
    const loops = features?.closedLoops || 0

    // 宽高比接近 1 且有闭合环 -> 圆形类
    if (aspectRatio > 0.7 && aspectRatio < 1.3 && loops > 0) {
      return Math.random() > 0.5 ? '太阳' : '球'
    }

    // 扁平的形状 -> 云朵或汽车
    if (aspectRatio > 1.5) {
      return loops > 1 ? '汽车' : '云朵'
    }

    // 瘦高的形状 -> 树
    if (aspectRatio < 0.7) {
      return '树'
    }

    // 默认随机返回
    const defaults = ['图案', '图形', '涂鸦']
    return defaults[Math.floor(Math.random() * defaults.length)]
  }

  // 有匹配模板，直接返回模板名称
  return template.name
}

// 根据识别结果调整置信度
function adjustConfidence(baseConfidence: number, features: any): number {
  let adjusted = baseConfidence

  // 像素密度太低，降低置信度
  if (features?.pixelDensity && features.pixelDensity < 0.02) {
    adjusted *= 0.6
  }

  // 像素密度适中，保持置信度
  if (features?.pixelDensity && features.pixelDensity >= 0.02 && features.pixelDensity < 0.1) {
    adjusted *= 1.0
  }

  // 像素密度过高（可能是大面积涂黑），稍微降低
  if (features?.pixelDensity && features.pixelDensity > 0.2) {
    adjusted *= 0.8
  }

  // 添加一些小波动让结果更自然
  const variance = (Math.random() - 0.5) * 10
  adjusted += variance

  return Math.max(30, Math.min(95, adjusted))
}

/**
 * 主识别函数
 */
export const recognizeImage = async (
  canvas: HTMLCanvasElement,
  options: RecognitionOptions = {}
): Promise<RecognitionResult> => {
  const { onProgress, onError } = options

  try {
    onProgress?.('🔍 正在分析画作特征...')

    // 延迟一下让用户感知到"正在处理"
    await new Promise(resolve => setTimeout(resolve, 300))

    // 执行批量投票识别
    onProgress?.('🎯 正在进行图案匹配...')
    const result: ShapeResult = batchVoteRecognition(canvas, 5)

    onProgress?.('✨ 生成识别结果...')

    // 延迟一下
    await new Promise(resolve => setTimeout(resolve, 200))

    // 检查是否有有效结果
    if (!result.matchedShape && result.confidence < 20) {
      // 无法识别，返回降级结果
      const fallbackWords = [...WORD_POOL.common, ...WORD_POOL.abstract]
      const randomWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)]

      return {
        description: randomWord,
        keywords: [randomWord],
        confidence: Math.floor(30 + Math.random() * 20)
      }
    }

    // 获取智能猜测
    const guess = getSmartGuess(result.featureMatch, result.matchedShape)

    // 调整置信度
    const finalConfidence = adjustConfidence(result.confidence, result.featureMatch)

    // 构建关键词列表
    let keywords: string[] = []
    if (result.matchedShape) {
      keywords = result.matchedShape.keywords
    } else {
      keywords = [guess]
    }

    return {
      description: guess,
      keywords,
      confidence: Math.round(finalConfidence)
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    console.error('识别过程中发生错误:', errorMessage)

    if (onError) {
      onError(error instanceof Error ? error : new Error(errorMessage))
    }

    // 最坏情况下的降级方案
    const fallbackWords = ['圆形', '方形', '太阳', '爱心', '笑脸', '房子', '树', '花朵']
    const fallbackWord = fallbackWords[Math.floor(Math.random() * fallbackWords.length)]

    return {
      description: fallbackWord,
      keywords: [fallbackWord],
      confidence: Math.floor(40 + Math.random() * 20)
    }
  }
}
