/**
 * 导出工具模块
 * 支持导出为 HTML、图片、PDF、Vue 组件、React 组件等格式
 */
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { brickLibrary } from '../bricks/index.js'

// CDN 配置
const CDN_OPTIONS = {
    jsdelivr: {
        name: 'jsDelivr',
        vue: 'https://cdn.jsdelivr.net/npm/vue@3.5.24/dist/vue.global.prod.js',
        echarts: 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js',
        echartsLiquidfill: 'https://cdn.jsdelivr.net/npm/echarts-liquidfill@3.1.0/dist/echarts-liquidfill.min.js',
        elementPlus: 'https://cdn.jsdelivr.net/npm/element-plus@2.13.0/dist/index.full.min.js',
        elementPlusCss: 'https://cdn.jsdelivr.net/npm/element-plus@2.13.0/dist/index.css'
    },
    unpkg: {
        name: 'UNPKG',
        vue: 'https://unpkg.com/vue@3.5.24/dist/vue.global.prod.js',
        echarts: 'https://unpkg.com/echarts@5.6.0/dist/echarts.min.js',
        echartsLiquidfill: 'https://unpkg.com/echarts-liquidfill@3.1.0/dist/echarts-liquidfill.min.js',
        elementPlus: 'https://unpkg.com/element-plus@2.13.0/dist/index.full.min.js',
        elementPlusCss: 'https://unpkg.com/element-plus@2.13.0/dist/index.css'
    },
    cdnjs: {
        name: 'cdnjs',
        vue: 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.5.24/vue.global.prod.min.js',
        echarts: 'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.6.0/echarts.min.js',
        echartsLiquidfill: 'https://cdn.jsdelivr.net/npm/echarts-liquidfill@3.1.0/dist/echarts-liquidfill.min.js',
        elementPlus: 'https://cdnjs.cloudflare.com/ajax/libs/element-plus/2.13.0/index.full.min.js',
        elementPlusCss: 'https://cdnjs.cloudflare.com/ajax/libs/element-plus/2.13.0/index.min.css'
    }
}

/**
 * 导出为图片
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {Object} options - 导出选项
 * @returns {Promise<Blob>} 图片 Blob
 */
export async function exportToImage(element, options = {}) {
    const {
        format = 'png',
        quality = 1,
        scale = 2,
        backgroundColor = '#ffffff',
        allowTaint = true,
        ignoreElements,
        onclone
    } = options

    const canvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        allowTaint,
        logging: false,
        ignoreElements,
        onclone
    })

    return new Promise((resolve) => {
        if (format === 'png') {
            canvas.toBlob(resolve, 'image/png')
        } else {
            canvas.toBlob(resolve, 'image/jpeg', quality)
        }
    })
}

/**
 * 导出为 PDF
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {Object} options - 导出选项
 * @returns {Promise<Blob>} PDF Blob
 */
export async function exportToPDF(element, options = {}) {
    const {
        scale = 2,
        orientation = 'landscape',
        fileName = 'dashboard'
    } = options

    const canvas = await html2canvas(element, {
        scale,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [canvas.width, canvas.height]
    })

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    return pdf.output('blob')
}

/**
 * 生成独立 HTML 文件
 * @param {Array} components - 组件数据数组
 * @param {Object} options - 导出选项
 * @returns {string} HTML 字符串
 */
export function generateStandaloneHTML(components, options = {}) {
    const {
        cdn = 'jsdelivr',
        title = '可视化大屏',
        theme = 'dark',
        compressed = false,
        canvasWidth = 1920,
        canvasHeight = 1080
    } = options

    const cdnUrls = CDN_OPTIONS[cdn] || CDN_OPTIONS.jsdelivr

    // 生成组件初始化代码
    const componentScripts = generateComponentScripts(components)

    // 生成组件 HTML
    const componentHTML = generateComponentHTML(components)

    // 生成样式
    const themeStyles = generateThemeStyles(theme)

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!-- Element Plus CSS -->
  <link rel="stylesheet" href="${cdnUrls.elementPlusCss}">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    
    #app {
      width: 100vw;
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${theme === 'dark' ? '#0a0e27' : '#f5f7fa'};
    }
    
    .dashboard-container {
      width: ${canvasWidth}px;
      height: ${canvasHeight}px;
      position: relative;
      transform-origin: center center;
      background: ${theme === 'dark' ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3c 100%)' : '#ffffff'};
      ${theme === 'tech' ? 'background: linear-gradient(135deg, #001529 0%, #002140 100%);' : ''}
    }
    
    .component-wrapper {
      position: absolute;
      border-radius: 8px;
      overflow: hidden;
    }
    
    ${themeStyles}
    
    /* ECharts 容器 */
    .echarts-container {
      width: 100%;
      height: 100%;
    }
    
    /* 统计卡片样式 */
    .stat-card {
      padding: 20px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'};
      border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
      border-radius: 8px;
    }
    
    .stat-card .title {
      font-size: 14px;
      color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#666'};
      margin-bottom: 10px;
    }
    
    .stat-card .value {
      font-size: 36px;
      font-weight: bold;
      color: ${theme === 'dark' ? '#fff' : '#333'};
    }
    
    .stat-card .trend {
      font-size: 12px;
      color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.5)' : '#999'};
      margin-top: 8px;
    }
    
    /* 表格样式 */
    .data-table {
      width: 100%;
      height: 100%;
      padding: 15px;
      background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fff'};
      border: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e4e7ed'};
      border-radius: 8px;
      overflow: auto;
    }
    
    .data-table .table-title {
      font-size: 16px;
      font-weight: bold;
      color: ${theme === 'dark' ? '#fff' : '#333'};
      margin-bottom: 15px;
    }
    
    .data-table table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .data-table th, .data-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid ${theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e4e7ed'};
      color: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : '#333'};
    }
    
    .data-table th {
      background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f5f7fa'};
      font-weight: 600;
    }
    
    /* Header/Title 样式 */
    .header-brick {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      color: ${theme === 'dark' ? '#fff' : '#333'};
      background: ${theme === 'dark' ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      ${theme === 'dark' ? 'color: #fff;' : 'color: #fff;'}
      letter-spacing: 4px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .title-brick {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      color: ${theme === 'dark' ? '#fff' : '#333'};
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="dashboard-container" id="dashboard">
      ${componentHTML}
    </div>
  </div>
  
  <!-- Vue 3 -->
  <script src="${cdnUrls.vue}"></script>
  <!-- ECharts -->
  <script src="${cdnUrls.echarts}"></script>
  <!-- ECharts Liquidfill -->
  <script src="${cdnUrls.echartsLiquidfill}"></script>
  <!-- Element Plus -->
  <script src="${cdnUrls.elementPlus}"></script>
  
  <script>
    // 自适应缩放
    function autoScale() {
      const dashboard = document.getElementById('dashboard');
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      const dashboardWidth = ${canvasWidth};
      const dashboardHeight = ${canvasHeight};
      
      const scaleX = containerWidth / dashboardWidth;
      const scaleY = containerHeight / dashboardHeight;
      const scale = Math.min(scaleX, scaleY);
      
      dashboard.style.transform = 'scale(' + scale + ')';
    }
    
    window.addEventListener('resize', autoScale);
    autoScale();
    
    // 初始化图表
    ${componentScripts}
  </script>
</body>
</html>`

    return compressed ? minifyHTML(html) : html
}

/**
 * 生成组件 HTML
 */
function generateComponentHTML(components) {
    return components.map(comp => {
        const style = `left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px;`

        switch (comp.type) {
            case 'EChartBrick':
            case 'LineChartBrick':
            case 'PieChartBrick':
            case 'HorizontalBarBrick':
            case 'RadarBrick':
            case 'FunnelBrick':
            case 'RingBarBrick':
            case 'GaugeBrick':
            case 'WaterDropBrick':
            case 'EChartMapBrick':
                return `<div class="component-wrapper" style="${style}">
          <div class="echarts-container" id="chart-${comp.id}"></div>
        </div>`

            case 'StatCardBrick':
                return `<div class="component-wrapper" style="${style}">
          <div class="stat-card">
            <div class="title">${comp.props.title || ''}</div>
            <div class="value">${formatNumber(comp.props.value)}</div>
            <div class="trend">${comp.props.trend || ''}</div>
          </div>
        </div>`

            case 'TableBrick':
                const columns = comp.props.columns || []
                const rows = comp.props.rows || []
                const thHTML = columns.map(col => `<th>${col}</th>`).join('')
                const trHTML = rows.map(row =>
                    `<tr>${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}</tr>`
                ).join('')
                return `<div class="component-wrapper" style="${style}">
          <div class="data-table">
            <div class="table-title">${comp.props.title || ''}</div>
            <table>
              <thead><tr>${thHTML}</tr></thead>
              <tbody>${trHTML}</tbody>
            </table>
          </div>
        </div>`

            case 'HeaderBrick':
                return `<div class="component-wrapper" style="${style}">
          <div class="header-brick">${comp.props.text || ''}</div>
        </div>`

            case 'TitleBrick':
                return `<div class="component-wrapper" style="${style}">
          <div class="title-brick">${comp.props.text || ''}</div>
        </div>`

            default:
                return `<div class="component-wrapper" style="${style}">
          <div style="padding: 20px; color: #666;">组件: ${comp.type}</div>
        </div>`
        }
    }).join('\n      ')
}

/**
 * 生成组件初始化脚本
 */
function generateComponentScripts(components) {
    const chartComponents = components.filter(comp =>
        ['EChartBrick', 'LineChartBrick', 'PieChartBrick', 'HorizontalBarBrick',
            'RadarBrick', 'FunnelBrick', 'RingBarBrick', 'GaugeBrick', 'WaterDropBrick', 'EChartMapBrick'].includes(comp.type)
    )

    return chartComponents.map(comp => {
        const chartOption = generateChartOption(comp)
        return `
    (function() {
      const chartDom = document.getElementById('chart-${comp.id}');
      if (chartDom) {
        const chart = echarts.init(chartDom);
        chart.setOption(${JSON.stringify(chartOption, null, 2)});
        window.addEventListener('resize', () => chart.resize());
      }
    })();`
    }).join('\n')
}

/**
 * 生成 ECharts 配置
 */
function generateChartOption(comp) {
    const { props } = comp
    const chartType = props.chartType || getChartTypeFromComponent(comp.type)

    // 基础配置
    const baseOption = {
        backgroundColor: 'transparent',
        title: {
            text: props.title || '',
            left: 'center',
            textStyle: { color: '#fff', fontSize: 16 }
        },
        tooltip: { trigger: chartType === 'pie' ? 'item' : 'axis' },
        grid: { left: '10%', right: '10%', bottom: '15%', top: '20%' }
    }

    // 根据图表类型生成配置
    switch (chartType) {
        case 'bar':
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: props.data?.xAxis || [],
                    axisLabel: { color: '#aaa' }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#aaa' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
                },
                series: (props.chartOption || []).map((opt, idx) => ({
                    name: opt.name,
                    type: 'bar',
                    data: props.data?.series?.[idx]?.data || [],
                    itemStyle: { color: opt.color }
                }))
            }

        case 'line':
            return {
                ...baseOption,
                xAxis: {
                    type: 'category',
                    data: props.data?.xAxis || [],
                    axisLabel: { color: '#aaa' }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: { color: '#aaa' },
                    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }
                },
                series: (props.chartOption || []).map((opt, idx) => ({
                    name: opt.name,
                    type: 'line',
                    smooth: true,
                    data: props.data?.series?.[idx]?.data || [],
                    itemStyle: { color: opt.color }
                }))
            }

        case 'pie':
            return {
                ...baseOption,
                series: [{
                    type: 'pie',
                    radius: ['40%', '70%'],
                    center: ['50%', '55%'],
                    data: (props.data || []).map((item, idx) => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: { color: props.chartOption?.[idx]?.color }
                    }))
                }]
            }

        case 'radar':
            return {
                ...baseOption,
                radar: {
                    indicator: props.data?.indicator || [],
                    center: ['50%', '55%']
                },
                series: [{
                    type: 'radar',
                    data: (props.chartOption || []).map((opt, idx) => ({
                        name: opt.name,
                        value: props.data?.series?.[idx]?.data || [],
                        itemStyle: { color: opt.color }
                    }))
                }]
            }

        case 'funnel':
            return {
                ...baseOption,
                series: [{
                    type: 'funnel',
                    left: '10%',
                    width: '80%',
                    data: (props.data || []).map((item, idx) => ({
                        value: item.value,
                        name: item.name,
                        itemStyle: { color: props.chartOption?.[idx]?.color }
                    }))
                }]
            }

        case 'gauge':
            return {
                ...baseOption,
                series: [{
                    type: 'gauge',
                    min: props.min || 0,
                    max: props.max || 100,
                    detail: { formatter: `{value}${props.unit || ''}`, color: '#fff', fontSize: 20 },
                    data: [{ value: props.value || 0 }]
                }]
            }

        case 'liquidFill':
            return {
                backgroundColor: 'transparent',
                series: [{
                    type: 'liquidFill',
                    data: [props.value / 100 || 0],
                    radius: '80%',
                    label: { formatter: (props.value || 0) + '%', fontSize: 28 }
                }]
            }

        case 'map':
            return {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item'
                },
                visualMap: props.showVisualMap ? {
                    min: 0,
                    max: Math.max(...(props.regionData || []).map(item => Number(item.value) || 0), 100),
                    left: 16,
                    bottom: 16,
                    text: ['高', '低'],
                    calculable: true,
                    inRange: {
                        color: ['#dce9ff', '#32c5ff', '#0b5cff']
                    }
                } : undefined,
                series: [
                    {
                        type: 'map',
                        map: props.mapName || '示例地图',
                        roam: props.roam !== false,
                        zoom: props.zoom || 1.1,
                        label: {
                            show: props.showLabel !== false,
                            color: '#dce7f5',
                            offset: [0, props.labelOffsetY || 0]
                        },
                        itemStyle: {
                            areaColor: props.areaColor || '#10243f',
                            borderColor: props.borderColor || '#2f7ef7',
                            borderWidth: props.borderWidth ?? 1.2
                        },
                        emphasis: {
                            itemStyle: {
                                areaColor: props.emphasisAreaColor || '#0b5cff'
                            }
                        },
                        data: props.regionData || []
                    },
                    {
                        type: 'effectScatter',
                        coordinateSystem: 'geo',
                        rippleEffect: { scale: 4, brushType: 'stroke' },
                        symbolSize: function (value) {
                            const minSize = props.scatterMinSize ?? 10
                            const maxSize = props.scatterMaxSize ?? 26
                            return Math.max(minSize, Math.min(maxSize, (Number(value && value[2]) || minSize) / 6))
                        },
                        label: {
                            show: props.showScatterLabel !== false,
                            formatter: '{b}',
                            position: 'top',
                            color: '#dce7f5'
                        },
                        itemStyle: {
                            color: props.scatterColor || '#ffd166',
                            shadowColor: props.scatterShadowColor || '#ffd166',
                            shadowBlur: 14
                        },
                        data: props.scatterData || []
                    },
                    {
                        type: 'lines',
                        coordinateSystem: 'geo',
                        effect: {
                            show: true,
                            period: 5,
                            symbol: 'arrow',
                            symbolSize: props.lineSymbolSize || 8,
                            trailLength: 0.2
                        },
                        lineStyle: {
                            color: props.lineColor || '#00e5a8',
                            width: props.lineWidth || 2,
                            opacity: 0.8,
                            curveness: props.lineCurveness ?? 0.3
                        },
                        data: props.lineData || []
                    }
                ]
            }

        default:
            return baseOption
    }
}

/**
 * 根据组件类型获取图表类型
 */
function getChartTypeFromComponent(componentType) {
    const mapping = {
        'EChartBrick': 'bar',
        'LineChartBrick': 'line',
        'PieChartBrick': 'pie',
        'HorizontalBarBrick': 'bar',
        'RadarBrick': 'radar',
        'FunnelBrick': 'funnel',
        'RingBarBrick': 'pie',
        'GaugeBrick': 'gauge',
        'WaterDropBrick': 'liquidFill',
        'EChartMapBrick': 'map'
    }
    return mapping[componentType] || 'bar'
}

/**
 * 生成主题样式
 */
function generateThemeStyles(theme) {
    if (theme === 'tech') {
        return `
    /* 科技风格额外样式 */
    .dashboard-container::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    }
    `
    }
    return ''
}

/**
 * 格式化数字
 */
function formatNumber(num) {
    if (num === undefined || num === null) return '0'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 压缩 HTML
 */
function minifyHTML(html) {
    return html
        .replace(/\n\s*\n/g, '\n')
        .replace(/>\s+</g, '><')
        .replace(/\s{2,}/g, ' ')
}

/**
 * 生成 Vue 组件代码
 */
export function generateVueComponent(components, options = {}) {
    const {
        componentName = 'Dashboard',
        canvasWidth = 1920,
        canvasHeight = 1080
    } = options

    const componentImports = generateVueImports(components)
    const componentTemplate = generateVueTemplate(components, canvasWidth, canvasHeight)
    const componentData = generateVueData(components)

    return `<template>
  <div class="dashboard-container" ref="containerRef">
    <div class="dashboard-content" :style="contentStyle">
      ${componentTemplate}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
${componentImports}

// 容器引用
const containerRef = ref(null)
const scale = ref(1)

// 画布尺寸
const canvasWidth = ${canvasWidth}
const canvasHeight = ${canvasHeight}

// 计算缩放后的样式
const contentStyle = computed(() => ({
  width: canvasWidth + 'px',
  height: canvasHeight + 'px',
  transform: \`scale(\${scale.value})\`
}))

// 自适应缩放
const calculateScale = () => {
  if (!containerRef.value) return
  const containerWidth = containerRef.value.clientWidth
  const containerHeight = containerRef.value.clientHeight
  const scaleX = containerWidth / canvasWidth
  const scaleY = containerHeight / canvasHeight
  scale.value = Math.min(scaleX, scaleY)
}

onMounted(() => {
  calculateScale()
  window.addEventListener('resize', calculateScale)
})

onUnmounted(() => {
  window.removeEventListener('resize', calculateScale)
})

// 组件数据
${componentData}
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dashboard-bg, #0a0e27);
  overflow: hidden;
}

.dashboard-content {
  position: relative;
  transform-origin: center center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3c 100%);
}

.component-wrapper {
  position: absolute;
  border-radius: 8px;
  overflow: hidden;
}
</style>
`
}

/**
 * 生成 Vue 导入语句
 */
function generateVueImports(components) {
    const types = [...new Set(components.map(c => c.type))]
    const imports = []

    if (types.some(t => t.includes('Chart') || t.includes('Brick'))) {
        imports.push(`import * as echarts from 'echarts'`)
    }

    return imports.join('\n')
}

/**
 * 生成 Vue 模板
 */
function generateVueTemplate(components, canvasWidth, canvasHeight) {
    return components.map(comp => {
        const style = `left: ${comp.x}px; top: ${comp.y}px; width: ${comp.width}px; height: ${comp.height}px;`
        return `<div class="component-wrapper" style="${style}">
        <!-- ${comp.type}: ${comp.props.title || comp.props.text || ''} -->
        <div :ref="el => initChart(el, '${comp.id}')" style="width: 100%; height: 100%;"></div>
      </div>`
    }).join('\n      ')
}

/**
 * 生成 Vue 数据
 */
function generateVueData(components) {
    const chartsData = {}
    components.forEach(comp => {
        chartsData[comp.id] = {
            type: comp.type,
            props: comp.props
        }
    })

    return `const chartsData = ${JSON.stringify(chartsData, null, 2)}

const initChart = (el, id) => {
  if (!el || !chartsData[id]) return
  // ECharts 初始化逻辑
  const chart = echarts.init(el)
  // 根据 chartsData[id] 配置图表
}`
}

/**
 * 生成 React 组件代码
 */
export function generateReactComponent(components, options = {}) {
    const {
        componentName = 'Dashboard',
        canvasWidth = 1920,
        canvasHeight = 1080
    } = options

    const componentImports = generateReactImports(components)
    const componentTemplate = generateReactTemplate(components)
    const componentData = generateReactData(components)

    return `import React, { useRef, useEffect, useState, useCallback } from 'react'
${componentImports}

const ${componentName} = () => {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(1)
  
  const canvasWidth = ${canvasWidth}
  const canvasHeight = ${canvasHeight}

  // 自适应缩放
  const calculateScale = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight
    const scaleX = containerWidth / canvasWidth
    const scaleY = containerHeight / canvasHeight
    setScale(Math.min(scaleX, scaleY))
  }, [])

  useEffect(() => {
    calculateScale()
    window.addEventListener('resize', calculateScale)
    return () => window.removeEventListener('resize', calculateScale)
  }, [calculateScale])

  // 组件数据
  ${componentData}

  return (
    <div ref={containerRef} className="dashboard-container">
      <div 
        className="dashboard-content"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: \`scale(\${scale})\`
        }}
      >
        ${componentTemplate}
      </div>
    </div>
  )
}

export default ${componentName}

// CSS Styles (可以放入单独的 CSS 文件)
const styles = \`
.dashboard-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--dashboard-bg, #0a0e27);
  overflow: hidden;
}

.dashboard-content {
  position: relative;
  transform-origin: center center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3c 100%);
}

.component-wrapper {
  position: absolute;
  border-radius: 8px;
  overflow: hidden;
}
\`
`
}

/**
 * 生成 React 导入语句
 */
function generateReactImports(components) {
    const types = [...new Set(components.map(c => c.type))]
    const imports = []

    if (types.some(t => t.includes('Chart') || t.includes('Brick'))) {
        imports.push(`import * as echarts from 'echarts'`)
    }

    return imports.join('\n')
}

/**
 * 生成 React 模板
 */
function generateReactTemplate(components) {
    return components.map(comp => {
        const style = `{ position: 'absolute', left: ${comp.x}, top: ${comp.y}, width: ${comp.width}, height: ${comp.height} }`
        return `<div className="component-wrapper" style={${style}}>
          {/* ${comp.type}: ${comp.props.title || comp.props.text || ''} */}
          <ChartComponent id="${comp.id}" />
        </div>`
    }).join('\n        ')
}

/**
 * 生成 React 数据
 */
function generateReactData(components) {
    const chartsData = {}
    components.forEach(comp => {
        chartsData[comp.id] = {
            type: comp.type,
            props: comp.props
        }
    })

    return `const chartsData = ${JSON.stringify(chartsData, null, 2)}`
}

/**
 * 批量导出
 */
export async function batchExport(components, formats, options = {}) {
    const zip = new JSZip()
    const { fileName = 'dashboard-export', pages = [], projectSettings = {}, projectSettingsMap = {} } = options

    for (const format of formats) {
        switch (format) {
            case 'json':
                const jsonData = {
                    version: '1.0',
                    createTime: new Date().toISOString(),
                    pages: pages.length > 0 ? pages.map((page, index) => ({
                        name: page.name,
                        pageId: `page${index + 1}`,
                        projectId: page.projectId,
                        projectName: page.projectName,
                        components: page.components
                    })) : [{ name: '页面 1', pageId: 'page1', components }],
                    projectSettings,
                    projectSettingsMap
                }
                zip.file('template.json', JSON.stringify(jsonData, null, 2))
                break

            case 'html':
                const html = generateStandaloneHTML(components, options)
                zip.file('index.html', html)
                break

            case 'vue':
                const vueCode = generateVueComponent(components, options)
                zip.file('Dashboard.vue', vueCode)
                break

            case 'react':
                const reactCode = generateReactComponent(components, options)
                zip.file('Dashboard.jsx', reactCode)
                break
        }
    }

    const blob = await zip.generateAsync({ type: 'blob' })
    saveAs(blob, `${fileName}.zip`)
}

/**
 * 下载文件
 */
export function downloadFile(content, fileName, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType })
    saveAs(blob, fileName)
}

/**
 * 下载 Blob
 */
export function downloadBlob(blob, fileName) {
    saveAs(blob, fileName)
}

// 导出 CDN 选项供 UI 使用
export { CDN_OPTIONS }
