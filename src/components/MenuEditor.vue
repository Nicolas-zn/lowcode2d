<template>
  <div class="menu-editor">
    <div class="menu-list">
      <div v-for="(item, index) in localItems" :key="index" class="menu-row">
        <el-icon class="drag-icon">
          <Rank />
        </el-icon>
        <el-input v-model="item.name" size="small" placeholder="菜单名称" @change="syncToComponent" />
        <el-button :icon="Delete" size="small" type="danger" text :disabled="localItems.length <= 1"
          @click="removeMenuItem(index)" />
      </div>
    </div>

    <el-button type="primary" :icon="Plus" size="small" @click="addMenuItem" style="width: 100%; margin-top: 8px;">
      添加菜单项
    </el-button>

    <el-divider />

    <el-form-item label="方向">
      <el-radio-group v-model="localDirection" size="small" @change="syncDirection">
        <el-radio-button value="horizontal">水平</el-radio-button>
        <el-radio-button value="vertical">垂直</el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="主题色">
      <el-color-picker v-model="localActiveColor" size="small" @change="syncActiveColor" />
    </el-form-item>

    <el-form-item label="背景色">
      <el-color-picker v-model="localBgColor" size="small" show-alpha @change="syncBgColor" />
    </el-form-item>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Delete, Plus, Rank } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { usePanelStore } from '../stores/panelStore'

const props = defineProps({
  component: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

const panelStore = usePanelStore()

// 本地菜单项列表（从component.props.menuItems同步）
const localItems = ref([])
const localDirection = ref('horizontal')
const localActiveColor = ref('#409eff')
const localBgColor = ref('rgba(0, 10, 30, 0.85)')

// 初始化
onMounted(() => {
  const p = props.component.props || {}
  localItems.value = JSON.parse(JSON.stringify(p.menuItems || [{ name: '首页', pageIndex: 0 }]))
  localDirection.value = p.direction || 'horizontal'
  localActiveColor.value = p.activeColor || '#409eff'
  localBgColor.value = p.bgColor || 'rgba(0, 10, 30, 0.85)'
})

watch(() => props.component.props?.menuItems, (newItems) => {
  if (newItems) {
    localItems.value = JSON.parse(JSON.stringify(newItems))
  }
}, { deep: true })

// 同步菜单项到组件 props
const syncToComponent = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    menuItems: JSON.parse(JSON.stringify(localItems.value)),
    direction: localDirection.value,
    activeColor: localActiveColor.value,
    bgColor: localBgColor.value
  })
}

const syncDirection = () => syncToComponent()
const syncActiveColor = () => syncToComponent()
const syncBgColor = () => syncToComponent()

// 添加菜单项 → 同时创建新页面
const addMenuItem = () => {
  const pageName = `页面 ${localItems.value.length + 1}`
  
  const currentPage = panelStore.pages[panelStore.currentPageIndex]
  let layoutComponents = []
  if (currentPage) {
    layoutComponents = currentPage.components.map(c => {
      const cloned = JSON.parse(JSON.stringify(c))
      // 如果是可视化组件或菜单组件，保持 ID 不变（菜单全局唯一，可视化复用实例）
      if (['CesiumBrick', 'ThreeJSBrick', 'MenuBrick', 'HeaderMenuBrick'].includes(cloned.type)) {
        return cloned
      }
      // 其他普通组件，生成新 ID，重新实例化
      cloned.id = Date.now() + Math.random()
      return cloned
    })
  }
  
  const newPage = panelStore.addPage(pageName, layoutComponents)
  localItems.value.push({ name: pageName, pageIndex: panelStore.pages.length - 1 })
  syncToComponent()
  ElMessage.success(`已添加菜单「${pageName}」和对应页面`)
}

// 删除菜单项 → 同时删除页面
const removeMenuItem = async (index) => {
  if (localItems.value.length <= 1) return

  const item = localItems.value[index]
  const pageIndex = item.pageIndex ?? index
  const page = panelStore.pages[pageIndex]

  // 检查页面是否有内容（非PlaceholderBrick的组件）
  if (page && page.components.filter(c => c.type !== 'PlaceholderBrick').length > 0) {
    try {
      await ElMessageBox.confirm(
        `页面「${item.name}」中有 ${page.components.filter(c => c.type !== 'PlaceholderBrick').length} 个组件，删除后不可恢复。是否继续？`,
        '删除确认',
        { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
  }

  // 先删页面，再删菜单项
  if (page) {
    panelStore.removePage(pageIndex)
  }
  localItems.value.splice(index, 1)

  // pageIndex已经在 panelStore中的 removePage 里全部修复了，但 localItems 对应的还没有修复
  localItems.value.forEach(it => {
    if (it.pageIndex > pageIndex) {
      it.pageIndex -= 1
    }
  })

  syncToComponent()
  ElMessage.success(`已删除菜单「${item.name}」`)
}
</script>

<style scoped>
.menu-editor {
  width: 100%;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-icon {
  cursor: grab;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
</style>
