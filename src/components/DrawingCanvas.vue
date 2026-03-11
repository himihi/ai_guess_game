<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { DrawingCanvasProps, DrawingCanvasEmits } from '@/types/game'
import { initCanvasBackground } from '@/utils/canvasHelper'
import { useDrawing } from '@/composables/useDrawing'

const props = withDefaults(defineProps<DrawingCanvasProps & { isSubmitLoading?: boolean }>(), {
  width: 500,
  height: 400,
  isSubmitLoading: false
})

const emit = defineEmits<DrawingCanvasEmits>()

const canvasRef = ref<HTMLCanvasElement>()

// 初始化标志
let initialized = false

const {
  ctx,
  config,
  startDraw,
  draw,
  endDraw,
  clearCanvas: handleClearCanvas,
  undo,
  redo,
  updateConfig,
  hasUndo,
  hasRedo,
  strokeHistory,
  historyIndex
} = useDrawing(canvasRef)

// 更新配置时也重新绑定事件
watch(config, () => {
  if (ctx.value) {
    updateConfig({ color: config.value.color, lineWidth: config.value.lineWidth })
  }
}, { deep: true })

// 工具栏操作
const handleClear = () => {
  if (!canvasRef.value) return
  handleClearCanvas()
  emit('clear')
}

const handleUndo = () => {
  if (hasUndo()) {
    undo()
  }
}

const handleRedo = () => {
  if (hasRedo()) {
    redo()
  }
}

// 检测是否有绘制内容（使用响应式 ref）
const canSubmit = computed(() => {
  return strokeHistory.value.length > 0 && historyIndex.value >= 0
})

// 初始化 Canvas（在 DOM 渲染后）
const initCanvasOnce = () => {
  if (!initialized && canvasRef.value) {
    const newCtx = canvasRef.value.getContext('2d')
    if (newCtx) {
      // 设置 canvas 分辨率
      canvasRef.value.width = props.width
      canvasRef.value.height = props.height

      ctx.value = newCtx
      initCanvasBackground(newCtx, props.width, props.height)

      newCtx.strokeStyle = config.value.color
      newCtx.lineWidth = config.value.lineWidth
      newCtx.lineCap = 'round'
      newCtx.lineJoin = 'round'

      initialized = true
    }
  }
}

// 组件挂载后初始化
onMounted(() => {
  initCanvasOnce()
})
</script>

<template>
  <div class="drawing-canvas">
    <!-- 画布区域 -->
    <div class="canvas-wrapper">
      <canvas
        ref="canvasRef"
        class="drawing-surface"
        @mousedown="startDraw($event)"
        @mousemove="draw($event)"
        @mouseup="endDraw()"
        @mouseleave="endDraw()"
        @touchstart.prevent="startDraw($event)"
        @touchmove.prevent="draw($event)"
        @touchend.prevent="endDraw()"
      ></canvas>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-group">
        <label class="color-picker-label">颜色</label>
        <input
          type="color"
          v-model="config.color"
          class="color-input"
          @input="updateConfig({ color: config.color })"
        >
      </div>

      <div class="toolbar-group">
        <label class="brush-size-label">粗细：{{ config.lineWidth }}px</label>
        <input
          type="range"
          v-model.number="config.lineWidth"
          min="1"
          max="20"
          class="brush-range"
          @input="updateConfig({ lineWidth: config.lineWidth })"
        >
      </div>

      <div class="toolbar-group actions">
        <el-tooltip content="撤销" placement="top">
          <el-button
            :disabled="!hasUndo()"
            icon="RefreshLeft"
            circle
            size="small"
            @click="handleUndo"
          />
        </el-tooltip>

        <el-tooltip content="重做" placement="top">
          <el-button
            :disabled="!hasRedo()"
            icon="RefreshRight"
            circle
            size="small"
            @click="handleRedo"
          />
        </el-tooltip>

        <el-tooltip content="清空画布" placement="top">
          <el-button
            icon="Delete"
            circle
            size="small"
            type="warning"
            @click="handleClear"
          />
        </el-tooltip>

        <el-tooltip content="提交识别" placement="top">
          <el-button
            icon="Check"
            circle
            size="small"
            type="success"
            :disabled="!canSubmit || props.isSubmitLoading"
            :loading="props.isSubmitLoading"
            @click="emit('check')"
          />
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.drawing-canvas {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-wrapper {
  position: relative;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
}

.drawing-surface {
  display: block;
  cursor: crosshair;
  touch-action: none;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-group.actions {
  margin-left: auto;
}

.color-picker-label {
  font-size: 14px;
  color: #606266;
}

.color-input {
  width: 40px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.brush-size-label {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.brush-range {
  width: 100px;
  cursor: pointer;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .toolbar-group.actions {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
}
</style>
