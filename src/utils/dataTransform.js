/**
 * 数据转换工具函数
 * 提供独立的数据处理方法，可在组件中直接使用
 */

// ============ 数据映射 ============

/**
 * 获取嵌套对象的值
 * @param {Object} obj - 源对象
 * @param {string} path - 路径字符串，如 'data.list[0].name'
 * @returns {*} 对应路径的值
 */
export const getNestedValue = (obj, path) => {
  if (!path) return obj
  const keys = path.split('.')
  let value = obj
  for (const key of keys) {
    if (value === null || value === undefined) return undefined
    // 支持数组索引
    const match = key.match(/^(\w+)\[(\d+)\]$/)
    if (match) {
      value = value[match[1]]
      if (Array.isArray(value)) {
        value = value[parseInt(match[2])]
      }
    } else {
      value = value[key]
    }
  }
  return value
}

// 保留旧函数名作为别名，保持向后兼容
export const getValueByPath = getNestedValue

/**
 * 设置嵌套对象的值
 * @param {Object} obj - 目标对象
 * @param {string} path - 路径字符串
 * @param {*} value - 要设置的值
 */
export const setNestedValue = (obj, path, value) => {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === undefined) {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
}

/**
 * 数据字段映射
 * @param {Array|Object} data - 源数据
 * @param {Array} mappingRules - 映射规则 [{ sourceField, targetField, expression }]
 * @returns {Array} 映射后的数据
 */
export const mapData = (data, mappingRules) => {
  const items = Array.isArray(data) ? data : [data]

  return items.map(item => {
    const mapped = {}

    mappingRules.forEach(rule => {
      const { sourceField, targetField, expression, defaultValue } = rule

      if (expression) {
        try {
          mapped[targetField] = evaluateExpression(expression, item)
        } catch {
          mapped[targetField] = defaultValue ?? null
        }
      } else if (sourceField) {
        const value = getNestedValue(item, sourceField)
        mapped[targetField] = value ?? defaultValue
      }
    })

    return mapped
  })
}

/**
 * 应用路径映射转换数据（保持向后兼容）
 * @param {any} data - 源数据
 * @param {Object} pathMapping - 路径映射配置
 * @returns {any} 转换后的数据
 */
export function applyPathMapping(data, pathMapping) {
  if (!data || !pathMapping || typeof pathMapping !== 'object') {
    return data
  }

  const result = {}

  for (const [targetPath, sourcePath] of Object.entries(pathMapping)) {
    const value = getNestedValue(data, sourcePath)
    if (value !== undefined) {
      result[targetPath] = value
    }
  }

  return result
}

// ============ 计算字段 ============

/**
 * 执行表达式
 * @param {string} expression - 表达式字符串
 * @param {Object} context - 上下文对象
 * @returns {*} 计算结果
 */
export const evaluateExpression = (expression, context) => {
  const fn = new Function('$', `
    with ($) {
      return ${expression};
    }
  `)
  return fn(context)
}

/**
 * 添加计算字段
 * @param {Array|Object} data - 源数据
 * @param {Array} fields - 计算字段配置 [{ name, expression }]
 * @returns {Array} 添加计算字段后的数据
 */
export const addCalculatedFields = (data, fields) => {
  const items = Array.isArray(data) ? data : [data]

  return items.map(item => {
    const result = { ...item }

    fields.forEach(field => {
      try {
        result[field.name] = evaluateExpression(field.expression, item)
      } catch (error) {
        console.warn(`计算字段 ${field.name} 错误:`, error)
        result[field.name] = null
      }
    })

    return result
  })
}

// ============ 数据过滤 ============

/**
 * 过滤操作符
 */
export const filterOperators = {
  eq: { label: '等于', value: 'eq' },
  neq: { label: '不等于', value: 'neq' },
  gt: { label: '大于', value: 'gt' },
  gte: { label: '大于等于', value: 'gte' },
  lt: { label: '小于', value: 'lt' },
  lte: { label: '小于等于', value: 'lte' },
  contains: { label: '包含', value: 'contains' },
  notContains: { label: '不包含', value: 'notContains' },
  startsWith: { label: '开头是', value: 'startsWith' },
  endsWith: { label: '结尾是', value: 'endsWith' },
  isEmpty: { label: '为空', value: 'isEmpty' },
  isNotEmpty: { label: '不为空', value: 'isNotEmpty' },
  in: { label: '在列表中', value: 'in' },
  notIn: { label: '不在列表中', value: 'notIn' },
  regex: { label: '正则匹配', value: 'regex' },
  between: { label: '在范围内', value: 'between' }
}

/**
 * 评估过滤条件
 * @param {*} fieldValue - 字段值
 * @param {string} operator - 操作符
 * @param {*} compareValue - 比较值
 * @returns {boolean} 是否满足条件
 */
export const evaluateCondition = (fieldValue, operator, compareValue) => {
  switch (operator) {
    case 'eq':
      return fieldValue == compareValue
    case 'neq':
      return fieldValue != compareValue
    case 'gt':
      return parseFloat(fieldValue) > parseFloat(compareValue)
    case 'gte':
      return parseFloat(fieldValue) >= parseFloat(compareValue)
    case 'lt':
      return parseFloat(fieldValue) < parseFloat(compareValue)
    case 'lte':
      return parseFloat(fieldValue) <= parseFloat(compareValue)
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
    case 'notContains':
      return !String(fieldValue).toLowerCase().includes(String(compareValue).toLowerCase())
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(compareValue).toLowerCase())
    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(compareValue).toLowerCase())
    case 'isEmpty':
      return fieldValue === null || fieldValue === undefined || fieldValue === ''
    case 'isNotEmpty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
    case 'in':
      const inValues = String(compareValue).split(',').map(v => v.trim())
      return inValues.includes(String(fieldValue))
    case 'notIn':
      const notInValues = String(compareValue).split(',').map(v => v.trim())
      return !notInValues.includes(String(fieldValue))
    case 'regex':
      try {
        return new RegExp(compareValue).test(String(fieldValue))
      } catch {
        return false
      }
    case 'between':
      const [min, max] = String(compareValue).split(',').map(v => parseFloat(v.trim()))
      const numValue = parseFloat(fieldValue)
      return numValue >= min && numValue <= max
    default:
      return true
  }
}

/**
 * 过滤数据
 * @param {Array} data - 源数据
 * @param {Array} conditions - 过滤条件 [{ field, operator, value }]
 * @param {string} logic - 逻辑关系 'and' | 'or'
 * @returns {Array} 过滤后的数据
 */
export const filterData = (data, conditions, logic = 'and') => {
  if (!Array.isArray(data)) return data
  if (!conditions || conditions.length === 0) return data

  return data.filter(item => {
    const results = conditions.map(condition => {
      const fieldValue = getNestedValue(item, condition.field)
      return evaluateCondition(fieldValue, condition.operator, condition.value)
    })

    return logic === 'or' ? results.some(r => r) : results.every(r => r)
  })
}

// ============ 数据排序 ============

/**
 * 排序数据
 * @param {Array} data - 源数据
 * @param {Array} rules - 排序规则 [{ field, order: 'asc' | 'desc' }]
 * @returns {Array} 排序后的数据
 */
export const sortData = (data, rules) => {
  if (!Array.isArray(data) || !rules || rules.length === 0) return data

  return [...data].sort((a, b) => {
    for (const rule of rules) {
      const { field, order } = rule
      const aVal = getNestedValue(a, field)
      const bVal = getNestedValue(b, field)

      let comparison = 0
      if (aVal === null || aVal === undefined) comparison = 1
      else if (bVal === null || bVal === undefined) comparison = -1
      else if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal, 'zh-CN')
      } else {
        if (aVal < bVal) comparison = -1
        if (aVal > bVal) comparison = 1
      }

      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}

// ============ 数据聚合 ============

/**
 * 聚合函数
 */
export const aggregateFunctions = {
  sum: (arr, field) => arr.reduce((acc, item) => acc + (parseFloat(getNestedValue(item, field)) || 0), 0),
  avg: (arr, field) => {
    const sum = arr.reduce((acc, item) => acc + (parseFloat(getNestedValue(item, field)) || 0), 0)
    return arr.length ? Math.round((sum / arr.length) * 100) / 100 : 0
  },
  max: (arr, field) => Math.max(...arr.map(item => parseFloat(getNestedValue(item, field)) || 0)),
  min: (arr, field) => Math.min(...arr.map(item => parseFloat(getNestedValue(item, field)) || 0)),
  count: (arr) => arr.length,
  countDistinct: (arr, field) => new Set(arr.map(item => getNestedValue(item, field))).size,
  first: (arr, field) => arr.length ? getNestedValue(arr[0], field) : null,
  last: (arr, field) => arr.length ? getNestedValue(arr[arr.length - 1], field) : null,
  concat: (arr, field, separator = ', ') => arr.map(item => getNestedValue(item, field)).join(separator),
  distinct: (arr, field) => [...new Set(arr.map(item => getNestedValue(item, field)))]
}

/**
 * 聚合数据
 * @param {Array} data - 源数据
 * @param {Object} config - 聚合配置 { groupBy: [], metrics: [{ field, function, alias }] }
 * @returns {Array} 聚合后的数据
 */
export const aggregateData = (data, config) => {
  if (!Array.isArray(data)) return data

  const { groupBy = [], metrics = [] } = config

  if (groupBy.length === 0) {
    // 无分组，对整体聚合
    const result = {}
    metrics.forEach(metric => {
      const fn = aggregateFunctions[metric.function]
      if (fn) {
        result[metric.alias || `${metric.function}_${metric.field}`] = fn(data, metric.field)
      }
    })
    return [result]
  }

  // 按字段分组
  const groups = {}
  data.forEach(item => {
    const key = groupBy.map(field => getNestedValue(item, field)).join('|')
    if (!groups[key]) {
      groups[key] = {
        items: [],
        groupValues: {}
      }
      groupBy.forEach(field => {
        groups[key].groupValues[field] = getNestedValue(item, field)
      })
    }
    groups[key].items.push(item)
  })

  // 计算每组的聚合值
  return Object.values(groups).map(group => {
    const result = { ...group.groupValues }
    metrics.forEach(metric => {
      const fn = aggregateFunctions[metric.function]
      if (fn) {
        result[metric.alias || `${metric.function}_${metric.field}`] = fn(group.items, metric.field)
      }
    })
    return result
  })
}

// ============ 数据格式化 ============

/**
 * 格式化函数集合
 */
export const formatters = {
  // 数字格式化
  number: (value, options = {}) => {
    const { decimals = 2, thousandSeparator = true, prefix = '', suffix = '' } = options
    const num = parseFloat(value)
    if (isNaN(num)) return value
    let formatted = num.toFixed(decimals)
    if (thousandSeparator) {
      formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    return `${prefix}${formatted}${suffix}`
  },

  // 货币格式化
  currency: (value, options = {}) => {
    const { locale = 'zh-CN', currency = 'CNY' } = options
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num)
  },

  // 百分比格式化
  percent: (value, options = {}) => {
    const { decimals = 2, multiply = true } = options
    const num = parseFloat(value)
    if (isNaN(num)) return value
    const pct = multiply ? num * 100 : num
    return `${pct.toFixed(decimals)}%`
  },

  // 日期格式化
  date: (value, options = {}) => {
    const { format = 'YYYY-MM-DD HH:mm:ss' } = options
    const date = new Date(value)
    if (isNaN(date.getTime())) return value

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  },

  // 相对时间
  relativeTime: (value) => {
    const date = new Date(value)
    if (isNaN(date.getTime())) return value

    const now = new Date()
    const diff = now - date
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (years > 0) return `${years}年前`
    if (months > 0) return `${months}个月前`
    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  },

  // 文件大小
  fileSize: (value, options = {}) => {
    const { decimals = 2 } = options
    const bytes = parseFloat(value)
    if (isNaN(bytes)) return value

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    let unitIndex = 0
    let size = bytes

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(decimals)} ${units[unitIndex]}`
  },

  // 手机号脱敏
  phoneMask: (value) => {
    const str = String(value)
    if (str.length !== 11) return value
    return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  },

  // 身份证脱敏
  idCardMask: (value) => {
    const str = String(value)
    if (str.length < 15) return value
    return str.replace(/(\d{4})\d+(\d{4})/, '$1**********$2')
  },

  // 邮箱脱敏
  emailMask: (value) => {
    const str = String(value)
    const atIndex = str.indexOf('@')
    if (atIndex <= 1) return value
    return str[0] + '***' + str.substring(atIndex)
  },

  // 银行卡脱敏
  bankCardMask: (value) => {
    const str = String(value).replace(/\s/g, '')
    if (str.length < 8) return value
    return str.replace(/(\d{4})\d+(\d{4})/, '$1 **** **** $2')
  },

  // 首字母大写
  capitalize: (value) => {
    const str = String(value)
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // 全部大写
  uppercase: (value) => String(value).toUpperCase(),

  // 全部小写
  lowercase: (value) => String(value).toLowerCase(),

  // 截断文本
  truncate: (value, options = {}) => {
    const { length = 20, suffix = '...' } = options
    const str = String(value)
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  },

  // JSON 格式化
  json: (value, options = {}) => {
    const { indent = 2 } = options
    try {
      if (typeof value === 'string') {
        value = JSON.parse(value)
      }
      return JSON.stringify(value, null, indent)
    } catch {
      return value
    }
  },

  // 布尔值格式化
  boolean: (value, options = {}) => {
    const { trueText = '是', falseText = '否' } = options
    return value ? trueText : falseText
  },

  // 状态标签
  status: (value, options = {}) => {
    const { mapping = {} } = options
    return mapping[value] || value
  }
}

/**
 * 格式化数据
 * @param {Array|Object} data - 源数据
 * @param {Array} rules - 格式化规则 [{ field, formatter, options }]
 * @returns {Array} 格式化后的数据
 */
export const formatData = (data, rules) => {
  const items = Array.isArray(data) ? data : [data]

  return items.map(item => {
    const result = { ...item }

    rules.forEach(rule => {
      const { field, formatter, options } = rule
      const formatFn = formatters[formatter]
      if (formatFn && result[field] !== undefined) {
        result[`${field}_formatted`] = formatFn(result[field], options)
      }
    })

    return result
  })
}

// ============ 数据转换脚本 ============

/**
 * 执行自定义转换脚本
 * @param {*} data - 源数据
 * @param {string} script - 脚本代码
 * @returns {*} 转换后的数据
 */
export const executeScript = (data, script) => {
  try {
    const fn = new Function('data', 'utils', `
      const { 
        getNestedValue, mapData, filterData, sortData, aggregateData, formatData,
        sum, avg, max, min, count, formatNumber, formatDate, formatCurrency, groupBy
      } = utils;
      ${script}
      return typeof transform === 'function' ? transform(data) : data;
    `)

    const utils = {
      getNestedValue,
      mapData,
      filterData,
      sortData,
      aggregateData,
      formatData,
      sum: (arr, field) => aggregateFunctions.sum(arr, field),
      avg: (arr, field) => aggregateFunctions.avg(arr, field),
      max: (arr, field) => aggregateFunctions.max(arr, field),
      min: (arr, field) => aggregateFunctions.min(arr, field),
      count: (arr) => aggregateFunctions.count(arr),
      formatNumber: (value, options) => formatters.number(value, options),
      formatDate: (value, options) => formatters.date(value, options),
      formatCurrency: (value, options) => formatters.currency(value, options),
      groupBy: (arr, field) => {
        const groups = {}
        arr.forEach(item => {
          const key = getNestedValue(item, field)
          if (!groups[key]) groups[key] = []
          groups[key].push(item)
        })
        return groups
      }
    }

    return fn(data, utils)
  } catch (error) {
    console.error('脚本执行错误:', error)
    return data
  }
}

// ============ 完整的数据转换流水线 ============

/**
 * 执行完整的数据转换流水线
 * @param {*} data - 源数据
 * @param {Object} config - 转换配置
 * @returns {*} 转换后的数据
 */
export const transformData = (data, config = {}) => {
  let result = data

  // 1. 数据映射
  if (config.mapping?.enabled && config.mapping?.rules?.length > 0) {
    result = mapData(result, config.mapping.rules)
  }

  // 2. 计算字段
  if (config.calculatedFields?.length > 0) {
    result = addCalculatedFields(result, config.calculatedFields)
  }

  // 3. 数据过滤
  if (config.filters?.enabled && config.filters?.conditions?.length > 0) {
    result = filterData(result, config.filters.conditions, config.filters.logic)
  }

  // 4. 数据排序
  if (config.sorting?.enabled && config.sorting?.rules?.length > 0) {
    result = sortData(result, config.sorting.rules)
  }

  // 5. 数据聚合
  if (config.aggregation?.enabled) {
    result = aggregateData(result, config.aggregation)
  }

  // 6. 数据格式化
  if (config.formatting?.enabled && config.formatting?.rules?.length > 0) {
    result = formatData(result, config.formatting.rules)
  }

  // 7. 自定义脚本
  if (config.script?.enabled && config.script?.code) {
    result = executeScript(result, config.script.code)
  }

  return result
}

export default {
  getNestedValue,
  getValueByPath,
  setNestedValue,
  mapData,
  applyPathMapping,
  evaluateExpression,
  addCalculatedFields,
  filterOperators,
  evaluateCondition,
  filterData,
  sortData,
  aggregateFunctions,
  aggregateData,
  formatters,
  formatData,
  executeScript,
  transformData
}
