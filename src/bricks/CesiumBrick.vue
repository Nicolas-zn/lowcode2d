<template>
  <div class="cesium-brick" ref="cesiumContainer">
    <div v-if="loading" class="cesium-loading">
      <el-icon :size="32" class="loading-icon"><Loading /></el-icon>
      <span>加载 GIS 场景中...</span>
    </div>
    <div v-if="error" class="cesium-error">
      <el-icon :size="24"><WarningFilled /></el-icon>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, provide } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import * as Cesium from 'cesium'
import { InteractionSystem } from '@/cesium-interaction/config/InteractionSystem'

const props = defineProps({
  title: { type: String, default: 'GIS 地图' },
  events: { type: Array, default: () => [] },
  // GIS 配置
  cesiumConfig: {
    type: Object,
    default: () => ({
      baseMap: 'tianditu_img',       // 底图类型
      tiandituToken: 'b72aa81ac2b3571ffd1b5e82ea1eef6c',
      baseMapOpacity: 1,              // 底图透明度
      layers: [],                     // 图层列表
      camera: {                       // 视角
        longitude: 116.3912757,
        latitude: 39.906217,
        height: 15000000,
        heading: 0,
        pitch: -90,
        roll: 0
      },
      models: [],                     // 模型列表
      markers: [],                    // 标注列表
      terrain: false,                 // 是否开启地形
      showTestEntities: true,         // 是否显示测试物料
      scene: {
        enableLighting: false,
        depthTestAgainstTerrain: false,
        showSkyBox: true,
        showSkyAtmosphere: true,
        showSun: true,
        showMoon: true,
        fog: true,
        fogDensity: 0.0006
      },
      controls: {
        enableRotate: true,
        enableZoom: true,
        enableTilt: true,
        minZoomDistance: 50,
        maxZoomDistance: 50000000
      },
      routeHeight: 500,
      routePoints: [],
      routeStyle: {
        visible: true,
        color: '#67C23A',
        width: 4,
        clampToGround: false
      }
    })
  }
})

const cesiumContainer = ref(null)
const loading = ref(true)
const error = ref(null)
let viewer = null
let interactionSystem = null
let routeLineEntity = null
const modelPrimitives = new Set()
let activeTerrainEnabled = null
let contentRenderVersion = 0

const defaultCesiumConfig = {
  baseMap: 'tianditu_img',
  tiandituToken: 'b72aa81ac2b3571ffd1b5e82ea1eef6c',
  baseMapOpacity: 1,
  terrain: false,
  showTestEntities: true,
  scene: {
    enableLighting: false,
    depthTestAgainstTerrain: false,
    showSkyBox: true,
    showSkyAtmosphere: true,
    showSun: true,
    showMoon: true,
    fog: true,
    fogDensity: 0.0006
  },
  controls: {
    enableRotate: true,
    enableZoom: true,
    enableTilt: true,
    minZoomDistance: 50,
    maxZoomDistance: 50000000
  },
  camera: {
    longitude: 116.3912757,
    latitude: 39.906217,
    height: 15000000,
    heading: 0,
    pitch: -90,
    roll: 0,
    duration: 1.5
  },
  layers: [],
  models: [],
  markers: [],
  routeHeight: 500,
  routePoints: [],
  routeStyle: {
    visible: true,
    color: '#67C23A',
    width: 4,
    clampToGround: false
  }
}

const mergeConfig = (config = {}) => ({
  ...defaultCesiumConfig,
  ...config,
  scene: { ...defaultCesiumConfig.scene, ...(config.scene || {}) },
  controls: { ...defaultCesiumConfig.controls, ...(config.controls || {}) },
  camera: { ...defaultCesiumConfig.camera, ...(config.camera || {}) },
  routeStyle: { ...defaultCesiumConfig.routeStyle, ...(config.routeStyle || {}) },
  layers: Array.isArray(config.layers) ? config.layers : [],
  models: Array.isArray(config.models) ? config.models : [],
  markers: Array.isArray(config.markers) ? config.markers : [],
  routePoints: Array.isArray(config.routePoints) ? config.routePoints : []
})

const getNumber = (value, fallback) => {
  if (value === '' || value === null || value === undefined) return fallback
  return Number.isFinite(Number(value)) ? Number(value) : fallback
}

const toCesiumColor = (color, alpha = 1) => {
  try {
    return Cesium.Color.fromCssColorString(color || '#409EFF').withAlpha(alpha)
  } catch {
    return Cesium.Color.fromCssColorString('#409EFF').withAlpha(alpha)
  }
}

const sameConfigPart = (left, right) => JSON.stringify(left || null) === JSON.stringify(right || null)

// 底图提供者映射
const baseMapProviders = {
  tianditu_img: (token) => {
    // 天地图影像
    return new Cesium.UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${token}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    })
  },
  tianditu_vec: (token) => {
    // 天地图矢量
    return new Cesium.UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${token}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    })
  },
  tianditu_ter: (token) => {
    // 天地图地形
    return new Cesium.UrlTemplateImageryProvider({
      url: `https://t{s}.tianditu.gov.cn/ter_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=${token}`,
      subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
      maximumLevel: 18
    })
  },
  osm: () => {
    return new Cesium.OpenStreetMapImageryProvider({
      url: 'https://a.tile.openstreetmap.org/'
    })
  },
  arcgis: () => {
    return new Cesium.ArcGisMapServerImageryProvider({
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
    })
  }
}

// 初始化 Cesium Viewer
const initViewer = async () => {
  if (!cesiumContainer.value) return
  loading.value = true
  error.value = null

  try {
    // 清除可能已有的 viewer
    if (viewer) {
      viewer.destroy()
      viewer = null
    }
    activeTerrainEnabled = null
    contentRenderVersion++

    const config = mergeConfig(props.cesiumConfig)

    viewer = new Cesium.Viewer(cesiumContainer.value, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      useBrowserRecommendedResolution: false,
      contextOptions: {
        webgl: {
          preserveDrawingBuffer: true
        }
      },
      creditContainer: document.createElement('div'), // 隐藏版权
      baseLayer: false
    })

    // 针对 Mac/高分屏及CSS缩放导致的 WebGL 拾取错位问题：强制对齐设备物理像素
    viewer.resolutionScale = window.devicePixelRatio || 1

    // 设置场景、地形、控制器和底图
    applySceneSettings(config)
    applyControls(config.controls)
    await applyTerrain(config.terrain)
    applyBaseMap(config.baseMap || 'tianditu_img', config.baseMapOpacity, config.tiandituToken)

    // 设置视角
    if (config.camera) {
      flyToCamera(config.camera)
    }

    applyContent(config)

    // 暴露到全局供配置面板使用
    window.cesiumViewer = viewer

    // 初始化交互系统
    interactionSystem = new InteractionSystem(viewer)
    console.log('交互系统已初始化:', interactionSystem)

    if (props.events && props.events.length > 0) {
      console.log('加载事件配置:', props.events)
      // 转换配置格式
      const convertedEvents = props.events.map(e => ({
        target: {
          name: e.value,
          nameMatch: e.matchType || 'equal'
        },
        event: e.event,
        actions: e.actions.map(action => {
          if (e.actionParams && e.actionParams[action]) {
            return { name: action, params: e.actionParams[action] }
          }
          return action
        })
      }))
      interactionSystem.loadConfig({ interactions: convertedEvents })
    }

    loading.value = false
  } catch (e) {
    error.value = '地图加载失败: ' + e.message
    loading.value = false
    console.error('Cesium init error:', e)
  }
}

const applyTerrain = async (enabled) => {
  if (!viewer) return
  const terrainEnabled = !!enabled
  if (activeTerrainEnabled === terrainEnabled) return

  try {
    if (terrainEnabled && Cesium.createWorldTerrainAsync) {
      viewer.terrainProvider = await Cesium.createWorldTerrainAsync({
        requestVertexNormals: true,
        requestWaterMask: true
      })
    } else {
      viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
    }
    activeTerrainEnabled = terrainEnabled
  } catch (e) {
    console.warn('地形加载失败，已回退为椭球地形:', e)
    viewer.terrainProvider = new Cesium.EllipsoidTerrainProvider()
    activeTerrainEnabled = false
  }
}

const applySceneSettings = (config) => {
  if (!viewer) return
  const sceneConfig = { ...defaultCesiumConfig.scene, ...(config.scene || {}) }
  const scene = viewer.scene

  if (scene.globe) {
    scene.globe.enableLighting = !!sceneConfig.enableLighting
    scene.globe.depthTestAgainstTerrain = !!sceneConfig.depthTestAgainstTerrain
  }
  if (scene.skyBox) scene.skyBox.show = !!sceneConfig.showSkyBox
  if (scene.skyAtmosphere) scene.skyAtmosphere.show = !!sceneConfig.showSkyAtmosphere
  if (scene.sun) scene.sun.show = !!sceneConfig.showSun
  if (scene.moon) scene.moon.show = !!sceneConfig.showMoon
  if (scene.fog) {
    scene.fog.enabled = !!sceneConfig.fog
    scene.fog.density = getNumber(sceneConfig.fogDensity, defaultCesiumConfig.scene.fogDensity)
  }
  viewer.scene.requestRender()
}

const applyControls = (controls = {}) => {
  if (!viewer) return
  const mergedControls = { ...defaultCesiumConfig.controls, ...controls }
  const controller = viewer.scene.screenSpaceCameraController

  controller.enableRotate = !!mergedControls.enableRotate
  controller.enableZoom = !!mergedControls.enableZoom
  controller.enableTilt = !!mergedControls.enableTilt
  controller.minimumZoomDistance = getNumber(mergedControls.minZoomDistance, 50)
  controller.maximumZoomDistance = getNumber(mergedControls.maxZoomDistance, 50000000)
}

const clearSceneContent = () => {
  if (!viewer) return

  while (viewer.imageryLayers.length > 1) {
    viewer.imageryLayers.remove(viewer.imageryLayers.get(1), true)
  }
  viewer.entities.removeAll()
  viewer.dataSources.removeAll()
  modelPrimitives.forEach(primitive => {
    if (viewer.scene.primitives.contains(primitive)) {
      viewer.scene.primitives.remove(primitive)
    }
  })
  modelPrimitives.clear()
  routeLineEntity = null
}

const applyContent = (rawConfig) => {
  if (!viewer) return
  const config = mergeConfig(rawConfig)
  const renderVersion = ++contentRenderVersion

  clearSceneContent()
  applyLayers(config.layers)
  applyModels(config.models, renderVersion)
  applyMarkers(config.markers)
  applyRoute(config.routePoints, config.routeHeight, config.routeStyle)
  if (config.showTestEntities) {
    addTestEntities()
  }
  viewer.scene.requestRender()
}

// 应用底图
const applyBaseMap = (mapType, opacity = 1, tiandituToken = defaultCesiumConfig.tiandituToken) => {
  if (!viewer) return
  // 移除所有影像图层
  viewer.imageryLayers.removeAll()

  const providerFn = baseMapProviders[mapType]
  if (providerFn) {
    try {
      const provider = providerFn(tiandituToken || defaultCesiumConfig.tiandituToken)
      const baseLayer = viewer.imageryLayers.addImageryProvider(provider)
      baseLayer.alpha = getNumber(opacity, 1)
      baseLayer._name = 'base-map'
    } catch (e) {
      console.error('底图加载失败:', e)
      // fallback: OSM
      const osm = new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      })
      const baseLayer = viewer.imageryLayers.addImageryProvider(osm)
      baseLayer.alpha = getNumber(opacity, 1)
      baseLayer._name = 'base-map'
    }
  }
}

// 飞到指定视角
const flyToCamera = (camera) => {
  if (!viewer) return
  const cameraConfig = { ...defaultCesiumConfig.camera, ...(camera || {}) }
  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(
      cameraConfig.longitude,
      cameraConfig.latitude,
      cameraConfig.height
    ),
    orientation: {
      heading: Cesium.Math.toRadians(cameraConfig.heading),
      pitch: Cesium.Math.toRadians(cameraConfig.pitch),
      roll: Cesium.Math.toRadians(cameraConfig.roll)
    },
    duration: getNumber(cameraConfig.duration, 1.5)
  })
}

// 飞到特定实体或模型
const flyToEntity = (entityIdOrName) => {
  if (!viewer) return
  const entity = viewer.entities.getById(entityIdOrName) || viewer.entities.values.find(e => e.name === entityIdOrName)
  if (entity) {
    viewer.flyTo(entity, { duration: 1.5 })
  } else {
    // 可能是 dataSource 里的
    for (let i = 0; i < viewer.dataSources.length; i++) {
      const ds = viewer.dataSources.get(i)
      const e = ds.entities.getById(entityIdOrName) || ds.entities.values.find(en => en.name === entityIdOrName)
      if (e) {
        viewer.flyTo(e, { duration: 1.5 })
        break
      }
    }
  }
}

// 相机漫游路线
const startCameraRoam = (points) => {
  if (!viewer || !points || points.length === 0) return
  let index = 0;
  const flyNext = () => {
    if (index >= points.length) return
    const p = points[index++]
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude, p.height || 1000),
      orientation: {
        heading: Cesium.Math.toRadians(p.heading || 0),
        pitch: Cesium.Math.toRadians(p.pitch || -45),
        roll: Cesium.Math.toRadians(p.roll || 0)
      },
      duration: p.duration || 3,
      complete: () => { 
        if (p.delay) {
          setTimeout(flyNext, p.delay)
        } else {
          flyNext()
        }
      }
    })
  }
  flyNext()
}

// 应用图层
const applyLayers = (layers) => {
  if (!viewer) return

  layers.forEach(layer => {
    if (!layer.visible || !layer.url) return

    try {
      if (layer.type === 'wms') {
        const provider = new Cesium.WebMapServiceImageryProvider({
          url: layer.url,
          layers: layer.layerName || '',
          parameters: {
            transparent: true,
            format: layer.format || 'image/png'
          }
        })
        const imgLayer = viewer.imageryLayers.addImageryProvider(provider)
        imgLayer.alpha = layer.opacity ?? 1
        imgLayer._name = layer.name || layer.layerName
      } else if (layer.type === 'wmts') {
        const provider = new Cesium.WebMapTileServiceImageryProvider({
          url: layer.url,
          layer: layer.layerName || '',
          style: layer.style || 'default',
          tileMatrixSetID: layer.tileMatrixSetID || 'GoogleMapsCompatible',
          format: layer.format || 'image/png'
        })
        const imgLayer = viewer.imageryLayers.addImageryProvider(provider)
        imgLayer.alpha = layer.opacity ?? 1
        imgLayer._name = layer.name || layer.layerName
      } else if (layer.type === 'geojson') {
        Cesium.GeoJsonDataSource.load(layer.url, {
          stroke: toCesiumColor(layer.strokeColor || '#409EFF', 1),
          fill: toCesiumColor(layer.fillColor || '#409EFF', layer.opacity ?? 0.5),
          strokeWidth: getNumber(layer.strokeWidth, 2),
          clampToGround: !!layer.clampToGround
        }).then(ds => {
          ds.name = layer.name || layer.url
          ds.show = layer.visible !== false
          viewer.dataSources.add(ds)
        })
      } else if (layer.type === 'kml') {
        Cesium.KmlDataSource.load(layer.url).then(ds => {
          ds.name = layer.name || layer.url
          ds.show = layer.visible !== false
          viewer.dataSources.add(ds)
        })
      }
    } catch (e) {
      console.error(`图层加载失败 [${layer.name}]:`, e)
    }
  })
}

const createModelOrientation = (position, model = {}) => {
  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(getNumber(model.heading, 0)),
    Cesium.Math.toRadians(getNumber(model.pitch, 0)),
    Cesium.Math.toRadians(getNumber(model.roll, 0))
  )
  return Cesium.Transforms.headingPitchRollQuaternion(position, hpr)
}

const createTilesetModelMatrix = (position, model = {}) => {
  const hpr = new Cesium.HeadingPitchRoll(
    Cesium.Math.toRadians(getNumber(model.heading, 0)),
    Cesium.Math.toRadians(getNumber(model.pitch, 0)),
    Cesium.Math.toRadians(getNumber(model.roll, 0))
  )

  if (Cesium.Transforms.headingPitchRollToFixedFrame) {
    return Cesium.Transforms.headingPitchRollToFixedFrame(position, hpr)
  }
  return Cesium.Transforms.eastNorthUpToFixedFrame(position)
}

const createModelGraphics = (model) => ({
  uri: model.url,
  scale: getNumber(model.scale, 1),
  minimumPixelSize: getNumber(model.minimumPixelSize, 64),
  maximumScale: getNumber(model.maximumScale, 20000),
  color: model.color ? toCesiumColor(model.color, model.colorAlpha ?? 1) : undefined,
  colorBlendMode: model.color ? Cesium.ColorBlendMode.MIX : undefined,
  colorBlendAmount: model.color ? getNumber(model.colorBlendAmount, 0.5) : undefined
})

// 应用模型
const applyModels = (models, renderVersion = contentRenderVersion) => {
  if (!viewer) return

  models.forEach((model, index) => {
    if (!model.url || model.visible === false) return
    try {
      const position = Cesium.Cartesian3.fromDegrees(
        getNumber(model.longitude, 116.3912757),
        getNumber(model.latitude, 39.906217),
        getNumber(model.height, 0)
      )
      const entityId = model.id || `model-${index}`

      if (model.type === '3dtiles') {
        // 3D Tiles
        Cesium.Cesium3DTileset.fromUrl(model.url).then(tileset => {
          if (!viewer || renderVersion !== contentRenderVersion) {
            tileset.destroy?.()
            return
          }
          tileset._name = model.name || model.url
          tileset.show = model.visible !== false
          tileset.modelMatrix = createTilesetModelMatrix(position, model)
          if (model.maximumScreenSpaceError) {
            tileset.maximumScreenSpaceError = getNumber(model.maximumScreenSpaceError, tileset.maximumScreenSpaceError)
          }
          modelPrimitives.add(tileset)
          viewer.scene.primitives.add(tileset)
        })
      } else if (model.type === 'obj' || model.type === 'fbx') {
        // 动态加载 Three.js 以转换格式为 GLB 供 Cesium 使用
        Promise.all([
          import('three'),
          import('three/addons/loaders/OBJLoader.js'),
          import('three/addons/loaders/FBXLoader.js'),
          import('three/addons/exporters/GLTFExporter.js')
        ]).then(([THREE, { OBJLoader }, { FBXLoader }, { GLTFExporter }]) => {
            const loader = model.type === 'obj' ? new OBJLoader() : new FBXLoader()
            loader.load(model.url, (object) => {
              if (!viewer || renderVersion !== contentRenderVersion) return
              const exporter = new GLTFExporter()
              exporter.parse(
                object,
                (gltf) => {
                  if (!viewer || renderVersion !== contentRenderVersion) return
                  const blob = new Blob([gltf], { type: 'application/octet-stream' })
                  const blobUrl = URL.createObjectURL(blob)
                  viewer.entities.add({
                    id: entityId,
                    name: model.name || model.url,
                    position,
                    orientation: createModelOrientation(position, model),
                    model: {
                      ...createModelGraphics({ ...model, url: blobUrl }),
                      uri: blobUrl
                    }
                  })
                },
                (error) => {
                  console.error('模型转换失败:', error)
                },
                { binary: true }
              )
            }, undefined, (error) => {
              console.error(`模型加载失败 [${model.name}]:`, error)
            })
        }).catch(e => {
            console.error('Three.js 组件加载失败, 无法解析该格式模型', e)
        })
      } else {
        // glTF / GLB 模型
        viewer.entities.add({
          id: entityId,
          name: model.name || model.url,
          position,
          orientation: createModelOrientation(position, model),
          model: createModelGraphics(model)
        })
      }
    } catch (e) {
      console.error(`模型初始化失败 [${model.name}]:`, e)
    }
  })
}

const applyMarkers = (markers) => {
  if (!viewer || !Array.isArray(markers)) return

  markers.forEach((marker, index) => {
    if (marker.visible === false) return

    const longitude = getNumber(marker.longitude, 116.3912757)
    const latitude = getNumber(marker.latitude, 39.906217)
    const height = getNumber(marker.height, 0)
    const labelText = marker.label || marker.name || `标注${index + 1}`
    const entity = {
      id: marker.id || `marker-${index}`,
      name: marker.name || labelText,
      position: Cesium.Cartesian3.fromDegrees(longitude, latitude, height),
      properties: {
        type: 'marker',
        source: marker
      }
    }

    if (marker.iconUrl) {
      entity.billboard = {
        image: marker.iconUrl,
        width: getNumber(marker.iconWidth, 32),
        height: getNumber(marker.iconHeight, 32),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: marker.depthTest === false ? Number.POSITIVE_INFINITY : undefined
      }
    } else if (marker.showPoint !== false) {
      entity.point = {
        pixelSize: getNumber(marker.pixelSize, 12),
        color: toCesiumColor(marker.color || '#F56C6C', marker.alpha ?? 1),
        outlineColor: toCesiumColor(marker.outlineColor || '#FFFFFF', 1),
        outlineWidth: getNumber(marker.outlineWidth, 2),
        heightReference: marker.clampToGround ? Cesium.HeightReference.CLAMP_TO_GROUND : Cesium.HeightReference.NONE,
        disableDepthTestDistance: marker.depthTest === false ? Number.POSITIVE_INFINITY : undefined
      }
    }

    if (marker.labelVisible !== false) {
      entity.label = {
        text: labelText,
        font: `${getNumber(marker.fontSize, 14)}px sans-serif`,
        fillColor: toCesiumColor(marker.labelColor || '#FFFFFF', 1),
        outlineColor: toCesiumColor(marker.labelOutlineColor || '#000000', 1),
        outlineWidth: getNumber(marker.labelOutlineWidth, 2),
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        showBackground: !!marker.labelBackground,
        backgroundColor: toCesiumColor(marker.labelBackgroundColor || '#000000', marker.labelBackgroundAlpha ?? 0.45),
        pixelOffset: new Cesium.Cartesian2(0, getNumber(marker.labelOffsetY, -28)),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        disableDepthTestDistance: marker.depthTest === false ? Number.POSITIVE_INFINITY : undefined
      }
    }

    viewer.entities.add(entity)
  })
}

const applyRoute = (points, routeHeight = 500, style = {}) => {
  if (!viewer || !Array.isArray(points) || points.length < 2 || style.visible === false) return

  const routeStyle = { ...defaultCesiumConfig.routeStyle, ...style }
  const height = getNumber(routeHeight, 500)
  const positions = points.map(point => Cesium.Cartesian3.fromDegrees(
    getNumber(point.longitude, 0),
    getNumber(point.latitude, 0),
    getNumber(point.height, height)
  ))

  routeLineEntity = viewer.entities.add({
    id: 'cesium-route-line',
    name: '漫游路线',
    polyline: {
      positions,
      width: getNumber(routeStyle.width, 4),
      material: toCesiumColor(routeStyle.color || '#67C23A', routeStyle.alpha ?? 0.9),
      clampToGround: !!routeStyle.clampToGround
    }
  })
}

// 显示或隐藏指定图层 (按 name 匹配)
const toggleLayer = (layerName, visible) => {
  if (!viewer) return
  // imagery
  for (let i = 0; i < viewer.imageryLayers.length; i++) {
    const imgLayer = viewer.imageryLayers.get(i)
    if (imgLayer._name === layerName) {
      imgLayer.show = visible
    }
  }
  // dataSources
  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i)
    if (ds.name === layerName) {
      ds.show = visible
    }
  }
  // 3D Tiles primitives
  modelPrimitives.forEach(primitive => {
    if (primitive._name === layerName) {
      primitive.show = visible
    }
  })
}

// 实体/模型高亮
const highlightEntity = (entityIdOrName, colorStr = '#FF0000', alpha = 0.6) => {
  if (!viewer) return
  const entity = viewer.entities.getById(entityIdOrName) || viewer.entities.values.find(e => e.name === entityIdOrName)
  if (!entity) return

  const cvColor = Cesium.Color.fromCssColorString(colorStr).withAlpha(alpha)
  if (entity.model) {
    if (!entity._originalColor) entity._originalColor = entity.model.color?.getValue()
    entity.model.color = cvColor
    entity.model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT
  }
  if (entity.polygon) {
    if (!entity._originalMaterial) entity._originalMaterial = entity.polygon.material
    entity.polygon.material = cvColor
  }
  if (entity.point) {
    if (!entity._originalPointColor) entity._originalPointColor = entity.point.color
    entity.point.color = cvColor
  }
  if (entity.billboard) {
    if (!entity._originalBillboardColor) entity._originalBillboardColor = entity.billboard.color
    entity.billboard.color = cvColor
  }
  if (entity.label) {
    if (!entity._originalLabelFillColor) entity._originalLabelFillColor = entity.label.fillColor
    entity.label.fillColor = cvColor
  }
}

// 取消实体高亮
const unhighlightEntity = (entityIdOrName) => {
  if (!viewer) return
  const entity = viewer.entities.getById(entityIdOrName) || viewer.entities.values.find(e => e.name === entityIdOrName)
  if (!entity) return
  
  if (entity.model) {
    if (entity._originalColor) {
      entity.model.color = entity._originalColor
      entity._originalColor = undefined
    } else {
      entity.model.color = undefined
    }
    entity.model.colorBlendMode = Cesium.ColorBlendMode.HIGHLIGHT
  }
  if (entity.polygon) {
    if (entity._originalMaterial) {
      entity.polygon.material = entity._originalMaterial
      entity._originalMaterial = undefined
    }
  }
  if (entity.point && entity._originalPointColor) {
    entity.point.color = entity._originalPointColor
    entity._originalPointColor = undefined
  }
  if (entity.billboard && entity._originalBillboardColor) {
    entity.billboard.color = entity._originalBillboardColor
    entity._originalBillboardColor = undefined
  }
  if (entity.label && entity._originalLabelFillColor) {
    entity.label.fillColor = entity._originalLabelFillColor
    entity._originalLabelFillColor = undefined
  }
}

// 添加测试物料
const addTestEntities = () => {
  if (!viewer) return

  // Cube - 立方体
  viewer.entities.add({
    id: 'test-cube',
    name: 'cube',
    position: Cesium.Cartesian3.fromDegrees(116.39, 39.9, 100),
    box: {
      dimensions: new Cesium.Cartesian3(100, 100, 100),
      material: Cesium.Color.RED.withAlpha(0.8)
    }
  })

  // Ring - 圆环
  viewer.entities.add({
    id: 'test-ring',
    name: 'ring',
    position: Cesium.Cartesian3.fromDegrees(116.40, 39.9, 0),
    ellipse: {
      semiMinorAxis: 50,
      semiMajorAxis: 50,
      height: 0,
      material: Cesium.Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Cesium.Color.WHITE
    }
  })

  // Sphere - 球体
  viewer.entities.add({
    id: 'test-sphere',
    name: 'sphere',
    position: Cesium.Cartesian3.fromDegrees(116.41, 39.9, 50),
    ellipsoid: {
      radii: new Cesium.Cartesian3(50, 50, 50),
      material: Cesium.Color.GREEN.withAlpha(0.8)
    }
  })
}

// 监听配置变化
watch(() => props.cesiumConfig, async (newConfig, oldConfig) => {
  if (!viewer || !newConfig) return

  await nextTick()
  const config = mergeConfig(newConfig)
  const oldMergedConfig = mergeConfig(oldConfig || {})
  const baseMapChanged = config.baseMap !== oldMergedConfig.baseMap ||
    config.baseMapOpacity !== oldMergedConfig.baseMapOpacity ||
    config.tiandituToken !== oldMergedConfig.tiandituToken
  const sceneChanged = !sameConfigPart(config.scene, oldMergedConfig.scene)
  const controlsChanged = !sameConfigPart(config.controls, oldMergedConfig.controls)
  const terrainChanged = config.terrain !== oldMergedConfig.terrain
  const cameraChanged = !sameConfigPart(config.camera, oldMergedConfig.camera)
  const contentChanged = !sameConfigPart({
    layers: config.layers,
    models: config.models,
    markers: config.markers,
    routeHeight: config.routeHeight,
    routePoints: config.routePoints,
    routeStyle: config.routeStyle,
    showTestEntities: config.showTestEntities
  }, {
    layers: oldMergedConfig.layers,
    models: oldMergedConfig.models,
    markers: oldMergedConfig.markers,
    routeHeight: oldMergedConfig.routeHeight,
    routePoints: oldMergedConfig.routePoints,
    routeStyle: oldMergedConfig.routeStyle,
    showTestEntities: oldMergedConfig.showTestEntities
  })

  if (sceneChanged) applySceneSettings(config)
  if (controlsChanged) applyControls(config.controls)
  if (terrainChanged) await applyTerrain(config.terrain)
  if (baseMapChanged) applyBaseMap(config.baseMap, config.baseMapOpacity, config.tiandituToken)
  if (cameraChanged) {
    flyToCamera(config.camera)
  }
  if (contentChanged) applyContent(config)
}, { deep: true })

// 监听 events 变化
watch(() => props.events, (newEvents) => {
  if (interactionSystem && newEvents) {
    const convertedEvents = newEvents.map(e => ({
      target: {
        name: e.value,
        nameMatch: e.matchType || 'equal'
      },
      event: e.event,
      actions: e.actions.map(action => {
        if (e.actionParams && e.actionParams[action]) {
          return { name: action, params: e.actionParams[action] }
        }
        return action
      })
    }))
    interactionSystem.loadConfig({ interactions: convertedEvents })
  }
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    initViewer()
  })
})

onBeforeUnmount(() => {
  if (interactionSystem) {
    interactionSystem.destroy()
    interactionSystem = null
  }
  const currentViewer = viewer
  if (viewer) {
    viewer.destroy()
    viewer = null
  }
  activeTerrainEnabled = null
  contentRenderVersion++
  if (window.$cesiumBrick) {
    window.$cesiumBrick = null
  }
  if (window.cesiumViewer === currentViewer) {
    window.cesiumViewer = null
  }
})

// 提供 viewer 给子组件
provide('getCesiumViewer', () => viewer)

const flyHome = () => {
  if (props.cesiumConfig && props.cesiumConfig.camera) {
    flyToCamera(props.cesiumConfig.camera)
  } else {
    flyToCamera({})
  }
}

const addMarker = (marker) => {
  applyMarkers([marker])
}

const drawRoute = (points, height, style) => {
  if (routeLineEntity && viewer) {
    viewer.entities.remove(routeLineEntity)
    routeLineEntity = null
  }
  applyRoute(points, height, style)
}

// 梳理暴露出来的方法
const exposeMethods = {
  getViewer: () => viewer,
  flyTo: flyToCamera,
  flyToEntity,
  flyHome,
  startCameraRoam,
  addMarker,
  drawRoute,
  toggleLayer,
  highlightEntity,
  unhighlightEntity,
  setSceneOptions: applySceneSettings,
  setTerrain: applyTerrain,
  refresh: initViewer
}

// 注册为全局组件，挂载到全局 window 对象上，以便其他组件都能访问
window.$cesiumBrick = exposeMethods

// 暴露方法供外部 Vue 父组件调用
defineExpose(exposeMethods)
</script>

<style scoped>
.cesium-brick {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 4px;
  background: #000;
}

.cesium-brick :deep(.cesium-viewer) {
  width: 100% !important;
  height: 100% !important;
}

.cesium-brick :deep(.cesium-viewer-cesiumWidgetContainer) {
  width: 100% !important;
  height: 100% !important;
}

.cesium-brick :deep(.cesium-widget) {
  width: 100% !important;
  height: 100% !important;
}


.cesium-loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  z-index: 10;
  gap: 12px;
  font-size: 14px;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cesium-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: #f56c6c;
  z-index: 10;
  gap: 8px;
  font-size: 13px;
}
</style>
