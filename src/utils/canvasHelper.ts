import type { Point } from '@/types/game'

/**
 * 获取鼠标或触摸事件的坐标
 */
export function getEventPosition(
  e: MouseEvent | TouchEvent,
  canvas: HTMLCanvasElement
): Point {
  const rect = canvas.getBoundingClientRect()
  let clientX: number
  let clientY: number

  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

/**
 * 初始化 Canvas 背景
 */
export function initCanvasBackground(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
}

/**
 * 保存当前画布为图片
 */
export function saveCanvas(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

/**
 * 清空 Canvas
 */
export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height)
  initCanvasBackground(ctx, width, height)
}

/**
 * 模拟 AI 猜测结果（实际需接入第三方 API）
 */
export async function simulateAIGuess(): Promise<string[]> {
  const mockGuesses = [
    '太阳', '天空', '圆形', '天气', '白天',
    '光', '热', '云朵', '夏天', '黄色'
  ]
  // 模拟异步请求延迟
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
  return [mockGuesses[Math.floor(Math.random() * mockGuesses.length)]]
}
