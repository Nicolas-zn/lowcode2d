import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDataSourceStore = defineStore('dataSource', () => {
  const dataSources = ref({})
  const getDataSource = (id) => dataSources.value[id] || null
  return { dataSources, getDataSource }
})