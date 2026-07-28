const fs = require('fs');
const path = require('path');

const jsonFile = process.argv[2];
const outDir = process.argv[3];
const lowcode2dDir = process.argv[4]; // lowcode2D 源目录

if (!jsonFile || !fs.existsSync(jsonFile)) {
  console.error("JSON file not found: " + jsonFile);
  process.exit(1);
}

const dashboard = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
let pagesData = [];

// 兼容单页面和多页面格式
if (dashboard.pages && Array.isArray(dashboard.pages)) {
  pagesData = dashboard.pages;
} else if (dashboard.components) {
  pagesData = [{ name: 'Home', components: dashboard.components }];
} else {
  console.error("Invalid dashboard.json format.");
  process.exit(1);
}

// 收集所有需要的组件类型（排除 PlaceholderBrick）
const usedComponents = new Set();
pagesData.forEach(page => {
  page.components.forEach(comp => {
    if (comp.type !== 'PlaceholderBrick') {
      usedComponents.add(comp.type);
    }
  });
});

console.log(`需要复制的组件: ${Array.from(usedComponents).join(', ')}`);

// 复制需要的组件文件
const bricksDir = path.join(outDir, 'src/bricks');
fs.mkdirSync(bricksDir, { recursive: true });

usedComponents.forEach(compType => {
  const srcFile = path.join(lowcode2dDir, 'src/bricks', `${compType}.vue`);
  const destFile = path.join(bricksDir, `${compType}.vue`);
  if (fs.existsSync(srcFile)) {
    let content = fs.readFileSync(srcFile, 'utf8');

    // 特殊处理 HeaderMenuBrick，修改路由切换逻辑
    if (compType === 'HeaderMenuBrick') {
      content = content.replace(
        /const handleClick = \(index\) => \{[\s\S]*?\}/,
        `const handleClick = (index) => {
  panelStore.switchPage(index)
  router.push(index === 0 ? '/router1' : \`/router\${index + 1}\`)
}`
      );
      // 添加 router 导入
      if (!content.includes("import { useRouter }")) {
        content = content.replace(
          "import { computed } from 'vue'",
          "import { computed } from 'vue'\nimport { useRouter } from 'vue-router'"
        );
        content = content.replace(
          "const panelStore = usePanelStore()",
          "const panelStore = usePanelStore()\nconst router = useRouter()"
        );
      }
    }

    fs.writeFileSync(destFile, content);
  } else {
    console.warn(`警告: 组件文件不存在: ${srcFile}`);
  }
});

const scaleScript = `
import { ref, onMounted, onUnmounted } from 'vue'
const scaleX = ref(1)
const scaleY = ref(1)

const calculateScale = () => {
    scaleX.value = window.innerWidth / 1920
    scaleY.value = window.innerHeight / 1080
}

onMounted(() => {
    calculateScale()
    window.addEventListener('resize', calculateScale)
})

onUnmounted(() => {
    window.removeEventListener('resize', calculateScale)
})
`;

// 查找第一个页面的 HeaderMenuBrick 作为全局菜单
let globalHeaderMenu = null;
for (const page of pagesData) {
  const headerMenu = page.components.find(c => c.type === 'HeaderMenuBrick');
  if (headerMenu) {
    globalHeaderMenu = headerMenu;
    break;
  }
}

// 生成各个页面
pagesData.forEach((page, index) => {
  const routerName = `router${index + 1}`;
  const viewDir = path.join(outDir, 'src/views', routerName);
  fs.mkdirSync(viewDir, { recursive: true });

  const imports = new Set();
  let templateParts = [];
  let propsParts = [];

  let sortedComps = [...page.components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

  // 如果当前页面没有 HeaderMenuBrick，但全局有，则添加
  const hasHeaderMenu = sortedComps.some(c => c.type === 'HeaderMenuBrick');
  if (!hasHeaderMenu && globalHeaderMenu) {
    sortedComps = [globalHeaderMenu, ...sortedComps];
  }

  sortedComps.forEach((comp, cIdx) => {
    if (comp.type === 'PlaceholderBrick') return;

    imports.add(`import ${comp.type} from '@/bricks/${comp.type}.vue'`);

    const propsVar = `props_${cIdx}`;

    // 特殊处理 HeaderMenuBrick，注入路由切换逻辑
    if (comp.type === 'HeaderMenuBrick') {
      const menuProps = { ...comp.props };
      propsParts.push(`const ${propsVar} = ${JSON.stringify(menuProps, null, 2)}`);
    } else {
      propsParts.push(`const ${propsVar} = ${JSON.stringify(comp.props, null, 2)}`);
    }

    const styleObj = {
      position: 'absolute',
      left: `${comp.x}px`,
      top: `${comp.y}px`,
      width: `${comp.width}px`,
      height: `${comp.height}px`,
      zIndex: comp.zIndex || 0,
    };
    if (comp.rotation) {
      styleObj.transform = `rotate(${comp.rotation}deg)`;
    }

    templateParts.push(`      <${comp.type} v-bind="${propsVar}" :style='${JSON.stringify(styleObj)}' />`);
  });

  const bgColor = dashboard.projectSettings?.backgroundColor || 'rgba(255, 255, 255, 1)';
  const bgImage = dashboard.projectSettings?.backgroundImage;
  const bgStyle = bgImage
    ? `backgroundImage: "url(${bgImage})", backgroundSize: 'cover', backgroundPosition: 'center'`
    : `backgroundColor: "${bgColor}"`;

  const vueContent = `
<template>
  <div class="page-container" :style="containerStyle">
    <div class="canvas-panel" :style="{
      width: '1920px',
      height: '1080px',
      transform: \`scale(\${scaleX}, \${scaleY})\`,
      transformOrigin: 'top left',
      position: 'relative'
    }">
${templateParts.join('\n')}
    </div>
  </div>
</template>

<script setup>
${Array.from(imports).join('\n')}
${scaleScript}

const containerStyle = {
  width: '100vw',
  height: '100vh',
  overflow: 'hidden',
  ${bgStyle}
}

${propsParts.join('\n\n')}
</script>

<style scoped>
</style>
  `.trim();

  fs.writeFileSync(path.join(viewDir, 'index.vue'), vueContent);
});

// 生成路由配置
let routerImports = [];
let routes = [];
pagesData.forEach((page, index) => {
  const routerName = `router${index + 1}`;
  routerImports.push(`import Router${index + 1} from '../views/${routerName}/index.vue'`);
  routes.push(`  { path: '/${routerName}', name: '${routerName}', component: Router${index + 1} }`);
});
// 默认重定向到第一个页面
routes.unshift(`  { path: '/', redirect: '/router1' }`);

const routerContent = `
import { createRouter, createWebHashHistory } from 'vue-router'
${routerImports.join('\n')}

const routes = [
${routes.join(',\n')}
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
`.trim();

fs.mkdirSync(path.join(outDir, 'src/router'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'src/router/index.js'), routerContent);

// 创建必需的 stores
fs.mkdirSync(path.join(outDir, 'src/stores'), { recursive: true });

fs.writeFileSync(path.join(outDir, 'src/stores/panelStore.js'), `
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePanelStore = defineStore('panel', () => {
  const currentPageIndex = ref(0)
  const switchPage = (index) => {
    currentPageIndex.value = index
  }
  return { currentPageIndex, switchPage }
})
`.trim());

fs.writeFileSync(path.join(outDir, 'src/stores/themeStore.js'), `
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref('light')
  const isDark = ref(false)
  return { currentTheme, isDark }
})
`.trim());

fs.writeFileSync(path.join(outDir, 'src/stores/dataSourceStore.js'), `
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useDataSourceStore = defineStore('dataSource', () => {
  const dataSources = ref({})
  const getDataSource = (id) => dataSources.value[id] || null
  return { dataSources, getDataSource }
})
`.trim());

// 创建简化的 api.js
fs.mkdirSync(path.join(outDir, 'src/lib'), { recursive: true });
fs.writeFileSync(path.join(outDir, 'src/lib/api.js'), `
export const api = {
  fetchData: async (config) => {
    const headers = {
      'Content-Type': 'application/json'
    }

    let fullUrl = config.suffix ? \`\${config.url}\${config.suffix}\` : config.url
    if (config.token) {
      fullUrl += '?token=' + config.token
    }

    const response = await fetch(fullUrl, {
      method: config.method || 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`)
    }

    return await response.json()
  }
}
`.trim());

// 生成 main.js
fs.writeFileSync(path.join(outDir, 'src/main.js'), `
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.mount('#app')
`.trim());

// 生成 App.vue
fs.writeFileSync(path.join(outDir, 'src/App.vue'), `
<template>
  <router-view></router-view>
</template>

<script setup>
</script>

<style>
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
`.trim());

// 生成 vite.config.js
fs.writeFileSync(path.join(outDir, 'vite.config.js'), `
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
`.trim());

console.log('============= Vue pages and router setup successfully! =============');
