import { ref, type Ref } from 'vue'
import type { Point, Stroke, BrushConfig } from '@/types/game'
import { getEventPosition, clearCanvas as helperClearCanvas, saveCanvas } from '@/utils/canvasHelper'

export function useDrawing(
  canvasRef: Ref<HTMLCanvasElement | undefined> | HTMLCanvasElement | undefined
) {
  const ctx = ref<CanvasRenderingContext2D | null>(null)
  const isDrawing = ref(false)
  const currentStroke = ref<Point[]>([])

  // 历史栈用于撤销/重做
  const strokeHistory = ref<Stroke[]>([])
  const historyIndex = ref(-1)

  const config = ref<BrushConfig>({
    color: '#000000',
    lineWidth: 3
  })

  // Helper to get canvas element
  const getCanvas = () => {
    if (typeof canvasRef === 'object' && 'value' in canvasRef) {
      return canvasRef.value || null
    }
    return canvasRef || null
  }

  // 获取事件坐标
  const getPosition = (e: MouseEvent | TouchEvent): Point => {
    const canvas = getCanvas()
    if (!canvas) return { x: 0, y: 0 }
    return getEventPosition(e, canvas)
  }

  // 开始绘制
  const startDraw = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()
    if (!ctx.value) return

    isDrawing.value = true
    currentStroke.value = []
    const pos = getPosition(e)
    currentStroke.value.push(pos)

    ctx.value.beginPath()
    ctx.value.moveTo(pos.x, pos.y)
  }

  // 绘制中
  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.value || !ctx.value) return

    e.preventDefault()
    const pos = getPosition(e)
    currentStroke.value.push(pos)

    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.stroke()
  }

  // 结束绘制
  const endDraw = () => {
    if (isDrawing.value && ctx.value) {
      ctx.value.closePath()

      // 保存完整的一笔到历史
      if (currentStroke.value.length > 0) {
        const stroke: Stroke = {
          points: [...currentStroke.value],
          color: config.value.color,
          lineWidth: config.value.lineWidth
        }

        // 清除后续历史（如果有）
        if (historyIndex.value < strokeHistory.value.length - 1) {
          strokeHistory.value = strokeHistory.value.slice(0, historyIndex.value + 1)
        }

        strokeHistory.value.push(stroke)
        historyIndex.value++
      }
    }
    isDrawing.value = false
    currentStroke.value = []
  }

  // 清空画布
  const clearCanvasFunc = () => {
    const canvas = getCanvas()
    if (!ctx.value || !canvas) return
    helperClearCanvas(ctx.value, canvas.width, canvas.height)
    strokeHistory.value = []
    historyIndex.value = -1
  }

  // 撤销
  const undo = () => {
    const canvas = getCanvas()
    if (!ctx.value || !canvas || historyIndex.value <= 0) return

    historyIndex.value--
    strokeHistory.value = strokeHistory.value.slice(0, historyIndex.value + 1)

    // 重新绘制所有笔画
    redrawAllStrokes(canvas)
  }

  // 重做
  const redo = () => {
    const canvas = getCanvas()
    if (!ctx.value || !canvas || historyIndex.value >= strokeHistory.value.length - 1) return

    historyIndex.value++

    // 重新绘制所有笔画
    redrawAllStrokes(canvas)
  }

  // 检查是否有绘画内容
  const hasDrawingContent = (): boolean => {
    return strokeHistory.value.length > 0 && historyIndex.value >= 0
  }

  // 重绘所有笔画
  const redrawAllStrokes = (canvas: HTMLCanvasElement) => {
    if (!ctx.value) return

    helperClearCanvas(ctx.value, canvas.width, canvas.height)

    for (let i = 0; i <= historyIndex.value; i++) {
      const stroke = strokeHistory.value[i]
      if (!stroke.points.length) continue

      ctx.value.beginPath()
      ctx.value.moveTo(stroke.points[0].x, stroke.points[0].y)

      for (let j = 1; j < stroke.points.length; j++) {
        ctx.value.lineTo(stroke.points[j].x, stroke.points[j].y)
      }

      ctx.value.strokeStyle = stroke.color
      ctx.value.lineWidth = stroke.lineWidth
      ctx.value.stroke()
    }
  }

  // 保存图片
  const saveImage = (): string => {
    const canvas = getCanvas()
    if (!canvas) return ''
    return saveCanvas(canvas)
  }

  // 更新配置
  const updateConfig = (newConfig: Partial<BrushConfig>) => {
    config.value = { ...config.value, ...newConfig }
    if (ctx.value) {
      ctx.value.strokeStyle = config.value.color
      ctx.value.lineWidth = config.value.lineWidth
    }
  }

  return {
    ctx,
    isDrawing,
    config,
    startDraw,
    draw,
    endDraw,
    clearCanvas: clearCanvasFunc,
    undo,
    redo,
    saveImage,
    updateConfig,
    // 暴露历史栈供外部使用（用于构建响应式检查）
    strokeHistory,
    historyIndex,
    hasUndo: () => historyIndex.value > 0,
    hasRedo: () => historyIndex.value < strokeHistory.value.length - 1,
    hasDrawingContent
  }
}
