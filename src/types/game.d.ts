/**
 * 游戏类型定义
 */

// 画笔配置
export interface BrushConfig {
  color: string
  lineWidth: number
}

// 点坐标
export interface Point {
  x: number
  y: number
}

// stroke (一笔)
export interface Stroke {
  points: Point[]
  color: string
  lineWidth: number
}

// 游戏状态枚举
export type GameStatus = 'idle' | 'playing' | 'submitted' | 'ended'

// 单次检测结果
export interface GuessResultData {
  word: string           // AI 猜测的词
  isCorrect: boolean     // 是否正确
  confidence: number     // 置信度 (0-100)
  submitTime: number     // 提交时刻 (距离游戏开始的秒数)
}

// 评分计算参数
export interface ScoreParams {
  baseScore: number      // 基础分 (如 100 分)
  accuracyMultiplier: number  // 准确率系数 (猜对则×2)
  timeEfficiency: number    // 效率系数 (越快越高，0.5-1.0)
}

// 猜测结果组件 props
export interface GuessResultProps {
  targetWord?: string                    // 当前目标词（可选）
  guesses: GuessResultData[]             // 存储所有检测结果
  timeLeft?: number                      // 剩余秒数
  score?: number                         // 当前得分
  status?: GameStatus                    // 游戏状态
  isCorrect?: (word: string) => boolean  // 判断是否正确的函数
  canSubmit?: boolean                    // 新增：是否允许提交 (有绘制内容时可用)
  maxGuesses?: number                    // 最大提交次数
  onCheck?: () => void                   // 检测回调
}

// 画布组件 props
export interface DrawingCanvasProps {
  width?: number    // 画布宽度，默认 500
  height?: number   // 画布高度，默认 400
}

// 画布组件 emits
export interface DrawingCanvasEmits {
  (e: 'update:image', dataUrl: string): void
  (e: 'clear'): void
  (e: 'check'): void
  (e: 'update:isSubmitLoading', value: boolean): void
}
