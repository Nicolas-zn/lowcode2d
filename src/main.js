import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css' // Element Plus 暗色主题
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'bootstrap-icons/font/bootstrap-icons.css'
// import 'amfe-flexible' // rem适配 - 已禁用，这个库会导致根元素font-size过大（1920屏幕=192px）
import './styles/variables.css' // 全局 CSS 变量
import './styles/design-tokens.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerCustomThemes } from './utils/echartThemes' // 注册自定义 EChart 主题

// 注册 EChart 自定义主题
registerCustomThemes()

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
