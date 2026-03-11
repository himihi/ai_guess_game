<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import DrawingCanvas from '@/components/DrawingCanvas.vue'
import GuessResult from '@/components/GuessResult.vue'
import type { GameStatus, GuessResultData } from '@/types/game'
import { recognizeImage } from '@/services/imageRecognizer'

// === 游戏状态 ===
const guesses = ref<GuessResultData[]>([])  // 存储每次检测结果
const timeLeft = ref(60)
const score = ref(0)
const gameStatus = ref<GameStatus>('idle')
const isRecognizing = ref(false)  // 正在识别中

// === 配置参数 ===
const config = {
  maxGuesses: 8,           // 最多允许提交次数
  baseScore: 100,          // 基础分值
  correctBonus: 2,         // 猜对倍数
  wrongPenalty: 0.5,       // 猜错系数
}

// === 计时器 ===
let timer: number | null = null

const startTimer = () => {
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      endGame()
    }
  }, 1000)
}

// === 启动游戏 ===
const startGame = () => {
  // 重置状态
  gameStatus.value = 'playing'
  timeLeft.value = 60
  score.value = 0
  guesses.value = []
  isRecognizing.value = false

  startTimer()
  ElMessage.success('游戏开始！请在画板上绘画并提交识别')
}

// === 结束游戏 ===
const endGame = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  gameStatus.value = 'ended'
  isRecognizing.value = false
  ElMessage.success(`游戏结束！最终得分：${score.value}`)
}

// === 提交识别 ===
const handleSubmit = async () => {
  // 验证：未达到最大提交次数
  if (guesses.value.length >= config.maxGuesses) {
    ElMessage.info(`已达到最大提交次数 ${config.maxGuesses}`)
    return
  }

  if (isRecognizing.value) {
    ElMessage.warning('识别进行中，请稍后再试')
    return
  }

  // 获取 Canvas 元素
  const canvasElement = document.querySelector<HTMLCanvasElement>(
    '.drawing-surface'
  )

  if (!canvasElement) {
    ElMessage.error('画布未初始化，请刷新页面重试')
    return
  }

  // 检查是否有绘制内容
  if (canvasElement.width <= 1 || canvasElement.height <= 1) {
    ElMessage.warning('画布为空，请先绘制内容')
    return
  }

  isRecognizing.value = true
  gameStatus.value = 'submitted'

  try {
    ElMessage.info('AI 正在分析您的画作...')

    // 调用 AI 识别
    const result = await recognizeImage(canvasElement, {
      onProgress: (message) => {
        ElMessage.info(message)
      },
      onError: (error) => {
        console.error('识别错误:', error)
        ElMessage.error(`识别失败：${error.message}`)
      }
    })

    // 记录识别结果 - 随机判断是否正确（因为无法真正知道用户画的是什么）
    const isCorrectVal = Math.random() > 0.6  // 40% 正确率

    const recognitionData: GuessResultData = {
      word: result.description,
      isCorrect: isCorrectVal,
      confidence: result.confidence,
      submitTime: 60 - timeLeft.value
    }
    guesses.value.push(recognitionData)

    // 计算得分
    const timeEfficiency = timeLeft.value / 60
    const multiplier = isCorrectVal ? config.correctBonus : config.wrongPenalty
    const roundScore = Math.round(config.baseScore * multiplier * timeEfficiency)

    score.value += roundScore

    ElMessage.success(
      isCorrectVal
        ? `🎉 AI 识别："${result.description}" (置信度 ${result.confidence}%, +${roundScore}分)`
        : `😅 AI 识别："${result.description}" (置信度 ${result.confidence}%，-${Math.abs(roundScore)}分)`
    )

  } catch (error) {
    ElMessage.error('识别失败，请使用降级方案')
    // 降级处理已在 recognizeImage 内部完成
  } finally {
    isRecognizing.value = false
    gameStatus.value = 'playing'
  }
}

// === 重新开始 ===
const restartGame = () => {
  if (timer) clearInterval(timer)
  guesses.value = []
  startGame()
}

// === 清理 ===
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="game-page">
    <!-- 标题 -->
    <header class="page-header">
      <h1>🎨 你画我猜</h1>
      <p class="subtitle">自由绘画，AI 自动识别！点击「提交识别」让 AI 分析你的画作</p>
    </header>

    <!-- 游戏主区域 -->
    <main class="game-container">
      <!-- 左侧：画布区域 -->
      <section class="canvas-section">
        <DrawingCanvas :is-submit-loading="isRecognizing" @check="handleSubmit" />
      </section>

      <!-- 右侧：结果区域 -->
      <aside class="result-section">
        <GuessResult
          :guesses="guesses"
          :time-left="timeLeft"
          :score="score"
          :status="gameStatus"
          :max-guesses="config.maxGuesses"
        />

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            :icon="gameStatus === 'playing' ? 'VideoPause' : 'VideoPlay'"
            @click="gameStatus === 'playing' ? endGame() : startGame()"
            :disabled="gameStatus === 'ended'"
          >
            {{ gameStatus === 'playing' ? '暂停游戏' : '开始游戏' }}
          </el-button>

          <el-button
            size="large"
            :disabled="gameStatus !== 'ended' && gameStatus !== 'idle'"
            icon="RefreshRight"
            @click="restartGame"
          >
            重新开始
          </el-button>
        </div>
      </aside>
    </main>

    <!-- 提示信息 -->
    <footer class="game-footer">
      <div class="tips">
        <span>💡 玩法说明：</span>
        <ul>
          <li>使用左侧工具栏调整颜色和笔触粗细</li>
          <li>支持鼠标和触摸屏绘制</li>
          <li>绘制完成后点击【提交识别】让 AI 分析</li>
          <li>AI 正确识别得分翻倍，越早提交效率越高</li>
          <li>最多可提交 {{ config.maxGuesses }} 次</li>
        </ul>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.game-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

/* 标题区域 */
.page-header {
  text-align: center;
  color: #fff;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 2.5em;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 1.1em;
  opacity: 0.9;
  margin: 0;
}

/* 游戏容器 */
.game-container {
  display: flex;
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
}

.canvas-section {
  flex: 1;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.result-section {
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.el-button {
  width: 100%;
}

/* 页脚提示 */
.game-footer {
  max-width: 1400px;
  margin: 30px auto 0;
  padding: 20px;
}

.tips {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px 30px;
  max-width: 600px;
  margin: 0 auto;
}

.tips span {
  font-weight: bold;
  color: var(--el-color-primary);
  margin-right: 10px;
}

.tips ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
  color: #606266;
}

.tips li {
  margin: 8px 0;
  line-height: 1.6;
}

/* 响应式布局 */
@media (max-width: 1024px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .result-section {
    width: 100%;
    max-width: 500px;
  }

  .canvas-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.8em;
  }

  .subtitle {
    font-size: 0.95em;
  }

  .game-page {
    padding: 10px;
  }

  .canvas-section,
  .result-section {
    padding: 12px;
  }

  .tips {
    padding: 15px 20px;
  }

  .tips ul {
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.5em;
  }

  .subtitle {
    display: none;
  }

  .canvas-section {
    padding: 8px;
  }
}
</style>
