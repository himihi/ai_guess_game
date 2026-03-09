<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import type { GuessResultProps } from '@/types/game'

const props = withDefaults(defineProps<GuessResultProps>(), {
  timeLeft: 60,
  score: 0,
  isCorrect: () => false,
  maxGuesses: 8
})

// 格式化时间显示
const formattedTime = computed(() => {
  const minutes = Math.floor(props.timeLeft / 60)
  const seconds = props.timeLeft % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// 倒计时进度百分比
const progressPercent = computed(() => {
  return (props.timeLeft / 60) * 100
})

// 猜测列表（存储检测结果对象）
const guessList = ref<NonNullable<GuessResultProps['guesses']>>([])

// 监听猜测列表变化
watchEffect(() => {
  guessList.value = [...props.guesses]
})

// 游戏状态文本和样式 - use the status directly without mapping
const getStatusColorClass = (): string => {
  const status = props.status || 'playing'
  switch (status) {
    case 'playing': return 'status-playing'
    case 'submitted': return 'status-submitted'
    case 'ended': return 'status-ended'
    default: return 'status-playing'
  }
}

const statusText = computed(() => {
  const status = props.status || 'playing'
  switch (status) {
    case 'playing': return '等待提交...'
    case 'submitted': return '检测中...'
    case 'ended': return '游戏结束'
    default: return '准备中'
  }
})

// 正确次数统计
const correctCount = computed(() => {
  return guessList.value.filter(g => g.isCorrect).length
})

// 计算本轮得分（基于检测结果）
const calculateRoundScore = (result: typeof guessList.value[0]): number => {
  const baseScore = 100
  const multiplier = result.isCorrect ? 2 : 0.5
  const timeEfficiency = (60 - result.submitTime) / 60
  return Math.round(baseScore * multiplier * timeEfficiency)
}
</script>

<template>
  <div class="guess-result">
    <!-- 本轮 AI 检测结果 -->
    <div class="section header-section">
      <h3 class="section-title">🤖 AI 智能识别</h3>
      <div class="target-word">自由绘画，AI 自动分析</div>
    </div>

    <!-- 计时器 -->
    <div class="section timer-section">
      <div class="timer-display">
        <span :class="{ 'urgent': props.timeLeft <= 10 }">⏱️ {{ formattedTime }}</span>
      </div>
      <el-progress
        :percentage="Math.round(progressPercent)"
        :stroke-width="6"
        :color="progressPercent <= 30 ? '#f56c6c' : progressPercent <= 60 ? '#e6a23c' : '#67c23a'"
      />
    </div>

    <!-- 提交按钮状态指示 -->
    <div class="section submit-status-section" v-if="props.status !== 'ended'">
      <div class="status-indicator" :class="getStatusColorClass()">
        {{ statusText }}
      </div>
    </div>

    <!-- AI 实时检测结果列表 -->
    <div class="section">
      <h3 class="section-title">📋 识别记录 ({{ guessList.length }}/{{ props.maxGuesses || 8 }})</h3>
      <ul class="guess-list">
        <li
          v-for="(result, index) in guessList"
          :key="index"
          class="guess-item"
          :class="{ correct: result.isCorrect, submitted: true }"
        >
          <div class="guess-left">
            <el-icon><ZoomIn /></el-icon>
            <span class="guess-text">{{ result.word }}</span>
            <el-tag
              :type="result.isCorrect ? 'success' : 'danger'"
              size="small"
              effect="light"
            >
              {{ result.isCorrect ? '🎉 识别成功' : '😅 识别偏差' }}
            </el-tag>
          </div>
          <div class="guess-right">
            <span class="confidence">置信度：{{ result.confidence }}%</span>
            <span class="submit-time">用时：{{ 60 - result.submitTime }}s</span>
            <span class="score">{{ result.isCorrect ? '+' : '-' }}{{ Math.abs(calculateRoundScore(result)) }}</span>
          </div>
        </li>
        <li v-if="guessList.length === 0" class="empty-guess">
          <el-empty description="暂无检测结果" :image-size="60" />
        </li>
      </ul>
    </div>

    <!-- 统计信息 -->
    <div class="section stats-section">
      <div class="stat-item">
        <span class="stat-label">🏆 总分</span>
        <span class="stat-value">{{ props.score }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">🎯 准确率</span>
        <span class="stat-value success">{{ guessList.length > 0 ? Math.round((correctCount / guessList.length) * 100) : 0 }}%</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">⏱️ 剩余</span>
        <span class="stat-value urgent">{{ formattedTime }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guess-result {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

/* 通用标题样式 */
.header-section,
.section {
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
  padding-left: 8px;
  border-left: 4px solid var(--el-color-primary);
}

/* 目标词 */
.target-word {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  color: var(--el-color-primary);
  letter-spacing: 2px;
}

/* 计时器 */
.timer-section {
  width: 100%;
}

.timer-display {
  text-align: center;
  margin-bottom: 12px;
}

.urgent {
  color: #f56c6c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 提交状态指示器 */
.submit-status-section {
  width: 100%;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
}

.status-playing {
  background: #f0f9eb;
  color: #67c23a;
  border: 1px solid #c2e7b0;
}

.status-submitted {
  background: #ecf5ff;
  color: #409eff;
  border: 1px solid #b3d8ff;
}

.status-ended {
  background: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fbc4c4;
}

/* 猜测列表 */
.guess-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 250px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.guess-list::-webkit-scrollbar {
  width: 6px;
}

.guess-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.guess-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.guess-item:hover {
  background: #edf2f7;
  transform: translateX(4px);
}

.guess-item.correct {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
}

.guess-item.submitted .guess-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.guess-item .el-icon {
  color: var(--el-color-info);
}

.guess-text {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  flex: 1;
}

.guess-right {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #909399;
  padding-left: 28px;
}

.confidence {
  color: #e6a23c;
}

.submit-time {
  color: #909399;
}

.score {
  color: #67c23a;
  font-weight: 600;
}

.empty-guess {
  text-align: center;
  color: #909399;
  padding: 20px;
}

/* 统计信息 */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.stat-value.success {
  color: #67c23a;
  font-weight: bold;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-title {
    font-size: 14px;
  }

  .guess-item {
    padding: 8px 10px;
  }

  .guess-text {
    font-size: 13px;
  }
}
</style>
