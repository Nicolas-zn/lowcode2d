<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Box,
  Clock,
  CopyDocument,
  DataLine,
  Delete,
  Document,
  Edit,
  Files,
  Folder,
  Headset,
  Picture,
  Plus,
  RefreshLeft,
  Search,
  Setting,
  Star,
  SwitchButton,
  Upload,
  UserFilled,
  VideoCamera,
  View
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'
import { useMarketplaceStore } from '@/stores/marketplaceStore'
import { useProjectStore } from '@/stores/projectStore'
import { useResourceCenterStore } from '@/stores/resourceCenterStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import AppEmpty from '@/components/common/AppEmpty.vue'
import AppError from '@/components/common/AppError.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import DataSourcePanel from '@/components/DataSourcePanel.vue'
import { getAssetDisplayUrl } from '@/utils/assetUrl'

const router = useRouter()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const projectStore = useProjectStore()
const resourceCenterStore = useResourceCenterStore()
const marketplaceStore = useMarketplaceStore()
const createDialogVisible = ref(false)
const resourceDialogVisible = ref(false)
const assetDialogVisible = ref(false)
const publishDialogVisible = ref(false)
const activeNav = ref('projects')
const assetFile = ref(null)
const selectedPublishProject = ref(null)
const logoutLoading = ref(false)
const failedCoverUrls = ref(new Set())
const createForm = ref({
  name: '',
  description: ''
})
const resourceForm = ref({
  name: '',
  type: 'REST_API',
  baseUrl: ''
})
const assetForm = ref({
  name: '',
  tags: ''
})
const publishForm = ref({
  title: '',
  summary: '',
  description: '',
  category: 'dashboard',
  tags: ''
})

const navItems = [
  { key: 'projects', label: '我的项目', icon: Folder },
  { key: 'recent', label: '最近打开', icon: Clock },
  { key: 'favorites', label: '收藏', icon: Star },
  { key: 'marketplace', label: 'Marketplace', icon: Box },
  { key: 'templates', label: '模板', icon: Files },
  { key: 'resources', label: '资源', icon: Box },
  { key: 'datasources', label: '数据源', icon: DataLine },
  { key: 'assets', label: '资产', icon: Files },
  { key: 'trash', label: '回收站', icon: Delete },
  { key: 'settings', label: '设置', icon: Setting }
]
const resourceTypes = [
  { label: 'REST API', value: 'REST_API' },
  { label: 'GraphQL', value: 'GRAPHQL' },
  { label: 'PostgreSQL', value: 'POSTGRESQL' },
  { label: 'MySQL', value: 'MYSQL' },
  { label: 'Redis', value: 'REDIS' },
  { label: 'OpenAPI', value: 'OPENAPI' }
]
const centerTitleMap = {
  projects: '我的项目',
  marketplace: 'Marketplace',
  resources: '资源中心',
  datasources: '数据源中心',
  assets: '资产中心',
  trash: '回收站'
}

const activeWorkspace = computed(() => workspaceStore.activeWorkspace)
const workspaceStats = computed(() => {
  const count = activeWorkspace.value?._count || {}
  return [
    { label: '项目', value: projectStore.projects.length || count.projects || 0 },
    { label: '资源', value: count.resources || 0 },
    { label: '资产', value: count.assets || 0 }
  ]
})

const formatDate = (value) => {
  if (!value) return '未知时间'
  return new Date(value).toLocaleString()
}

const formatFileSize = (value) => {
  const bytes = Number(value) || 0
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const isImageAsset = (asset) => asset.file?.mime?.startsWith('image/')

const getAssetIcon = (asset) => {
  const mime = asset.file?.mime || ''
  if (mime.startsWith('video/')) return VideoCamera
  if (mime.startsWith('audio/')) return Headset
  if (mime.startsWith('image/')) return Picture
  return Document
}

const getAssetTypeLabel = (asset) => {
  const mime = asset.file?.mime || ''
  if (mime.startsWith('image/')) return '图片'
  if (mime.startsWith('video/')) return '视频'
  if (mime.startsWith('audio/')) return '音频'
  if (mime.startsWith('font/')) return '字体'
  if (mime.includes('json')) return 'JSON'
  return mime.split('/')[1]?.toUpperCase() || '文件'
}

const hasUsableCover = (url) => Boolean(url) && !failedCoverUrls.value.has(url)

const markCoverFailed = (url) => {
  if (url) failedCoverUrls.value.add(url)
}

onMounted(async () => {
  await workspaceStore.fetchWorkspaces()
  await fetchProjects()
  await fetchActiveCenter()
})

watch(() => workspaceStore.activeWorkspaceId, () => {
  fetchProjects()
  fetchActiveCenter()
})

const fetchProjects = () => {
  return projectStore.fetchProjects(activeWorkspace.value?.id)
}

const fetchActiveCenter = () => {
  if (!activeWorkspace.value?.id) return Promise.resolve()
  if (activeNav.value === 'resources') return resourceCenterStore.fetchResources(activeWorkspace.value.id)
  if (activeNav.value === 'assets') return resourceCenterStore.fetchAssets(activeWorkspace.value.id)
  if (activeNav.value === 'marketplace') return marketplaceStore.fetchItems()
  if (activeNav.value === 'trash') {
    projectStore.status = 'trashed'
    return projectStore.fetchProjects(activeWorkspace.value.id)
  }
  if (activeNav.value === 'projects') {
    projectStore.status = 'active'
    return fetchProjects()
  }
  return Promise.resolve()
}

const switchNav = (key) => {
  activeNav.value = key
  fetchActiveCenter()
}

const handlePrimaryAction = () => {
  if (activeNav.value === 'resources') return openResourceDialog()
  if (activeNav.value === 'assets') return openAssetDialog()
  return openCreateDialog()
}

const openCreateDialog = () => {
  createForm.value = {
    name: '未命名项目',
    description: ''
  }
  createDialogVisible.value = true
}

const openResourceDialog = () => {
  resourceForm.value = {
    name: '新建 REST 资源',
    type: 'REST_API',
    baseUrl: ''
  }
  resourceDialogVisible.value = true
}

const openAssetDialog = () => {
  assetForm.value = {
    name: '',
    tags: ''
  }
  assetFile.value = null
  assetDialogVisible.value = true
}

const openPublishDialog = (project) => {
  selectedPublishProject.value = project
  publishForm.value = {
    title: project.name,
    summary: project.description || '',
    description: project.description || '',
    category: 'dashboard',
    tags: ''
  }
  publishDialogVisible.value = true
}

const createProject = async () => {
  if (!activeWorkspace.value?.id || !createForm.value.name.trim()) return

  const project = await projectStore.createProject({
    workspaceId: activeWorkspace.value.id,
    name: createForm.value.name.trim(),
    description: createForm.value.description.trim() || undefined
  })
  createDialogVisible.value = false
  ElMessage.success('项目已创建')
  goEditor(project.id)
}

const goEditor = (projectId) => {
  if (!projectId) {
    openCreateDialog()
    return
  }
  router.push({ name: 'editor', params: { projectId } })
}

const duplicateProject = async (project) => {
  const duplicated = await projectStore.duplicateProject(project.id)
  ElMessage.success('项目副本已创建')
  goEditor(duplicated.id)
}

const publishProject = async () => {
  if (!selectedPublishProject.value?.id || !publishForm.value.title.trim()) return

  await marketplaceStore.publishProject({
    projectId: selectedPublishProject.value.id,
    title: publishForm.value.title.trim(),
    summary: publishForm.value.summary.trim() || undefined,
    description: publishForm.value.description.trim() || undefined,
    category: publishForm.value.category.trim() || undefined,
    tags: publishForm.value.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    coverUrl: selectedPublishProject.value.coverUrl || undefined
  })
  publishDialogVisible.value = false
  ElMessage.success('项目已发布到 Marketplace')
}

const forkMarketplaceItem = async (item) => {
  if (!activeWorkspace.value?.id) return
  const project = await marketplaceStore.forkItem(item.id, {
    workspaceId: activeWorkspace.value.id,
    name: `${item.title} Fork`
  })
  ElMessage.success('已 Fork 到当前工作区')
  await fetchProjects()
  goEditor(project.id)
}

const likeMarketplaceItem = async (item) => {
  await marketplaceStore.likeItem(item.id)
  ElMessage.success('已点赞')
}

const trashProject = async (project) => {
  await ElMessageBox.confirm(`确定要将「${project.name}」移入回收站吗？`, '移入回收站', {
    confirmButtonText: '移入回收站',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await projectStore.trashProject(project.id)
  ElMessage.success('项目已移入回收站')
}

const restoreProject = async (project) => {
  await projectStore.restoreProject(project.id)
  projectStore.projects = projectStore.projects.filter(item => item.id !== project.id)
  ElMessage.success('项目已恢复')
}

const createResource = async () => {
  if (!activeWorkspace.value?.id || !resourceForm.value.name.trim()) return
  await resourceCenterStore.createResource({
    workspaceId: activeWorkspace.value.id,
    name: resourceForm.value.name.trim(),
    type: resourceForm.value.type,
    config: {
      baseUrl: resourceForm.value.baseUrl.trim()
    }
  })
  resourceDialogVisible.value = false
  ElMessage.success('资源已创建')
}

const createAsset = async () => {
  if (!activeWorkspace.value?.id || !assetFile.value) {
    ElMessage.warning('请选择要上传的文件')
    return
  }
  const formData = new FormData()
  formData.append('workspaceId', activeWorkspace.value.id)
  formData.append('name', assetForm.value.name.trim() || assetFile.value.name)
  formData.append('tags', assetForm.value.tags)
  formData.append('file', assetFile.value)
  await resourceCenterStore.uploadAsset(formData)
  assetDialogVisible.value = false
  ElMessage.success('资产已上传')
}

const handleAssetFileChange = (uploadFile) => {
  const file = uploadFile.raw
  assetFile.value = file
  if (!file) return
  assetForm.value.name = assetForm.value.name || file.name
}

const handleAssetFileRemove = () => {
  assetFile.value = null
}

const testResource = async (resource) => {
  const result = await resourceCenterStore.testResource(resource.id)
  ElMessage.success(result.message || '资源测试通过')
}

const deleteResource = async (resource) => {
  await ElMessageBox.confirm(`确定删除资源「${resource.name}」吗？`, '删除资源', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await resourceCenterStore.deleteResource(resource.id)
  ElMessage.success('资源已删除')
}

const deleteAsset = async (asset) => {
  await ElMessageBox.confirm(`确定删除资产「${asset.name}」吗？`, '删除资产', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await resourceCenterStore.deleteAsset(asset.id)
  ElMessage.success('资产已删除')
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出当前账号吗？', '退出登录', {
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
      type: 'warning'
    })
    logoutLoading.value = true
    await authStore.logout()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  } finally {
    logoutLoading.value = false
  }
}
</script>

<template>
  <div class="workspace-page">
    <aside class="workspace-sidebar">
      <div class="workspace-brand">
        <div class="brand-mark">2D</div>
        <div>
          <strong>BrickScreen</strong>
          <span>Enterprise Workspace</span>
        </div>
      </div>

      <nav class="workspace-nav">
        <button v-for="item in navItems" :key="item.key" class="nav-item" :class="{ active: activeNav === item.key }"
          type="button" @click="switchNav(item.key)">
          <el-icon>
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="account-card">
        <el-icon>
          <UserFilled />
        </el-icon>
        <div class="account-info">
          <strong>{{ authStore.userInfo?.realName || '当前用户' }}</strong>
          <span>{{ authStore.userInfo?.email }}</span>
        </div>
        <el-tooltip content="退出登录" placement="top">
          <el-button class="logout-button" text circle :loading="logoutLoading" @click="handleLogout">
            <el-icon>
              <SwitchButton />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </aside>

    <main class="workspace-main">
      <header class="workspace-header">
        <div>
          <p class="header-kicker">Workspace</p>
          <h1>{{ activeWorkspace?.name || '工作区' }}</h1>
        </div>
        <div class="header-actions">
          <el-input v-if="activeNav === 'projects' || activeNav === 'trash'" v-model="projectStore.keyword"
            class="search-input" placeholder="搜索项目" :prefix-icon="Search" clearable @keyup.enter="fetchActiveCenter"
            @clear="fetchActiveCenter" />
          <el-input v-else-if="activeNav === 'marketplace'" v-model="marketplaceStore.keyword" class="search-input"
            placeholder="搜索模板、分类、标签" :prefix-icon="Search" clearable @keyup.enter="fetchActiveCenter"
            @clear="fetchActiveCenter" />
          <el-button v-if="['projects', 'resources', 'assets'].includes(activeNav)" type="primary"
            @click="handlePrimaryAction">
            <el-icon>
              <Plus />
            </el-icon>
            新建
          </el-button>
        </div>
      </header>

      <AppLoading v-if="workspaceStore.loading" text="正在加载工作区..." size="large" />

      <AppError v-else-if="workspaceStore.error" title="工作区加载失败" :description="workspaceStore.error">
        <template #actions>
          <el-button type="primary" @click="workspaceStore.fetchWorkspaces()">重试</el-button>
        </template>
      </AppError>

      <AppEmpty v-else-if="workspaceStore.workspaces.length === 0" title="暂无工作区"
        description="当前账号还没有可访问的工作区，请重新登录或联系管理员。">
        <template #actions>
          <el-button type="primary" @click="authStore.logout()">重新登录</el-button>
        </template>
      </AppEmpty>

      <template v-else>
        <section class="summary-grid">
          <div v-for="item in workspaceStats" :key="item.label" class="summary-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </section>

        <section class="content-section" :class="{ 'datasource-section': activeNav === 'datasources' }">
          <div v-if="activeNav !== 'datasources'" class="section-header">
            <div>
              <h2>{{ centerTitleMap[activeNav] || navItems.find(item => item.key === activeNav)?.label }}</h2>
              <p>从工作区统一管理项目、资源、数据源和发布资产。</p>
            </div>
            <el-button @click="fetchActiveCenter">刷新</el-button>
          </div>

          <template v-if="activeNav === 'datasources'">
            <DataSourcePanel />
          </template>

          <template v-else-if="activeNav === 'projects' || activeNav === 'trash'">
            <AppLoading v-if="projectStore.loading" text="正在加载项目..." />

            <AppError v-else-if="projectStore.error" title="项目加载失败" :description="projectStore.error">
              <template #actions>
                <el-button type="primary" @click="fetchActiveCenter">重试</el-button>
              </template>
            </AppError>

            <AppEmpty v-else-if="projectStore.projects.length === 0"
              :title="activeNav === 'trash' ? '回收站为空' : '还没有项目'"
              :description="activeNav === 'trash' ? '移入回收站的项目会显示在这里。' : '先创建第一个可视化项目，后续这里会显示最近修改、收藏和发布状态。'"
              size="compact">
              <template v-if="activeNav === 'projects'" #actions>
                <el-button type="primary" @click="openCreateDialog">
                  <el-icon>
                    <Plus />
                  </el-icon>
                  新建项目
                </el-button>
              </template>
            </AppEmpty>

            <div v-else class="project-grid">
              <article v-for="project in projectStore.projects" :key="project.id" class="project-card"
                @click="activeNav === 'trash' ? null : goEditor(project.id)">
                <div class="project-cover">
                  <img v-if="hasUsableCover(project.coverUrl)" :src="project.coverUrl" :alt="`${project.name}封面`"
                    @error="markCoverFailed(project.coverUrl)" />
                  <div v-else class="cover-placeholder">
                    <el-icon><Edit /></el-icon>
                    <span>{{ project._count?.pages || 0 }} 个页面</span>
                  </div>
                </div>
                <div class="item-card-footer">
                  <div class="item-card-title">
                    <h3 :title="project.name">{{ project.name }}</h3>
                    <span>{{ formatDate(project.updatedAt) }}</span>
                  </div>
                  <div class="item-card-actions" @click.stop>
                    <el-tooltip v-if="activeNav === 'trash'" content="恢复项目" placement="top">
                      <el-button text circle size="small" @click="restoreProject(project)">
                        <el-icon><RefreshLeft /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <template v-else>
                      <el-tooltip content="打开项目" placement="top">
                        <el-button text circle size="small" @click="goEditor(project.id)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="复制项目" placement="top">
                        <el-button text circle size="small" @click="duplicateProject(project)">
                          <el-icon><CopyDocument /></el-icon>
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="发布项目" placement="top">
                        <el-button text circle size="small" @click="openPublishDialog(project)">
                          <el-icon><Upload /></el-icon>
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="移入回收站" placement="top">
                        <el-button text circle type="danger" size="small" @click="trashProject(project)">
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </el-tooltip>
                    </template>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeNav === 'marketplace'">
            <AppLoading v-if="marketplaceStore.loading" text="正在加载 Marketplace..." />
            <AppError v-else-if="marketplaceStore.error" title="Marketplace 加载失败" :description="marketplaceStore.error" />
            <AppEmpty v-else-if="marketplaceStore.items.length === 0" title="Marketplace 暂无发布项目"
              description="从项目列表发布一个可复用模板后，它会出现在这里，并支持其他工作区 Fork。" size="compact" />
            <div v-else class="marketplace-grid">
              <article v-for="item in marketplaceStore.items" :key="item.id" class="marketplace-card">
                <div class="marketplace-cover">
                  <el-icon>
                    <Box />
                  </el-icon>
                </div>
                <div class="marketplace-body">
                  <div class="marketplace-title-row">
                    <h3>{{ item.title }}</h3>
                    <span>{{ item.category || 'general' }}</span>
                  </div>
                  <p>{{ item.summary || item.description || '暂无简介' }}</p>
                  <div class="marketplace-meta">
                    <span>{{ item.owner?.displayName || item.owner?.email || '作者' }}</span>
                    <span>{{ item.likeCount || 0 }} 赞</span>
                    <span>{{ item.forkCount || 0 }} Fork</span>
                    <span>{{ item.viewCount || 0 }} 浏览</span>
                  </div>
                  <div class="marketplace-tags">
                    <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
                  </div>
                </div>
                <div class="marketplace-actions">
                  <el-button text size="small" @click="likeMarketplaceItem(item)">点赞</el-button>
                  <el-button type="primary" size="small" :loading="marketplaceStore.forking"
                    @click="forkMarketplaceItem(item)">
                    Fork
                  </el-button>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeNav === 'resources'">
            <AppLoading v-if="resourceCenterStore.loading" text="正在加载资源..." />
            <AppError v-else-if="resourceCenterStore.error" title="资源加载失败" :description="resourceCenterStore.error" />
            <AppEmpty v-else-if="resourceCenterStore.resources.length === 0" title="还没有资源"
              description="资源用于保存跨项目复用的 REST、GraphQL、数据库、OpenAPI 连接配置。" size="compact">
              <template #actions>
                <el-button type="primary" @click="openResourceDialog">新建资源</el-button>
              </template>
            </AppEmpty>
            <div v-else class="center-list">
              <article v-for="resource in resourceCenterStore.resources" :key="resource.id" class="center-row">
                <div>
                  <h3>{{ resource.name }}</h3>
                  <p>{{ resource.type }} · {{ resource._count?.datasources || 0 }} 个数据源引用</p>
                </div>
                <div class="center-actions">
                  <el-button text size="small" @click="testResource(resource)">测试</el-button>
                  <el-button text type="danger" size="small" @click="deleteResource(resource)">删除</el-button>
                </div>
              </article>
            </div>
          </template>

          <template v-else-if="activeNav === 'assets'">
            <AppLoading v-if="resourceCenterStore.loading" text="正在加载资产..." />
            <AppError v-else-if="resourceCenterStore.error" title="资产加载失败" :description="resourceCenterStore.error" />
            <AppEmpty v-else-if="resourceCenterStore.assets.length === 0" title="还没有资产"
              description="上传图片、SVG、字体、JSON、视频或音频文件后，它们会显示在这里。" size="compact">
              <template #actions>
                <el-button type="primary" @click="openAssetDialog">上传资产</el-button>
              </template>
            </AppEmpty>
            <div v-else class="asset-grid">
              <article v-for="asset in resourceCenterStore.assets" :key="asset.id" class="asset-card">
                <div class="asset-cover">
                  <img v-if="isImageAsset(asset) && hasUsableCover(getAssetDisplayUrl(asset))"
                    :src="getAssetDisplayUrl(asset)" :alt="`${asset.name}预览`"
                    @error="markCoverFailed(getAssetDisplayUrl(asset))" />
                  <div v-else class="cover-placeholder asset-placeholder">
                    <el-icon><component :is="getAssetIcon(asset)" /></el-icon>
                    <span>{{ getAssetTypeLabel(asset) }}</span>
                  </div>
                  <span class="asset-type">{{ getAssetTypeLabel(asset) }}</span>
                </div>
                <div class="item-card-footer">
                  <div class="item-card-title">
                    <h3 :title="asset.name">{{ asset.name }}</h3>
                    <span>{{ formatFileSize(asset.file?.size) }}</span>
                  </div>
                  <div class="item-card-actions">
                    <el-tooltip content="打开资产" placement="top">
                      <el-button text circle size="small" tag="a" :href="getAssetDisplayUrl(asset)" target="_blank">
                        <el-icon><View /></el-icon>
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="删除资产" placement="top">
                      <el-button text circle type="danger" size="small" @click="deleteAsset(asset)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </article>
            </div>
          </template>

          <AppEmpty v-else title="模块建设中" description="该模块已进入 v2 路线图，当前阶段先完成资源、数据源和资产中心。" size="compact" />
        </section>
      </template>
    </main>

    <el-dialog v-model="createDialogVisible" title="新建项目" width="420px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="项目名称" required>
          <el-input v-model="createForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="可选，用于团队理解项目用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="projectStore.creating" @click="createProject">创建并进入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resourceDialogVisible" title="新建资源" width="460px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="资源名称" required>
          <el-input v-model="resourceForm.name" />
        </el-form-item>
        <el-form-item label="资源类型" required>
          <el-select v-model="resourceForm.type" style="width: 100%">
            <el-option v-for="type in resourceTypes" :key="type.value" :label="type.label" :value="type.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="基础地址">
          <el-input v-model="resourceForm.baseUrl" placeholder="https://api.example.com" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resourceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resourceCenterStore.creating" @click="createResource">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="assetDialogVisible" title="上传资产" width="460px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="资产名称" required>
          <el-input v-model="assetForm.name" />
        </el-form-item>
        <el-form-item label="上传文件">
          <el-upload action="#" :auto-upload="false" :limit="1" :on-change="handleAssetFileChange"
            :on-remove="handleAssetFileRemove">
            <el-button>选择文件</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="assetForm.tags" placeholder="用英文逗号分隔，如 logo,header" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assetDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resourceCenterStore.creating" @click="createAsset">上传</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="publishDialogVisible" title="发布到 Marketplace" width="520px" append-to-body>
      <el-form label-position="top">
        <el-form-item label="发布标题" required>
          <el-input v-model="publishForm.title" />
        </el-form-item>
        <el-form-item label="一句话简介">
          <el-input v-model="publishForm.summary" maxlength="120" show-word-limit />
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input v-model="publishForm.description" type="textarea" :rows="4" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="publishForm.category" style="width: 100%">
            <el-option label="数据大屏" value="dashboard" />
            <el-option label="运维监控" value="ops" />
            <el-option label="业务分析" value="analytics" />
            <el-option label="智慧园区" value="park" />
            <el-option label="通用模板" value="general" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="publishForm.tags" placeholder="用英文逗号分隔，如 能耗,园区,监控" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="marketplaceStore.publishing" @click="publishProject">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.workspace-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 264px minmax(0, 1fr);
  background: var(--lc-bg-page);
  color: var(--lc-text-primary);
}

.workspace-sidebar {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  border-right: 1px solid var(--lc-border-subtle);
  background: var(--lc-bg-panel);
}

.workspace-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px 18px;
}

.brand-mark {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--lc-radius-lg);
  background: var(--lc-brand-500);
  color: var(--lc-text-inverse);
  font-weight: 800;
}

.workspace-brand strong,
.workspace-brand span,
.account-card strong,
.account-card span {
  display: block;
}

.workspace-brand strong {
  font-size: 14px;
  line-height: 20px;
}

.workspace-brand span,
.account-card span {
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
}

.workspace-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--lc-radius-md);
  background: transparent;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-body);
  text-align: left;
  cursor: pointer;
}

.nav-item:hover,
.nav-item.active {
  background: var(--lc-bg-selected);
  color: var(--lc-brand-600);
}

.account-card {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  padding: 12px 10px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-page);
}

.account-info {
  flex: 1;
  min-width: 0;
}

.account-card strong,
.account-card span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout-button {
  flex-shrink: 0;
  color: var(--lc-text-secondary);
}

.logout-button:hover {
  color: var(--lc-danger-600);
  background: var(--lc-danger-50);
}

.workspace-main {
  min-width: 0;
  padding: 28px;
}

.workspace-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.header-kicker {
  margin: 0 0 4px;
  color: var(--lc-brand-600);
  font-size: var(--lc-font-size-caption);
  font-weight: 700;
  text-transform: uppercase;
}

.workspace-header h1 {
  margin: 0;
  font-size: 28px;
  line-height: 36px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 280px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.summary-item {
  padding: 18px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-panel);
}

.summary-item span,
.summary-item strong {
  display: block;
}

.summary-item span {
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
}

.summary-item strong {
  margin-top: 8px;
  font-size: 26px;
  line-height: 32px;
}

.content-section {
  padding: 20px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-panel);
}

.content-section.datasource-section {
  height: calc(100vh - 204px);
  min-height: 680px;
  overflow: hidden;
  padding: 0;
  background: var(--lc-bg-page);
}

.content-section.datasource-section :deep(.datasource-panel) {
  background: transparent;
}

.center-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.center-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-page);
}

.center-row h3 {
  overflow: hidden;
  margin: 0;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  line-height: var(--lc-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-row p {
  overflow: hidden;
  margin: 4px 0 0;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.marketplace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.marketplace-card {
  min-width: 0;
  display: grid;
  grid-template-rows: 92px minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-page);
}

.marketplace-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--lc-brand-50);
  color: var(--lc-brand-600);
  font-size: 26px;
}

.marketplace-body {
  min-width: 0;
  padding: 14px;
}

.marketplace-title-row {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.marketplace-title-row h3 {
  overflow: hidden;
  margin: 0;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  line-height: var(--lc-line-height-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.marketplace-title-row span {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: var(--lc-radius-sm);
  background: var(--lc-bg-selected);
  color: var(--lc-brand-600);
  font-size: 11px;
}

.marketplace-body p {
  display: -webkit-box;
  min-height: 38px;
  overflow: hidden;
  margin: 8px 0 0;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.marketplace-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  color: var(--lc-text-tertiary);
  font-size: 11px;
}

.marketplace-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 22px;
  margin-top: 10px;
}

.marketplace-tags span {
  padding: 2px 7px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-sm);
  color: var(--lc-text-secondary);
  font-size: 11px;
}

.marketplace-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px 14px;
}

.project-grid,
.asset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.project-card,
.asset-card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  background: var(--lc-bg-page);
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.project-card {
  cursor: pointer;
}

.project-card:hover,
.asset-card:hover {
  border-color: var(--lc-brand-500);
  transform: translateY(-1px);
  box-shadow: var(--lc-shadow-sm);
}

.project-cover,
.asset-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-bottom: 1px solid var(--lc-border-subtle);
  background: var(--lc-bg-panel);
}

.project-cover img,
.asset-cover img {
  width: 100%;
  height: 100%;
  display: block;
}

.project-cover img {
  object-fit: cover;
}

.asset-cover img {
  object-fit: contain;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--lc-brand-50);
  color: var(--lc-brand-600);
  gap: 8px;
}

.cover-placeholder .el-icon {
  font-size: 28px;
}

.cover-placeholder span {
  font-size: var(--lc-font-size-caption);
}

.asset-placeholder {
  background: var(--lc-bg-selected);
  color: var(--lc-text-secondary);
}

.asset-type {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 3px 7px;
  border-radius: var(--lc-radius-sm);
  background: color-mix(in srgb, var(--lc-bg-panel) 88%, transparent);
  color: var(--lc-text-secondary);
  font-size: 11px;
  line-height: 16px;
}

.item-card-footer {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
}

.item-card-title {
  min-width: 0;
}

.item-card-title h3,
.item-card-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-card-title h3 {
  margin: 0;
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  line-height: var(--lc-line-height-body);
}

.item-card-title span {
  display: block;
  margin-top: 3px;
  color: var(--lc-text-tertiary);
  font-size: 11px;
  line-height: 16px;
}

.item-card-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 2px;
}

.item-card-actions .el-button + .el-button {
  margin-left: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  line-height: 26px;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-body);
}

@media (max-width: 900px) {
  .workspace-page {
    grid-template-columns: 1fr;
  }

  .workspace-sidebar {
    min-height: auto;
  }

  .workspace-header,
  .header-actions,
  .section-header {
    align-items: stretch;
    flex-direction: column;
  }

  .center-row {
    grid-template-columns: 1fr;
  }

  .center-actions {
    justify-content: flex-end;
  }

  .search-input {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .project-grid,
  .asset-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}
</style>
