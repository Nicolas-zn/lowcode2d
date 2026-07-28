import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export const usePanelStore = defineStore('panel', () => {
  const router = useRouter()
  const currentPageIndex = ref(0)
  const switchPage = (index) => {
    currentPageIndex.value = index
    router.push(index === 0 ? '/' : '/router' + (index + 1))
  }
  return { currentPageIndex, switchPage }
})