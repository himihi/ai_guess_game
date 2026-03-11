/**
 * 形状分析器 - 本地化绘图识别核心算法
 * 通过提取图像特征和模板匹配来识别手绘图形
 */

import type { Point } from '@/types/game'

// 形状特征接口
export interface ShapeFeatures {
  strokeCount: number
  pixelDensity: number
  boundingBox: { x: number; y: number; width: number; height: number }
  aspectRatio: number
  closedLoops: number
  intersectionPoints: number
  endpointCount: number
  lineAngleDistribution: number[]
  verticalSymmetry: number
  horizontalSymmetry: number
  topHeavy: boolean
  bottomHeavy: boolean
  centerMass: Point
}

// 形状模板接口
export interface ShapeTemplate {
  id: string
  name: string
  keywords: string[]
  scoreWeights: {
    strokeCount: number
    closedLoops: number
    symmetry: number
    boundingRatio: number
    complexity: number
  }
  characteristics: {
    minStrokes: number
    maxStrokes: number
    hasLoop: boolean
    loopCount: number
    symmetryAxis: 'none' | 'vertical' | 'horizontal' | 'both'
    aspectRatioRange: [number, number]
  }
}

// 形状识别结果
export interface RecognitionResult {
  matchedShape: ShapeTemplate | null
  confidence: number         // 置信度 (0-100)
  featureMatch: Partial<ShapeFeatures>
  alternativeMatches: Array<{
    template: ShapeTemplate
    confidence: number
  }>
}

// 所有支持的形状模板库
const SHAPE_TEMPLATES: ShapeTemplate[] = [
  {
    id: 'circle',
    name: '圆形',
    keywords: ['圆形', '圆', '球', '太阳', '圆圈'],
    scoreWeights: {
      strokeCount: 0.3,
      closedLoops: 0.4,
      symmetry: 0.15,
      boundingRatio: 0.1,
      complexity: 0.05
    },
    characteristics: {
      minStrokes: 1,
      maxStrokes: 2,
      hasLoop: true,
      loopCount: 1,
      symmetryAxis: 'both',
      aspectRatioRange: [0.7, 1.3]
    }
  },
  {
    id: 'square',
    name: '方形',
    keywords: ['方形', '正方形', '矩形', '盒子', '方框'],
    scoreWeights: {
      strokeCount: 0.25,
      closedLoops: 0.35,
      symmetry: 0.2,
      boundingRatio: 0.15,
      complexity: 0.05
    },
    characteristics: {
      minStrokes: 1,
      maxStrokes: 4,
      hasLoop: true,
      loopCount: 1,
      symmetryAxis: 'both',
      aspectRatioRange: [0.6, 1.4]
    }
  },
  {
    id: 'triangle',
    name: '三角形',
    keywords: ['三角形', '三角', '金字塔', '山峰'],
    scoreWeights: {
      strokeCount: 0.3,
      closedLoops: 0.3,
      symmetry: 0.15,
      boundingRatio: 0.15,
      complexity: 0.1
    },
    characteristics: {
      minStrokes: 1,
      maxStrokes: 3,
      hasLoop: true,
      loopCount: 1,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.5, 1.5]
    }
  },
  {
    id: 'heart',
    name: '爱心',
    keywords: ['爱心', '心形', '爱', '心脏'],
    scoreWeights: {
      strokeCount: 0.25,
      closedLoops: 0.35,
      symmetry: 0.25,
      boundingRatio: 0.1,
      complexity: 0.05
    },
    characteristics: {
      minStrokes: 1,
      maxStrokes: 2,
      hasLoop: true,
      loopCount: 1,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.8, 1.2]
    }
  },
  {
    id: 'star',
    name: '星星',
    keywords: ['星星', '星形', '五角星'],
    scoreWeights: {
      strokeCount: 0.3,
      closedLoops: 0.1,
      symmetry: 0.35,
      boundingRatio: 0.15,
      complexity: 0.1
    },
    characteristics: {
      minStrokes: 1,
      maxStrokes: 5,
      hasLoop: false,
      loopCount: 0,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.7, 1.3]
    }
  },
  {
    id: 'house',
    name: '房子',
    keywords: ['房子', '房屋', '家', '建筑'],
    scoreWeights: {
      strokeCount: 0.25,
      closedLoops: 0.2,
      symmetry: 0.25,
      boundingRatio: 0.2,
      complexity: 0.1
    },
    characteristics: {
      minStrokes: 3,
      maxStrokes: 6,
      hasLoop: false,
      loopCount: 0,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.6, 1.2]
    }
  },
  {
    id: 'tree',
    name: '树',
    keywords: ['树', '树木', '植物'],
    scoreWeights: {
      strokeCount: 0.2,
      closedLoops: 0.2,
      symmetry: 0.25,
      boundingRatio: 0.25,
      complexity: 0.1
    },
    characteristics: {
      minStrokes: 2,
      maxStrokes: 5,
      hasLoop: false,
      loopCount: 0,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.5, 1.5]
    }
  },
  {
    id: 'face',
    name: '笑脸',
    keywords: ['笑脸', '脸', '表情', '开心'],
    scoreWeights: {
      strokeCount: 0.2,
      closedLoops: 0.3,
      symmetry: 0.3,
      boundingRatio: 0.15,
      complexity: 0.05
    },
    characteristics: {
      minStrokes: 2,
      maxStrokes: 5,
      hasLoop: true,
      loopCount: 1,
      symmetryAxis: 'vertical',
      aspectRatioRange: [0.8, 1.2]
    }
  }
]

/**
 * 将二维数组转换为二值掩码（前景为 1，背景为 0）
 */
function createBinaryMask(
  imageData: ImageData,
  threshold: number = 220
): Uint8Array {
  const { data, width, height } = imageData
  const mask = new Uint8Array(width * height)

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]

    // 忽略透明像素和接近白色的背景
    if (a < 128) continue
    if (r > threshold && g > threshold && b > threshold) continue

    mask[i / 4] = 1
  }

  return mask
}

/**
 * 查找轮廓上的点（简化版轮廓追踪）
 * 返回：轮廓数组，每个轮廓是点的数组
 */
function findContours(mask: Uint8Array, width: number, height: number): Point[][] {
  const contours: Point[][] = []
  const visited = new Uint8Array(width * height)

  // 辅助函数：获取索引
  const getIdx = (x: number, y: number): number => y * width + x

  // 扫描找到所有未访问的前景点
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIdx(x, y)
      if (mask[idx] === 1 && visited[idx] === 0) {
        // 发现新轮廓，开始追踪
        const contour: Point[] = []
        const stack: Point[] = [{ x, y }]
        visited[idx] = 1
        contour.push({ x, y })

        // 使用栈进行 DFS 追踪相连的前景像素
        while (stack.length > 0) {
          const current = stack.pop()!

          // 检查 8 邻域
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue

              const nx = current.x + dx
              const ny = current.y + dy

              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = getIdx(nx, ny)
                if (mask[nIdx] === 1 && visited[nIdx] === 0) {
                  visited[nIdx] = 1
                  contour.push({ x: nx, y: ny })
                  stack.push({ x: nx, y: ny })
                }
              }
            }
          }
        }

        if (contour.length > 5) {
          contours.push(contour)
        }
      }
    }
  }

  return contours
}

/**
 * 计算对称度
 */
function calculateSymmetry(
  mask: Uint8Array,
  width: number,
  height: number
): { vertical: number; horizontal: number } {
  let verticalMatches = 0
  let horizontalMatches = 0
  let totalPixels = 0

  const centerX = Math.floor(width / 2)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < centerX; x++) {
      const leftIdx = y * width + x
      const rightIdx = y * width + (width - 1 - x)
      const mirrorY = height - 1 - y
      const bottomIdx = mirrorY * width + x

      if (mask[leftIdx] === 1 || mask[rightIdx] === 1) {
        totalPixels++
        if (mask[leftIdx] === mask[rightIdx]) {
          verticalMatches++
        }
      }

      if (mask[leftIdx] === 1 || mask[bottomIdx] === 1) {
        if (mask[leftIdx] === mask[bottomIdx]) {
          horizontalMatches++
        }
      }
    }
  }

  const verticalSymmetry = totalPixels > 0 ? verticalMatches / totalPixels : 0
  const horizontalSymmetry = totalPixels > 0 ? horizontalMatches / totalPixels : 0

  return {
    vertical: Math.min(1, verticalSymmetry * 1.5),
    horizontal: Math.min(1, horizontalSymmetry * 1.5)
  }
}

/**
 * 估算闭合环数量
 */
function countClosedLoops(mask: Uint8Array, width: number, height: number): number {
  const contours = findContours(mask, width, height)
  let loops = 0

  for (const contour of contours) {
    if (contour.length < 20) continue

    // 计算边界框
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const p of contour) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }

    const bboxArea = (maxX - minX + 1) * (maxY - minY + 1)
    const pointCount = contour.length

    // 简单判断：如果点相对于边界框面积足够密集，可能是闭合环
    const density = pointCount / bboxArea
    if (density > 0.05 && pointCount > 30) {
      loops++
    }
  }

  return Math.min(loops, 5)
}

/**
 * 计算边界框和宽高比
 */
function calculateBoundingBox(
  mask: Uint8Array,
  width: number,
  height: number
): { x: number; y: number; width: number; height: number; aspectRatio: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  let hasPixels = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] === 1) {
        hasPixels = true
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  }

  if (!hasPixels || minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0, aspectRatio: 1 }
  }

  const boxWidth = Math.max(1, maxX - minX + 1)
  const boxHeight = Math.max(1, maxY - minY + 1)
  const aspectRatio = boxWidth / boxHeight

  return {
    x: minX,
    y: minY,
    width: boxWidth,
    height: boxHeight,
    aspectRatio
  }
}

/**
 * 估算笔画数（基于端点数量和轮廓分析）
 */
function estimateStrokeCount(mask: Uint8Array, width: number, height: number): number {
  const contours = findContours(mask, width, height)

  // 统计端点（只有一个邻居的像素）
  let endpoints = 0
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (mask[y * width + x] === 1) {
        let neighborCount = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue
            const nx = x + dx, ny = y + dy
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (mask[ny * width + nx] === 1) neighborCount++
            }
          }
        }
        if (neighborCount === 1) endpoints++
      }
    }
  }

  // 简单的笔画估算：端点数/2 + 闭合环
  const loops = countClosedLoops(mask, width, height)
  return Math.max(1, Math.floor(endpoints / 10) + loops + contours.length)
}

/**
 * 主函数：分析画布图像并返回识别结果
 */
export function analyzeDrawing(canvas: HTMLCanvasElement): RecognitionResult {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return {
      matchedShape: null,
      confidence: 0,
      featureMatch: {},
      alternativeMatches: []
    }
  }

  const width = canvas.width
  const height = canvas.height

  // 获取图像数据
  const imageData = ctx.getImageData(0, 0, width, height)
  const mask = createBinaryMask(imageData)

  // 检查是否有足够的绘制内容
  const totalPixels = mask.filter(v => v === 1).length
  const pixelDensity = totalPixels / (width * height)

  if (pixelDensity < 0.005) {
    // 内容太少，无法识别
    return {
      matchedShape: null,
      confidence: 0,
      featureMatch: { pixelDensity },
      alternativeMatches: []
    }
  }

  // 提取特征
  const boundingBox = calculateBoundingBox(mask, width, height)
  const symmetry = calculateSymmetry(mask, width, height)
  const closedLoops = countClosedLoops(mask, width, height)
  const strokeCount = estimateStrokeCount(mask, width, height)

  const features: ShapeFeatures = {
    strokeCount,
    pixelDensity,
    boundingBox,
    aspectRatio: boundingBox.aspectRatio,
    closedLoops,
    intersectionPoints: 0,
    endpointCount: 0,
    lineAngleDistribution: [],
    verticalSymmetry: symmetry.vertical,
    horizontalSymmetry: symmetry.horizontal,
    topHeavy: false,
    bottomHeavy: false,
    centerMass: {
      x: boundingBox.x + boundingBox.width / 2,
      y: boundingBox.y + boundingBox.height / 2
    }
  }

  // 与每个模板进行匹配评分
  const matches = SHAPE_TEMPLATES.map(template => {
    let score = 0
    const weights = template.scoreWeights
    const char = template.characteristics

    // 笔画数匹配 (权重：strokeCount)
    if (features.strokeCount >= char.minStrokes && features.strokeCount <= char.maxStrokes) {
      score += weights.strokeCount * 100
    } else if (Math.abs(features.strokeCount - char.minStrokes) <= 2) {
      score += weights.strokeCount * 50
    }

    // 闭合环匹配 (权重：closedLoops)
    if (features.closedLoops === char.loopCount) {
      score += weights.closedLoops * 100
    } else if (Math.abs(features.closedLoops - char.loopCount) === 1) {
      score += weights.closedLoops * 50
    } else if (char.hasLoop && features.closedLoops > 0) {
      score += weights.closedLoops * 30
    }

    // 对称性匹配 (权重：symmetry)
    if (char.symmetryAxis !== 'none') {
      let symScore = 0
      switch (char.symmetryAxis) {
        case 'vertical':
          symScore = features.verticalSymmetry
          break
        case 'horizontal':
          symScore = features.horizontalSymmetry
          break
        case 'both':
          symScore = (features.verticalSymmetry + features.horizontalSymmetry) / 2
          break
      }
      score += weights.symmetry * symScore * 100
    }

    // 宽高比匹配 (权重：boundingRatio)
    const [minRatio, maxRatio] = char.aspectRatioRange
    if (features.aspectRatio >= minRatio && features.aspectRatio <= maxRatio) {
      score += weights.boundingRatio * 100
    } else if (
      features.aspectRatio >= minRatio * 0.8 &&
      features.aspectRatio <= maxRatio * 1.2
    ) {
      score += weights.boundingRatio * 50
    }

    // 归一化到 0-100
    return {
      template,
      confidence: Math.min(100, Math.max(0, score))
    }
  })

  // 排序获取最佳匹配
  matches.sort((a, b) => b.confidence - a.confidence)

  const bestMatch = matches[0]
  const secondBest = matches[1]

  // 计算最终置信度
  let finalConfidence = bestMatch?.confidence || 0

  // 根据像素密度调整置信度
  if (pixelDensity < 0.02) {
    finalConfidence *= 0.7
  } else if (pixelDensity > 0.15) {
    finalConfidence *= 0.9
  }

  // 如果第一名领先第二名很多，增加置信度
  if (secondBest && bestMatch) {
    const gap = bestMatch.confidence - secondBest.confidence
    if (gap > 20) {
      finalConfidence = Math.min(100, finalConfidence + gap * 0.3)
    }
  }

  return {
    matchedShape: bestMatch?.template || null,
    confidence: Math.round(finalConfidence),
    featureMatch: {
      strokeCount,
      closedLoops,
      aspectRatio: features.aspectRatio,
      verticalSymmetry: symmetry.vertical,
      pixelDensity
    },
    alternativeMatches: matches.slice(1, 3).map(m => ({
      template: m.template,
      confidence: Math.round(m.confidence)
    }))
  }
}

/**
 * 批量投票识别 - 提高准确率
 */
export function batchVoteRecognition(
  canvas: HTMLCanvasElement,
  numSamples: number = 3
): RecognitionResult {
  const votes = new Map<string, number>()
  const confidences = new Map<string, number>()

  for (let i = 0; i < numSamples; i++) {
    const result = analyzeDrawing(canvas)

    if (result.matchedShape && result.confidence > 20) {
      const currentVotes = votes.get(result.matchedShape.id) || 0
      votes.set(result.matchedShape.id, currentVotes + 1)

      const currentConf = confidences.get(result.matchedShape.id) || 0
      confidences.set(result.matchedShape.id, currentConf + result.confidence)
    }
  }

  // 找出最高票的形状
  let bestId = ''
  let bestVotes = 0

  for (const [id, count] of votes.entries()) {
    if (count > bestVotes) {
      bestVotes = count
      bestId = id
    }
  }

  // 获取最佳匹配模板
  const bestTemplate = SHAPE_TEMPLATES.find(t => t.id === bestId)

  // 如果没有明确结果，返回最后一次分析
  if (!bestTemplate || bestVotes === 0) {
    return analyzeDrawing(canvas)
  }

  // 计算平均置信度
  const avgConfidence = confidences.get(bestId) || 0
  const finalConfidence = Math.min(100, avgConfidence / numSamples + bestVotes * 5)

  // 获取替代选项
  const alternativeMatches: Array<{ template: ShapeTemplate; confidence: number }> = []
  const sortedAlternatives = Array.from(votes.entries())
    .filter(([id]) => id !== bestId)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)

  for (const [id, _] of sortedAlternatives) {
    const template = SHAPE_TEMPLATES.find(t => t.id === id)
    const conf = confidences.get(id) || 0
    if (template) {
      alternativeMatches.push({
        template,
        confidence: Math.round(conf / numSamples)
      })
    }
  }

  return {
    matchedShape: bestTemplate,
    confidence: Math.round(finalConfidence),
    featureMatch: {},
    alternativeMatches
  }
}
