<template>
  <div class="project-settings-panel">
    <el-form label-position="top">
      <el-form-item label="设计分辨率">
        <el-select v-model="resolutionForm.type" placeholder="请选择设计分辨率" style="width: 100%" @change="handlePresetChange">
          <el-option label="1080p（1920 × 1080）" value="1080p" />
          <el-option label="2K（2560 × 1440）" value="2k" />
          <el-option label="4K（3840 × 2160）" value="4k" />
          <el-option label="自定义" value="custom" />
        </el-select>
      </el-form-item>

      <div v-if="resolutionForm.type === 'custom'" class="resolution-grid">
        <el-form-item label="宽度">
          <el-input-number v-model="resolutionForm.width" :min="320" :max="10000" :step="10" controls-position="right" />
        </el-form-item>
        <el-form-item label="高度">
          <el-input-number v-model="resolutionForm.height" :min="240" :max="10000" :step="10" controls-position="right" />
        </el-form-item>
      </div>

      <el-button class="apply-button" type="primary" @click="applyResolution">
        应用设计分辨率
      </el-button>
      <div class="tip-text resolution-tip">切换设计分辨率会清空现有画布和页面内容。</div>

      <el-form-item label="背景颜色">
        <el-color-picker v-model="settingsForm.backgroundColor" show-alpha @change="handleBackgroundColorChange" />
      </el-form-item>
      <el-form-item label="背景图片 URL">
        <el-input 
          v-model="settingsForm.backgroundImage"
          placeholder="输入图片地址" 
          clearable
          @change="handleBackgroundImageChange"
        />
        <div class="tip-text">支持输入基于 http(s):// 开头的图片地址链接。</div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePanelStore } from '../stores/panelStore'

const panelStore = usePanelStore()

const RESOLUTION_PRESETS = {
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 }
}

const resolutionForm = reactive({
  type: panelStore.projectSettings.designResolution || '1080p',
  width: panelStore.projectSettings.designWidth || 1920,
  height: panelStore.projectSettings.designHeight || 1080
})

const settingsForm = reactive({
  backgroundColor: panelStore.projectSettings.backgroundColor || '',
  backgroundImage: panelStore.projectSettings.backgroundImage || ''
})

const handlePresetChange = (value) => {
  const preset = RESOLUTION_PRESETS[value]
  if (!preset) return
  resolutionForm.width = preset.width
  resolutionForm.height = preset.height
}

const applyResolution = async () => {
  const currentSettings = panelStore.projectSettings
  const nextWidth = Number(resolutionForm.width)
  const nextHeight = Number(resolutionForm.height)

  if (!Number.isFinite(nextWidth) || !Number.isFinite(nextHeight) || nextWidth <= 0 || nextHeight <= 0) {
    ElMessage.warning('请输入有效的设计分辨率')
    return
  }

  const unchanged =
    currentSettings.designResolution === resolutionForm.type &&
    currentSettings.designWidth === nextWidth &&
    currentSettings.designHeight === nextHeight

  if (unchanged) {
    ElMessage.info('设计分辨率未变化')
    return
  }

  try {
    await ElMessageBox.confirm(
      '切换设计分辨率会清空现有画布和页面内容，是否继续？',
      '切换设计分辨率',
      {
        confirmButtonText: '继续切换',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    panelStore.updateDesignResolution({
      designResolution: resolutionForm.type,
      designWidth: nextWidth,
      designHeight: nextHeight
    })
    ElMessage.success('设计分辨率已更新，画布内容已清空')
  } catch {
    resolutionForm.type = currentSettings.designResolution || '1080p'
    resolutionForm.width = currentSettings.designWidth || 1920
    resolutionForm.height = currentSettings.designHeight || 1080
  }
}

const handleBackgroundColorChange = (value) => {
  panelStore.updateProjectSettings(
    { backgroundColor: value || '' },
    { description: '更新背景颜色' }
  )
}

const handleBackgroundImageChange = (value) => {
  panelStore.updateProjectSettings(
    { backgroundImage: value || '' },
    { description: '更新背景图片' }
  )
}

watch(
  () => panelStore.projectSettings,
  (settings) => {
    resolutionForm.type = settings.designResolution || '1080p'
    resolutionForm.width = settings.designWidth || 1920
    resolutionForm.height = settings.designHeight || 1080
    settingsForm.backgroundColor = settings.backgroundColor || ''
    settingsForm.backgroundImage = settings.backgroundImage || ''
  },
  { deep: true }
)
</script>

<style scoped>
.project-settings-panel {
  padding: 16px;
  height: 100%;
}

.resolution-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.resolution-grid :deep(.el-input-number) {
  width: 100%;
}

.apply-button {
  width: 100%;
  margin-bottom: 8px;
}

.resolution-tip {
  margin-bottom: 18px;
}

.tip-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  margin-top: 4px;
}
</style>
