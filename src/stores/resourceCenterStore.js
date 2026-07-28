import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createResourceApi,
  deleteResourceApi,
  getResourcesApi,
  testResourceApi
} from '@/api/resources'
import {
  createDatasourceApi,
  deleteDatasourceApi,
  getDatasourcesApi,
  testDatasourceApi
} from '@/api/datasources'
import {
  deleteAssetApi,
  getAssetsApi,
  uploadAssetApi
} from '@/api/assets'

export const useResourceCenterStore = defineStore('resourceCenter', () => {
  const resources = ref([])
  const datasources = ref([])
  const assets = ref([])
  const loading = ref(false)
  const error = ref('')
  const creating = ref(false)

  async function fetchResources(workspaceId) {
    return runList(async () => {
      resources.value = await getResourcesApi({ workspaceId })
      return resources.value
    })
  }

  async function fetchDatasources(projectId) {
    return runList(async () => {
      datasources.value = await getDatasourcesApi(projectId ? { projectId } : {})
      return datasources.value
    })
  }

  async function fetchAssets(workspaceId) {
    return runList(async () => {
      assets.value = await getAssetsApi({ workspaceId })
      return assets.value
    })
  }

  async function createResource(payload) {
    return runCreate(async () => {
      const resource = await createResourceApi(payload)
      resources.value = [resource, ...resources.value]
      return resource
    })
  }

  async function createDatasource(payload) {
    return runCreate(async () => {
      const datasource = await createDatasourceApi(payload)
      datasources.value = [datasource, ...datasources.value]
      return datasource
    })
  }

  async function uploadAsset(payload) {
    return runCreate(async () => {
      const asset = await uploadAssetApi(payload)
      assets.value = [asset, ...assets.value]
      return asset
    })
  }

  async function deleteResource(id) {
    await deleteResourceApi(id)
    resources.value = resources.value.filter(item => item.id !== id)
  }

  async function deleteDatasource(id) {
    await deleteDatasourceApi(id)
    datasources.value = datasources.value.filter(item => item.id !== id)
  }

  async function deleteAsset(id) {
    await deleteAssetApi(id)
    assets.value = assets.value.filter(item => item.id !== id)
  }

  function testResource(id) {
    return testResourceApi(id)
  }

  function testDatasource(id) {
    return testDatasourceApi(id)
  }

  async function runList(task) {
    try {
      loading.value = true
      error.value = ''
      return await task()
    } catch (err) {
      error.value = err?.message || '加载失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function runCreate(task) {
    try {
      creating.value = true
      return await task()
    } finally {
      creating.value = false
    }
  }

  return {
    assets,
    createDatasource,
    createResource,
    creating,
    datasources,
    deleteAsset,
    deleteDatasource,
    deleteResource,
    error,
    fetchAssets,
    fetchDatasources,
    fetchResources,
    loading,
    resources,
    testDatasource,
    testResource,
    uploadAsset
  }
})
