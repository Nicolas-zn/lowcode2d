<template>
  <div class="header-menu-editor">
    <el-form-item label="大标题">
      <el-input v-model="localTitle" size="small" placeholder="请输入大标题" @change="syncTitle" />
    </el-form-item>

    <div class="two-col">
      <el-form-item label="标题颜色">
        <el-color-picker v-model="localTitleColor" size="small" @change="syncStyle" />
      </el-form-item>
      <el-form-item label="标题大号">
        <el-input-number v-model="localTitleSize" :min="12" :max="120" size="small" :step="2" @change="syncStyle" />
      </el-form-item>
    </div>

    <el-divider>菜单项管理</el-divider>

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

    <el-divider>样式设置</el-divider>

    <div class="two-col">
      <el-form-item label="主题色">
        <el-color-picker v-model="localActiveColor" size="small" @change="syncStyle" />
      </el-form-item>
      <el-form-item label="文本色">
        <el-color-picker v-model="localTextColor" size="small" @change="syncStyle" />
      </el-form-item>
    </div>
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

// 本地数据状态
const localTitle = ref('大屏可视化项目')
const localTitleColor = ref('#ffffff')
const localTitleSize = ref(32)
const localActiveColor = ref('#4ab2e4')
const localTextColor = ref('rgba(255, 255, 255, 0.75)')
const localItems = ref([])

onMounted(() => {
  const p = props.component.props || {}
  localTitle.value = p.title || '大屏可视化项目'
  localTitleColor.value = p.titleColor || '#ffffff'
  localTitleSize.value = p.titleSize || 32
  localActiveColor.value = p.activeColor || '#4ab2e4'
  localTextColor.value = p.textColor || 'rgba(255, 255, 255, 0.75)'
  localItems.value = JSON.parse(JSON.stringify(p.menuItems || [{ name: '首页', pageIndex: 0 }]))
})

watch(() => props.component.props?.menuItems, (newItems) => {
  if (newItems) {
    localItems.value = JSON.parse(JSON.stringify(newItems))
  }
}, { deep: true })

const syncToComponent = () => {
  emit('update:modelValue', {
    ...props.modelValue,
    title: localTitle.value,
    titleColor: localTitleColor.value,
    titleSize: localTitleSize.value,
    activeColor: localActiveColor.value,
    textColor: localTextColor.value,
    menuItems: JSON.parse(JSON.stringify(localItems.value))
  })
}

const syncTitle = () => syncToComponent()
const syncStyle = () => syncToComponent()

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

  // 检查页面是否有内容
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
.header-menu-editor {
  width: 100%;
}

.two-col {
  display: flex;
  gap: 12px;
}
.two-col > .el-form-item {
  flex: 1;
  margin-bottom: 12px;
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
