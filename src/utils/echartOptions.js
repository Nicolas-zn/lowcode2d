import { colorPalettes } from '../assets/echartColorPalette/index.js'

export const defaultChartColors = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#4facfe',
  '#00f2fe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#a8edea'
]

const findChartOption = (chartOptions = [], name, index) => {
  if (!Array.isArray(chartOptions)) return null

  let option = null
  if (name) {
    option = chartOptions.find(item => item?.field && item.field === name)
  }
  if (!option && name) {
    option = chartOptions.find(item => !item?.field && item?.name === name)
  }
  return option || chartOptions[index] || null
}

const getChartItems = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.series)) return data.series
  return []
}

export const createChartOptionsFromData = (data, existingOptions = []) => {
  const items = getChartItems(data)

  return items.map((item, index) => {
    const sourceName = item?.name || `数据${index + 1}`
    const existingOption = findChartOption(existingOptions, sourceName, index)

    return {
      name: existingOption?.name || sourceName,
      field: existingOption?.field || sourceName,
      color: existingOption?.color || item?.color || item?.itemStyle?.color || defaultChartColors[index % defaultChartColors.length]
    }
  })
}

export const applyChartPalette = (chartOptions = [], paletteName = '') => {
  if (!paletteName || !colorPalettes[paletteName] || !Array.isArray(chartOptions)) return chartOptions

  const palette = colorPalettes[paletteName]
  return chartOptions.map((item, index) => ({
    ...item,
    color: palette[index % palette.length]
  }))
}

export const resolveChartOptions = (data, chartOptions = [], paletteName = '') => {
  const options = createChartOptionsFromData(data, chartOptions)
  return paletteName ? applyChartPalette(options, paletteName) : options
}

export const applyOptionsToSeries = (series = [], chartOptions = []) => {
  if (!Array.isArray(series)) return series

  return series.map((item, index) => {
    const option = findChartOption(chartOptions, item?.name, index)
    return {
      ...item,
      name: option?.name || item.name,
      color: option?.color || item.color
    }
  })
}

export const applyOptionsToDataItems = (data = [], chartOptions = []) => {
  if (!Array.isArray(data)) return data

  return data.map((item, index) => {
    const option = findChartOption(chartOptions, item?.name, index)
    return {
      ...item,
      name: option?.name || item.name,
      itemStyle: {
        ...item.itemStyle,
        color: option?.color || item.itemStyle?.color
      }
    }
  })
}
