import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHistoryStore, HistoryActionType } from './historyStore'

export const usePanelStore = defineStore('panel', () => {
  const DEFAULT_PROJECT_ID = 'proj_1'
  const cloneValue = (value) => JSON.parse(JSON.stringify(value))

  const createDefaultPage = () => ({
    id: Date.now(),
    projectId: DEFAULT_PROJECT_ID,
    projectName: '项目 1',
    name: '页面 1',
    components: []
  })

  const createDefaultProjectSettings = () => ({
    backgroundColor: '', // 留空则系统取默认浅色值
    backgroundImage: '',
    designResolution: '1080p',
    designWidth: 1920,
    designHeight: 1080
  })

  const cloneDefaultProjectSettings = () => ({ ...createDefaultProjectSettings() })

  // ========== 多页面数据结构 ==========
  const pages = ref([
    createDefaultPage()
  ])
  const currentPageIndex = ref(0)

  // 当前页面的组件列表（计算属性，兼容现有代码）
  const components = computed({
    get: () => pages.value[currentPageIndex.value]?.components || [],
    set: (val) => {
      if (pages.value[currentPageIndex.value]) {
        pages.value[currentPageIndex.value].components = val
      }
    }
  })

  // 当前页面
  const currentPage = computed(() => pages.value[currentPageIndex.value])
  const currentProjectId = computed(() => currentPage.value?.projectId || DEFAULT_PROJECT_ID)

  // 显示网格
  const showGrid = ref(true)

  // 拖动状态标志
  const isDragging = ref(false)

  // ============ 项目全局设置 ============
  const projectSettingsMap = ref({
    [DEFAULT_PROJECT_ID]: cloneDefaultProjectSettings()
  })

  const ensureProjectSettings = (projectId) => {
    const id = projectId || DEFAULT_PROJECT_ID
    if (!projectSettingsMap.value[id]) {
      projectSettingsMap.value[id] = cloneDefaultProjectSettings()
    }
    return projectSettingsMap.value[id]
  }

  const projectSettings = computed({
    get: () => ensureProjectSettings(currentProjectId.value),
    set: (value) => {
      const projectId = currentProjectId.value || DEFAULT_PROJECT_ID
      projectSettingsMap.value[projectId] = {
        ...cloneDefaultProjectSettings(),
        ...(value || {})
      }
    }
  })

  // 历史记录 store
  const historyStore = useHistoryStore()

  const createHistorySnapshot = () => ({
    version: '2.1-history',
    pages: cloneValue(pages.value),
    currentPageIndex: currentPageIndex.value,
    currentProjectId: currentProjectId.value,
    projectSettingsMap: cloneValue(projectSettingsMap.value)
  })

  const restoreHistorySnapshot = (snapshot) => {
    if (!snapshot) return

    // 兼容 v2.0 的 components 数组快照
    if (Array.isArray(snapshot)) {
      components.value = cloneValue(snapshot)
      return
    }

    const nextPages = Array.isArray(snapshot.pages) && snapshot.pages.length > 0
      ? cloneValue(snapshot.pages)
      : [createDefaultPage()]

    pages.value = nextPages
    projectSettingsMap.value = snapshot.projectSettingsMap
      ? cloneValue(snapshot.projectSettingsMap)
      : { [currentProjectId.value || DEFAULT_PROJECT_ID]: cloneDefaultProjectSettings() }
    currentPageIndex.value = Math.min(
      Math.max(Number(snapshot.currentPageIndex || 0), 0),
      pages.value.length - 1
    )
    ensureProjectSettings(currentProjectId.value)
  }

  const recordHistory = (action = {}) => {
    historyStore.pushHistory(createHistorySnapshot(), action)
  }

  // ========== 页面管理 ==========
  const addPage = (name, layoutComponents = [], isNewProject = false, projName = '') => {
    const currentProjId = pages.value[currentPageIndex.value]?.projectId || DEFAULT_PROJECT_ID
    const newProjectId = isNewProject ? 'proj_' + Date.now() : currentProjId
    const newProjectName = isNewProject ? (projName || `项目 ${new Set(pages.value.map(p => p.projectId)).size + 1}`) : (pages.value[currentPageIndex.value]?.projectName || '项目 1')

    const newPage = {
      id: Date.now() + Math.random(),
      projectId: newProjectId,
      projectName: newProjectName,
      name: name || `页面 ${pages.value.filter(p => p.projectId === newProjectId).length + 1}`,
      components: layoutComponents
    }
    pages.value.push(newPage)
    currentPageIndex.value = pages.value.length - 1
    ensureProjectSettings(newProjectId)
    
    saveHistory({
      type: isNewProject ? HistoryActionType.ADD_PROJECT : HistoryActionType.ADD_PAGE,
      description: isNewProject ? `新增项目: ${newProjectName}` : `新增页面: ${newPage.name}`,
      details: { pageId: newPage.id, projectId: newProjectId }
    })
    return newPage
  }

  const removePage = (index) => {
    if (pages.value.length <= 1) return
    const removedPage = pages.value[index]
    pages.value.splice(index, 1)
    if (currentPageIndex.value >= index) {
      currentPageIndex.value = Math.max(0, currentPageIndex.value - 1)
    }
    // 同步清理可能残留的组件
    components.value = components.value.filter(c => findComponentGlobal(c.id))
    
    // 修复全部项目的所有菜单组件的 pageIndex，防止数组偏移导致错乱
    pages.value.forEach(p => {
      p.components.forEach(c => {
        if (c.type === 'MenuBrick' || c.type === 'HeaderMenuBrick') {
          if (c.props && c.props.menuItems) {
            c.props.menuItems.forEach(item => {
              if (item.pageIndex > index) item.pageIndex -= 1
            })
          }
        }
      })
    })

    saveHistory({
      type: HistoryActionType.REMOVE_PAGE,
      description: `删除页面: ${removedPage.name}`,
      details: { pageId: removedPage.id, projectId: removedPage.projectId }
    })
  }

  // 移除整个项目
  const removeProject = (projectId) => {
    const projectPageCount = pages.value.filter(p => p.projectId === projectId).length
    if (projectPageCount === 0) return false

    if (projectPageCount === pages.value.length) {
      pages.value = [createDefaultPage()]
      currentPageIndex.value = 0
      projectSettingsMap.value = {
        [DEFAULT_PROJECT_ID]: cloneDefaultProjectSettings()
      }
      saveHistory({
        type: HistoryActionType.REMOVE_PROJECT,
        description: `删除项目: ${projectId}`,
        details: { projectId }
      })
      return true
    }

    const previousProjectId = currentProjectId.value
    const removedCurrentProject = previousProjectId === projectId

    for (let i = pages.value.length - 1; i >= 0; i--) {
      if (pages.value[i].projectId === projectId) {
        pages.value.splice(i, 1)
      }
    }
    delete projectSettingsMap.value[projectId]

    const nextProjectId = removedCurrentProject
      ? pages.value[0]?.projectId
      : previousProjectId
    if (nextProjectId) {
      switchProject(nextProjectId)
    } else {
      switchPage(0)
    }
    saveHistory({
      type: HistoryActionType.REMOVE_PROJECT,
      description: `删除项目: ${projectId}`,
      details: { projectId }
    })
    return true
  }

  // 切换项目（切换到目标项目的第一个页面）
  const switchProject = (projectId) => {
    const index = pages.value.findIndex(p => p.projectId === projectId)
    if (index === -1) return false
    ensureProjectSettings(projectId)
    switchPage(index)
    return true
  }

  const renamePage = (index, newName) => {
    if (pages.value[index] && newName && newName.trim()) {
      const previousName = pages.value[index].name
      pages.value[index].name = newName.trim()
      saveHistory({
        type: HistoryActionType.RENAME_PAGE,
        description: `重命名页面: ${previousName} -> ${pages.value[index].name}`,
        details: { pageId: pages.value[index].id, previousName, nextName: pages.value[index].name }
      })
    }
  }

  const switchPage = (index) => {
    if (index >= 0 && index < pages.value.length) {
      currentPageIndex.value = index
    }
  }

  // 应用项目模板（多页面）
  const applyProjectTemplate = (template) => {
    pages.value = template.pages.map((page, i) => ({
      id: Date.now() + i,
      projectId: page.projectId || DEFAULT_PROJECT_ID,
      projectName: page.projectName || '项目 1',
      name: page.name,
      components: page.layout.map((item, j) => ({
        id: Date.now() + i * 100 + j + Math.random(),
        name: item.title,
        type: 'PlaceholderBrick',
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        rotation: 0,
        props: { title: item.title },
        api: null,
        isBusinessComponent: false,
        echartTheme: '',
        colorPalette: '',
        locked: false,
        hidden: false,
        zIndex: j
      }))
    }))
    projectSettingsMap.value = {
      [DEFAULT_PROJECT_ID]: cloneDefaultProjectSettings()
    }
    pages.value.forEach(page => {
      ensureProjectSettings(page.projectId)
    })
    currentPageIndex.value = 0
    saveHistory({
      type: HistoryActionType.APPLY_LAYOUT,
      description: `应用项目模板: ${template.name || '未命名模板'}`,
      details: { pageCount: pages.value.length }
    })
  }

  // ========== 组件操作（操作当前页面） ==========

  // 所有页面的组件搜索助手
  const findComponentGlobal = (id) => {
    for (const page of pages.value) {
      const index = page.components.findIndex(c => c.id === id)
      if (index !== -1) {
        return { page, index, component: page.components[index] }
      }
    }
    return null
  }

  // 保存当前状态到历史记录
  const saveHistory = (action = {}) => {
    recordHistory({
      type: action.type || HistoryActionType.UPDATE_COMPONENT,
      description: action.description || '更新画布',
      ...action
    })
  }

  // 保存移动/调整大小/旋转的历史记录
  const saveTransformHistory = (componentId, type = 'move') => {
    const globalFound = findComponentGlobal(componentId)
    if (!globalFound) return
    const component = globalFound.component

    let actionType, description

    if (type === 'resize') {
      actionType = HistoryActionType.RESIZE_COMPONENT
      description = `调整大小: ${component.name}`
    } else if (type === 'rotate') {
      actionType = HistoryActionType.ROTATE_COMPONENT
      description = `旋转组件: ${component.name}`
    } else {
      actionType = HistoryActionType.MOVE_COMPONENT
      description = `移动组件: ${component.name}`
    }

    recordHistory({
      type: actionType,
      description,
      componentId: component.id,
      componentName: component.name,
      details: {
        position: { x: component.x, y: component.y },
        size: { width: component.width, height: component.height },
        rotation: component.rotation || 0
      }
    })
  }

  // 初始化历史记录（页面加载时调用）
  const initHistory = () => {
    historyStore.resetHistory(createHistorySnapshot(), {
      type: 'init',
      description: '初始化画布'
    })
  }

  // 添加组件到面板
  const addComponent = (component) => {
    const currentComponents = components.value
    const newZIndex = component.zIndex !== undefined ? component.zIndex : currentComponents.length
    const clone = (value) => (value ? JSON.parse(JSON.stringify(value)) : value)

    // 特殊逻辑：如果是添加菜单组件，且当前是单页面"页面 1"，将其重命名为"首页"
    if (component.type === 'MenuBrick' || component.type === 'HeaderMenuBrick') {
      if (pages.value.length === 1 && pages.value[0].name === '页面 1') {
        pages.value[0].name = '首页'
      }
      
      // 自动以当前实际存在的页面去同步其菜单显示（仅限当前项目）
      component.props = component.props || {}
      const currentProjId = pages.value[currentPageIndex.value]?.projectId || 'proj_1'
      component.props.menuItems = pages.value
        .map((p, i) => ({ name: p.name, pageIndex: i, projectId: p.projectId }))
        .filter(item => item.projectId === currentProjId)
        .map(({ name, pageIndex }) => ({ name, pageIndex }))
    }

    const newComponent = {
      id: component.id !== undefined ? component.id : Date.now() + Math.random(),
      name: component.name,
      type: component.type,
      x: component.x ?? 0,
      y: component.y ?? 0,
      width: component.width ?? 200,
      height: component.height ?? 150,
      rotation: component.rotation ?? 0,
      props: clone(component.props) || {},
      api: clone(component.api) || null,
      dataSourceId: component.dataSourceId,
      dataTransform: clone(component.dataTransform),
      events: clone(component.events),
      isBusinessComponent: component.isBusinessComponent || false,
      echartTheme: component.echartTheme || '',
      colorPalette: component.colorPalette || '',
      locked: component.locked || false,
      hidden: component.hidden || false,
      zIndex: newZIndex
    }

    currentComponents.push(newComponent)

    recordHistory({
      type: HistoryActionType.ADD_COMPONENT,
      description: `添加组件: ${newComponent.name}`,
      componentId: newComponent.id,
      componentName: newComponent.name,
      details: {
        type: newComponent.type,
        position: { x: newComponent.x, y: newComponent.y },
        size: { width: newComponent.width, height: newComponent.height }
      }
    })

    return newComponent
  }

  // 更新组件位置和大小（支持跨页面更新MenuBrick）
  const updateComponent = (id, updates) => {
    const globalFound = findComponentGlobal(id)
    if (globalFound) {
      const component = globalFound.page.components[globalFound.index]
      Object.assign(component, updates)
    }
  }

  // 删除组件（支持跨页面删除MenuBrick）
  const removeComponent = (id) => {
    const globalFound = findComponentGlobal(id)
    if (globalFound) {
      const component = globalFound.component
      globalFound.page.components.splice(globalFound.index, 1)

      recordHistory({
        type: HistoryActionType.REMOVE_COMPONENT,
        description: `删除组件: ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: {
          pageId: globalFound.page.id,
          type: component.type
        }
      })
    }
  }

  // 清空所有组件（当前页面）
  const clearComponents = () => {
    const count = components.value.length
    if (pages.value[currentPageIndex.value]) {
      pages.value[currentPageIndex.value].components = []
    }

    recordHistory({
      type: HistoryActionType.CLEAR_ALL,
      description: `清空画布 (${count} 个组件)`,
      details: { count }
    })
  }

  // 撤销
  const undo = () => {
    if (!historyStore.canUndo) return

    historyStore.isUndoRedoing = true
    historyStore.currentIndex--

    const snapshot = historyStore.history[historyStore.currentIndex].snapshot
    restoreHistorySnapshot(snapshot)

    historyStore.isUndoRedoing = false
  }

  // 重做
  const redo = () => {
    if (!historyStore.canRedo) return

    historyStore.isUndoRedoing = true
    historyStore.currentIndex++

    const snapshot = historyStore.history[historyStore.currentIndex].snapshot
    restoreHistorySnapshot(snapshot)

    historyStore.isUndoRedoing = false
  }

  // 图层管理：调整组件层级顺序（使用 z-index）
  const moveComponentLayer = (id, direction) => {
    const component = components.value.find(c => c.id === id)
    if (!component) return

    const sortedComponents = [...components.value].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    const currentIndex = sortedComponents.findIndex(c => c.id === id)

    if (direction === 'top') {
      const maxZIndex = Math.max(...components.value.map(c => c.zIndex || 0))
      component.zIndex = maxZIndex + 1
    } else if (direction === 'bottom') {
      const minZIndex = Math.min(...components.value.map(c => c.zIndex || 0))
      component.zIndex = minZIndex - 1
    } else if (direction === 'up') {
      if (currentIndex < sortedComponents.length - 1) {
        const upperComponent = sortedComponents[currentIndex + 1]
        const tempZIndex = component.zIndex
        component.zIndex = upperComponent.zIndex
        upperComponent.zIndex = tempZIndex
      }
    } else if (direction === 'down') {
      if (currentIndex > 0) {
        const lowerComponent = sortedComponents[currentIndex - 1]
        const tempZIndex = component.zIndex
        component.zIndex = lowerComponent.zIndex
        lowerComponent.zIndex = tempZIndex
      }
    }

    saveHistory({
      type: HistoryActionType.UPDATE_COMPONENT,
      description: `调整图层顺序: ${component.name}`,
      componentId: component.id,
      componentName: component.name,
      details: { direction }
    })
  }

  const resetProjectContent = () => {
    const projectId = currentProjectId.value || DEFAULT_PROJECT_ID
    const currentProjectPages = pages.value.filter(page => page.projectId === projectId)
    const firstProjectPageIndex = pages.value.findIndex(page => page.projectId === projectId)
    const projectName = currentProjectPages[0]?.projectName || '项目 1'
    const replacementPage = {
      id: Date.now(),
      projectId,
      projectName,
      name: '页面 1',
      components: []
    }

    if (currentProjectPages.length === pages.value.length) {
      pages.value = [replacementPage]
      currentPageIndex.value = 0
    } else {
      const remainingPages = pages.value.filter(page => page.projectId !== projectId)
      remainingPages.splice(Math.max(firstProjectPageIndex, 0), 0, replacementPage)
      pages.value = remainingPages
      currentPageIndex.value = Math.max(firstProjectPageIndex, 0)
    }

    saveHistory({
      type: HistoryActionType.CLEAR_ALL,
      description: '清空项目内容'
    })
  }

  const updateProjectSettings = (updates, action = {}) => {
    const previousSettings = cloneValue(projectSettings.value)
    projectSettings.value = {
      ...projectSettings.value,
      ...(updates || {})
    }

    if (JSON.stringify(previousSettings) !== JSON.stringify(projectSettings.value)) {
      saveHistory({
        type: HistoryActionType.UPDATE_PROJECT_SETTINGS,
        description: action.description || '更新项目设置',
        details: {
          previousSettings,
          nextSettings: cloneValue(projectSettings.value),
          ...(action.details || {})
        }
      })
    }
  }

  const updateDesignResolution = ({ designResolution, designWidth, designHeight }) => {
    projectSettings.value = {
      ...projectSettings.value,
      designResolution,
      designWidth,
      designHeight
    }
    resetProjectContent()
  }

  // 图层管理：按从顶层到底层的列表顺序重排组件层级
  const reorderComponentLayers = (orderedIdsFromTop) => {
    if (!Array.isArray(orderedIdsFromTop) || orderedIdsFromTop.length === 0) return

    const componentMap = new Map(components.value.map(c => [c.id, c]))
    const orderedIds = orderedIdsFromTop.filter(id => componentMap.has(id))
    if (orderedIds.length < 2) return

    orderedIds
      .slice()
      .reverse()
      .forEach((id, index) => {
        componentMap.get(id).zIndex = index
      })

    saveHistory({
      type: HistoryActionType.UPDATE_COMPONENT,
      description: '重排图层',
      details: { orderedIdsFromTop }
    })
  }

  // 图层管理：锁定/解锁组件
  const toggleLock = (id) => {
    const component = components.value.find(c => c.id === id)
    if (component) {
      component.locked = !component.locked
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${component.locked ? '锁定' : '解锁'}图层: ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: { locked: component.locked }
      })
    }
  }

  const setComponentLocked = (id, locked, recordHistory = true) => {
    const component = components.value.find(c => c.id === id)
    if (!component || component.locked === locked) return false

    component.locked = locked
    if (recordHistory) {
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${locked ? '锁定' : '解锁'}图层: ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: { locked }
      })
    }
    return true
  }

  const batchSetComponentsLocked = (ids, locked) => {
    const idSet = new Set(ids)
    let changedCount = 0

    components.value.forEach(component => {
      if (idSet.has(component.id) && component.locked !== locked) {
        component.locked = locked
        changedCount++
      }
    })

    if (changedCount > 0) {
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${locked ? '锁定' : '解锁'}图层 (${changedCount} 个)`,
        details: { count: changedCount, ids, locked }
      })
    }

    return changedCount
  }

  // 图层管理：隐藏/显示组件
  const toggleHidden = (id) => {
    const component = components.value.find(c => c.id === id)
    if (component) {
      component.hidden = !component.hidden
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${component.hidden ? '隐藏' : '显示'}图层: ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: { hidden: component.hidden }
      })
    }
  }

  const setComponentHidden = (id, hidden, recordHistory = true) => {
    const component = components.value.find(c => c.id === id)
    if (!component || component.hidden === hidden) return false

    component.hidden = hidden
    if (recordHistory) {
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${hidden ? '隐藏' : '显示'}图层: ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: { hidden }
      })
    }
    return true
  }

  const batchSetComponentsHidden = (ids, hidden) => {
    const idSet = new Set(ids)
    let changedCount = 0

    components.value.forEach(component => {
      if (idSet.has(component.id) && component.hidden !== hidden) {
        component.hidden = hidden
        changedCount++
      }
    })

    if (changedCount > 0) {
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `${hidden ? '隐藏' : '显示'}图层 (${changedCount} 个)`,
        details: { count: changedCount, ids, hidden }
      })
    }

    return changedCount
  }

  const batchRemoveComponents = (ids) => {
    const idSet = new Set(ids)
    const removedComponents = components.value.filter(component => idSet.has(component.id))
    if (removedComponents.length === 0) return 0

    components.value = components.value.filter(component => !idSet.has(component.id))
    saveHistory({
      type: HistoryActionType.REMOVE_COMPONENT,
      description: `批量删除组件 (${removedComponents.length} 个)`,
      details: {
        count: removedComponents.length,
        ids: removedComponents.map(component => component.id),
        names: removedComponents.map(component => component.name)
      }
    })

    return removedComponents.length
  }

  const batchAddComponents = (newComponents, action = {}) => {
    if (!Array.isArray(newComponents) || newComponents.length === 0) return []

    const addedComponents = []
    newComponents.forEach(component => {
      const currentComponents = components.value
      const newZIndex = component.zIndex !== undefined ? component.zIndex : currentComponents.length
      const clone = (value) => (value ? cloneValue(value) : value)
      const newComponent = {
        id: component.id !== undefined ? component.id : Date.now() + Math.random(),
        name: component.name,
        type: component.type,
        x: component.x ?? 0,
        y: component.y ?? 0,
        width: component.width ?? 200,
        height: component.height ?? 150,
        rotation: component.rotation ?? 0,
        props: clone(component.props) || {},
        api: clone(component.api) || null,
        dataSourceId: component.dataSourceId,
        dataTransform: clone(component.dataTransform),
        events: clone(component.events),
        isBusinessComponent: component.isBusinessComponent || false,
        echartTheme: component.echartTheme || '',
        colorPalette: component.colorPalette || '',
        locked: component.locked || false,
        hidden: component.hidden || false,
        zIndex: newZIndex
      }
      currentComponents.push(newComponent)
      addedComponents.push(newComponent)
    })

    saveHistory({
      type: HistoryActionType.ADD_COMPONENT,
      description: action.description || `批量添加组件 (${addedComponents.length} 个)`,
      details: {
        count: addedComponents.length,
        ids: addedComponents.map(component => component.id),
        names: addedComponents.map(component => component.name),
        ...(action.details || {})
      }
    })

    return addedComponents
  }

  // 图层管理：重命名组件
  const renameComponent = (id, newName) => {
    const component = components.value.find(c => c.id === id)
    if (component && newName && newName.trim()) {
      const previousName = component.name
      component.name = newName.trim()
      saveHistory({
        type: HistoryActionType.UPDATE_COMPONENT,
        description: `重命名组件: ${previousName} -> ${component.name}`,
        componentId: component.id,
        componentName: component.name,
        details: { previousName, nextName: component.name }
      })
    }
  }

  // 切换网格显示
  const toggleGrid = () => {
    showGrid.value = !showGrid.value
  }

  const exportEditorSchema = (projectMeta = {}) => {
    const projectId = projectMeta.id || currentProjectId.value || DEFAULT_PROJECT_ID
    const projectPages = pages.value.filter(page => page.projectId === projectId)
    const settings = {
      ...cloneDefaultProjectSettings(),
      ...(projectSettingsMap.value[projectId] || projectSettings.value || {})
    }

    return {
      version: '2.0.0',
      projectId,
      project: {
        id: projectId,
        name: projectMeta.name || projectPages[0]?.projectName || '未命名项目'
      },
      pages: JSON.parse(JSON.stringify(projectPages.length ? projectPages : pages.value)),
      currentPageIndex: Math.max(0, projectPages.findIndex(page => page.id === currentPage.value?.id)),
      showGrid: showGrid.value,
      settings,
      projectSettingsMap: {
        [projectId]: settings
      }
    }
  }

  const loadEditorSchema = (schema = {}, projectMeta = {}) => {
    const projectId = projectMeta.id || schema.projectId || DEFAULT_PROJECT_ID
    const projectName = projectMeta.name || schema.project?.name || '未命名项目'
    const schemaPages = Array.isArray(schema.pages) && schema.pages.length > 0
      ? schema.pages
      : [createDefaultPage()]

    pages.value = schemaPages.map((page, index) => ({
      id: page.id || `${projectId}_page_${index + 1}`,
      projectId,
      projectName,
      name: page.name || `页面 ${index + 1}`,
      components: Array.isArray(page.components) ? JSON.parse(JSON.stringify(page.components)) : []
    }))

    const settings = {
      ...cloneDefaultProjectSettings(),
      ...(schema.projectSettingsMap?.[projectId] || schema.settings || {})
    }
    projectSettingsMap.value = {
      [projectId]: settings
    }
    currentPageIndex.value = Math.min(
      Math.max(Number(schema.currentPageIndex || 0), 0),
      pages.value.length - 1
    )
    showGrid.value = schema.showGrid !== false
    ensureProjectSettings(projectId)
  }

  return {
    // 多页面
    pages,
    currentPageIndex,
    currentPage,
    currentProjectId,
    projectSettingsMap,
    addPage,
    removePage,
    removeProject,
    renamePage,
    switchPage,
    switchProject,
    applyProjectTemplate,
    // 组件（兼容）
    components,
    showGrid,
    isDragging,
    projectSettings,
    createHistorySnapshot,
    restoreHistorySnapshot,
    updateProjectSettings,
    updateDesignResolution,
    addComponent,
    updateComponent,
    removeComponent,
    clearComponents,
    saveHistory,
    saveTransformHistory,
    initHistory,
    undo,
    redo,
    moveComponentLayer,
    reorderComponentLayers,
    toggleLock,
    setComponentLocked,
    batchSetComponentsLocked,
    toggleHidden,
    setComponentHidden,
    batchSetComponentsHidden,
    batchRemoveComponents,
    batchAddComponents,
    renameComponent,
    toggleGrid,
    exportEditorSchema,
    loadEditorSchema
  }
}, {
  persist: {
    // v2.1: 编辑器业务内容以后端 Draft 为准，本地只保留 UI 偏好，避免旧缓存覆盖远端草稿。
    pick: ['showGrid']
  }
})
