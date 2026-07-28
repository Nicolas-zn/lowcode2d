import { defineStore } from 'pinia'
import { ref } from 'vue'
import { publishProjectApi } from '@/api/publishes'
import {
  forkMarketplaceItemApi,
  getMarketplaceItemsApi,
  likeMarketplaceItemApi,
  unlikeMarketplaceItemApi
} from '@/api/marketplace'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const publishing = ref(false)
  const forking = ref(false)
  const keyword = ref('')

  async function fetchItems(params = {}) {
    try {
      loading.value = true
      error.value = ''
      items.value = await getMarketplaceItemsApi({
        keyword: keyword.value || undefined,
        ...params
      })
      return items.value
    } catch (err) {
      error.value = err?.message || '加载 Marketplace 失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function publishProject(payload) {
    try {
      publishing.value = true
      const publish = await publishProjectApi(payload)
      await fetchItems()
      return publish
    } finally {
      publishing.value = false
    }
  }

  async function forkItem(id, payload) {
    try {
      forking.value = true
      return await forkMarketplaceItemApi(id, payload)
    } finally {
      forking.value = false
    }
  }

  async function likeItem(id) {
    const result = await likeMarketplaceItemApi(id)
    replaceItem(result.item)
    return result
  }

  async function unlikeItem(id) {
    const result = await unlikeMarketplaceItemApi(id)
    replaceItem(result.item)
    return result
  }

  function replaceItem(item) {
    if (!item) return
    items.value = items.value.map(current => current.id === item.id ? item : current)
  }

  return {
    error,
    fetchItems,
    forkItem,
    forking,
    items,
    keyword,
    likeItem,
    loading,
    publishProject,
    publishing,
    unlikeItem
  }
})
