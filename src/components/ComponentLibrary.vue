<template>
  <div class="component-library">
    <div class="library-toolbar">
      <el-input v-model="keyword" clearable placeholder="搜索组件" size="small">
        <template #prefix>
          <el-icon>
            <Search />
          </el-icon>
        </template>
      </el-input>
      <div class="library-meta">{{ filteredBricks.length }} / {{ brickLibrary.length }}</div>
    </div>

    <div class="library-filters">
      <button v-for="category in categories" :key="category.value" type="button" class="filter-chip"
        :class="{ active: activeCategory === category.value }" @click="activeCategory = category.value">
        {{ category.label }}
        <span>{{ category.count }}</span>
      </button>
    </div>

    <div class="library-content">
      <button
        v-for="brick in filteredBricks"
        :key="brick.type"
        class="brick-item"
        type="button"
        draggable="true"
        @dragstart="handleDragStart($event, brick)"
        @dblclick="addBrick(brick)"
      >
        <span class="brick-icon-wrap">
          <i :class="['brick-icon', brick.icon]"></i>
        </span>
        <span class="brick-info">
          <span class="brick-name-row">
            <span class="brick-name">{{ brick.name }}</span>
            <span class="brick-category">{{ getBrickCategory(brick).label }}</span>
          </span>
          <span class="brick-desc">{{ brick.defaultWidth }} × {{ brick.defaultHeight }} · {{ brick.type }}</span>
        </span>
        <el-tooltip :content="favoriteTypes.includes(brick.type) ? '取消收藏' : '收藏组件'" placement="top">
          <span class="favorite-action" :class="{ active: favoriteTypes.includes(brick.type) }"
            @click.stop="toggleFavorite(brick.type)">
            <el-icon>
              <StarFilled v-if="favoriteTypes.includes(brick.type)" />
              <Star v-else />
            </el-icon>
          </span>
        </el-tooltip>
      </button>

      <AppEmpty
        v-if="filteredBricks.length === 0"
        title="没有找到组件"
        description="请尝试更换关键词或清空搜索条件。"
        size="compact"
      >
        <template #actions>
          <el-button size="small" @click="clearFilters">清除筛选</el-button>
        </template>
      </AppEmpty>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { brickLibrary } from '../bricks'
import { usePanelStore } from '../stores/panelStore'
import { ElMessage } from 'element-plus'
import { Search, Star, StarFilled } from '@element-plus/icons-vue'
import AppEmpty from './common/AppEmpty.vue'

const panelStore = usePanelStore()
const keyword = ref('')
const activeCategory = ref('all')
const favoriteTypes = ref(JSON.parse(localStorage.getItem('lowcode2d_favorite_bricks') || '[]'))
const recentTypes = ref(JSON.parse(localStorage.getItem('lowcode2d_recent_bricks') || '[]'))

const categoryDefs = [
  { value: 'all', label: '全部', matcher: () => true },
  { value: 'favorite', label: '收藏', matcher: brick => favoriteTypes.value.includes(brick.type) },
  { value: 'recent', label: '最近', matcher: brick => recentTypes.value.includes(brick.type) },
  { value: 'navigation', label: '导航', matcher: brick => ['MenuBrick', 'HeaderMenuBrick'].includes(brick.type) },
  { value: 'interaction', label: '交互', matcher: brick => ['ButtonBrick'].includes(brick.type) },
  { value: 'chart', label: '图表', matcher: brick => /Chart|Radar|Gauge|Funnel|Bar|WaterDrop|Map/.test(brick.type) },
  { value: 'media', label: '媒体', matcher: brick => /Img|Video|HLS|FLV|Three|Cesium/.test(brick.type) }
]

const getBrickCategory = (brick) => {
  return categoryDefs.find(category =>
    !['all', 'favorite', 'recent'].includes(category.value) && category.matcher(brick)
  ) || { value: 'base', label: '基础' }
}

const categories = computed(() => {
  return categoryDefs
    .map(category => ({
      ...category,
      count: brickLibrary.filter(category.matcher).length
    }))
    .filter(category => category.value === 'all' || category.count > 0)
})

const filteredBricks = computed(() => {
  const value = keyword.value.trim().toLowerCase()
  const active = categoryDefs.find(category => category.value === activeCategory.value) || categoryDefs[0]

  return brickLibrary.filter(brick => {
    const matchesKeyword = !value || [brick.name, brick.type, brick.icon, getBrickCategory(brick).label]
      .filter(Boolean)
      .some(item => String(item).toLowerCase().includes(value))
    return active.matcher(brick) && matchesKeyword
  })
})

watch(favoriteTypes, (value) => {
  localStorage.setItem('lowcode2d_favorite_bricks', JSON.stringify(value))
}, { deep: true })

watch(recentTypes, (value) => {
  localStorage.setItem('lowcode2d_recent_bricks', JSON.stringify(value))
}, { deep: true })

const recordRecent = (type) => {
  recentTypes.value = [type, ...recentTypes.value.filter(item => item !== type)].slice(0, 8)
}

const toggleFavorite = (type) => {
  if (favoriteTypes.value.includes(type)) {
    favoriteTypes.value = favoriteTypes.value.filter(item => item !== type)
    return
  }
  favoriteTypes.value = [type, ...favoriteTypes.value]
}

const clearFilters = () => {
  keyword.value = ''
  activeCategory.value = 'all'
}

// 拖拽开始 - 传递组件数据
const handleDragStart = (event, brick) => {
  recordRecent(brick.type)
  const dragData = {
    source: 'component-library',
    type: brick.type,
    name: brick.name,
    defaultWidth: brick.defaultWidth,
    defaultHeight: brick.defaultHeight,
    defaultProps: brick.defaultProps || {}
  }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'copy'
}

// 双击快速添加，保留拖拽主流程之外的效率入口
const addBrick = (brick) => {
  recordRecent(brick.type)
  const randomX = Math.floor(Math.random() * 200)
  const randomY = Math.floor(Math.random() * 200)

  panelStore.addComponent({
    name: brick.name,
    type: brick.type,
    x: randomX,
    y: randomY,
    width: brick.defaultWidth,
    height: brick.defaultHeight,
    props: {
      title: brick.title,
      ...brick.defaultProps
    }
  })

  ElMessage({
    message: `已添加 ${brick.name}`,
    type: 'success',
    duration: 1500
  })
}
</script>

<style scoped>
.component-library {
  width: 100%;
  height: 100%;
  background: var(--lc-bg-page);
  display: flex;
  flex-direction: column;
}

.library-toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--lc-space-2);
  padding: var(--lc-space-3);
  background: var(--lc-bg-panel);
  border-bottom: 1px solid var(--lc-border-subtle);
}

.library-filters {
  flex-shrink: 0;
  display: flex;
  gap: var(--lc-space-2);
  padding: var(--lc-space-2) var(--lc-space-3);
  overflow-x: auto;
  background: var(--lc-bg-panel);
  border-bottom: 1px solid var(--lc-border-subtle);
}

.filter-chip {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: 999px;
  background: var(--lc-bg-panel);
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.filter-chip span {
  color: var(--lc-text-tertiary);
}

.filter-chip:hover,
.filter-chip.active {
  border-color: var(--lc-brand-500);
  background: var(--lc-bg-selected);
  color: var(--lc-brand-600);
}

.library-meta {
  flex-shrink: 0;
  min-width: 46px;
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
  text-align: right;
  white-space: nowrap;
}

.library-content {
  flex: 1;
  padding: var(--lc-space-3);
  overflow-y: auto;
}

.brick-item {
  width: 100%;
  min-height: 56px;
  margin: 0 0 var(--lc-space-2);
  padding: var(--lc-space-3);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-panel);
  color: inherit;
  display: flex;
  align-items: center;
  gap: var(--lc-space-3);
  text-align: left;
  cursor: grab;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.brick-item:active {
  cursor: grabbing;
}

.brick-item:hover {
  border-color: var(--lc-brand-500);
  background: var(--lc-bg-selected);
  box-shadow: var(--lc-shadow-sm);
}

.brick-item:focus-visible {
  outline: 2px solid var(--lc-brand-500);
  outline-offset: 2px;
}

.brick-icon-wrap {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: var(--lc-radius-md);
  background: var(--lc-brand-50);
  color: var(--lc-brand-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brick-icon {
  font-size: 18px;
  line-height: 1;
}

.brick-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brick-name-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--lc-space-2);
}

.brick-name {
  overflow: hidden;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  font-weight: 500;
  line-height: var(--lc-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.brick-category {
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: var(--lc-radius-sm);
  background: var(--lc-bg-subtle);
  color: var(--lc-text-tertiary);
  font-size: 11px;
  line-height: 18px;
}

.brick-desc {
  overflow: hidden;
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-action {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--lc-radius-md);
  color: var(--lc-text-tertiary);
  cursor: pointer;
}

.favorite-action:hover,
.favorite-action.active {
  background: var(--lc-warning-50);
  color: var(--lc-warning-600);
}

@media screen and (min-width: 2560px) {
  .library-toolbar,
  .library-filters,
  .library-content {
    padding: var(--lc-space-4);
  }

  .brick-item {
    min-height: 64px;
    margin-bottom: var(--lc-space-3);
  }

  .brick-icon-wrap {
    width: 36px;
    height: 36px;
  }
}
</style>
