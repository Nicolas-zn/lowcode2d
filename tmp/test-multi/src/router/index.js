import { createRouter, createWebHashHistory } from 'vue-router'
import Router1 from '../views/router1/index.vue'
import Router2 from '../views/router2/index.vue'

const routes = [
  { path: '/', redirect: '/router1' },
  { path: '/router1', name: 'router1', component: Router1 },
  { path: '/router2', name: 'router2', component: Router2 }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router