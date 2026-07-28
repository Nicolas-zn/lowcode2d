import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDataTransformStore = defineStore('dataTransform', () => {
    // 数据转换规则列表
    const transforms = ref([])

    // 预设的聚合函数
    const aggregateFunctions = {
        sum: (arr, field) => arr.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0),
        avg: (arr, field) => {
            const sum = arr.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0)
            return arr.length ? sum / arr.length : 0
        },
        max: (arr, field) => Math.max(...arr.map(item => parseFloat(item[field]) || 0)),
        min: (arr, field) => Math.min(...arr.map(item => parseFloat(item[field]) || 0)),
        count: (arr) => arr.length,
        first: (arr, field) => arr.length ? arr[0][field] : null,
        last: (arr, field) => arr.length ? arr[arr.length - 1][field] : null,
        distinct: (arr, field) => [...new Set(arr.map(item => item[field]))],
        countDistinct: (arr, field) => new Set(arr.map(item => item[field])).size
    }

    // 预设的格式化函数
    const formatters = {
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
            const { decimals = 2 } = options
            const num = parseFloat(value)
            if (isNaN(num)) return value
            return `${(num * 100).toFixed(decimals)}%`
        },
        // 日期格式化
        date: (value, options = {}) => {
            const { format = 'YYYY-MM-DD' } = options
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
        // 相对时间格式化
        relativeTime: (value) => {
            const date = new Date(value)
            if (isNaN(date.getTime())) return value

            const now = new Date()
            const diff = now - date
            const seconds = Math.floor(diff / 1000)
            const minutes = Math.floor(seconds / 60)
            const hours = Math.floor(minutes / 60)
            const days = Math.floor(hours / 24)

            if (days > 0) return `${days}天前`
            if (hours > 0) return `${hours}小时前`
            if (minutes > 0) return `${minutes}分钟前`
            return '刚刚'
        },
        // 文件大小格式化
        fileSize: (value) => {
            const bytes = parseFloat(value)
            if (isNaN(bytes)) return value

            const units = ['B', 'KB', 'MB', 'GB', 'TB']
            let unitIndex = 0
            let size = bytes

            while (size >= 1024 && unitIndex < units.length - 1) {
                size /= 1024
                unitIndex++
            }

            return `${size.toFixed(2)} ${units[unitIndex]}`
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
        }
    }

    // 创建新的转换规则
    const createTransform = (config) => {
        const transform = {
            id: config.id || Date.now() + Math.random(),
            name: config.name || '未命名转换',
            description: config.description || '',
            // 数据映射配置
            mapping: config.mapping || {
                enabled: false,
                rules: [] // { sourceField, targetField, expression }
            },
            // 计算字段配置
            calculatedFields: config.calculatedFields || [],
            // 过滤条件配置
            filters: config.filters || {
                enabled: false,
                conditions: [], // { field, operator, value, logic }
                logic: 'and' // 'and' | 'or'
            },
            // 排序配置
            sorting: config.sorting || {
                enabled: false,
                rules: [] // { field, order }
            },
            // 聚合配置
            aggregation: config.aggregation || {
                enabled: false,
                groupBy: [],
                metrics: [] // { field, function, alias }
            },
            // 格式化配置
            formatting: config.formatting || {
                enabled: false,
                rules: [] // { field, formatter, options }
            },
            // 自定义脚本
            script: config.script || {
                enabled: false,
                code: ''
            },
            createdAt: Date.now(),
            updatedAt: Date.now()
        }

        transforms.value.push(transform)
        return transform
    }

    // 更新转换规则
    const updateTransform = (id, updates) => {
        const index = transforms.value.findIndex(t => t.id === id)
        if (index !== -1) {
            transforms.value[index] = {
                ...transforms.value[index],
                ...updates,
                updatedAt: Date.now()
            }
        }
    }

    // 删除转换规则
    const removeTransform = (id) => {
        const index = transforms.value.findIndex(t => t.id === id)
        if (index !== -1) {
            transforms.value.splice(index, 1)
        }
    }

    // 获取指定转换规则
    const getTransform = (id) => {
        return transforms.value.find(t => t.id === id)
    }

    // 应用数据映射
    const applyMapping = (data, mappingRules) => {
        if (!Array.isArray(data)) {
            data = [data]
        }

        return data.map(item => {
            const mapped = {}

            mappingRules.forEach(rule => {
                const { sourceField, targetField, expression } = rule

                if (expression) {
                    // 使用表达式计算
                    try {
                        const result = evaluateExpression(expression, item)
                        mapped[targetField] = result
                    } catch (error) {
                        console.error('映射表达式执行错误:', error)
                        mapped[targetField] = null
                    }
                } else if (sourceField) {
                    // 简单字段映射，支持嵌套路径
                    mapped[targetField] = getNestedValue(item, sourceField)
                }
            })

            return mapped
        })
    }

    // 应用计算字段
    const applyCalculatedFields = (data, fields) => {
        if (!Array.isArray(data)) {
            data = [data]
        }

        return data.map(item => {
            const result = { ...item }

            fields.forEach(field => {
                const { name, expression } = field
                try {
                    result[name] = evaluateExpression(expression, item)
                } catch (error) {
                    console.error(`计算字段 ${name} 执行错误:`, error)
                    result[name] = null
                }
            })

            return result
        })
    }

    // 应用过滤条件
    const applyFilters = (data, filterConfig) => {
        if (!Array.isArray(data)) {
            data = [data]
        }

        const { conditions, logic } = filterConfig

        return data.filter(item => {
            const results = conditions.map(condition => {
                const { field, operator, value } = condition
                const fieldValue = getNestedValue(item, field)

                return evaluateCondition(fieldValue, operator, value)
            })

            if (logic === 'or') {
                return results.some(r => r)
            }
            return results.every(r => r)
        })
    }

    // 应用排序
    const applySorting = (data, sortRules) => {
        if (!Array.isArray(data)) {
            return data
        }

        return [...data].sort((a, b) => {
            for (const rule of sortRules) {
                const { field, order } = rule
                const aVal = getNestedValue(a, field)
                const bVal = getNestedValue(b, field)

                let comparison = 0
                if (aVal < bVal) comparison = -1
                if (aVal > bVal) comparison = 1

                if (comparison !== 0) {
                    return order === 'desc' ? -comparison : comparison
                }
            }
            return 0
        })
    }

    // 应用聚合
    const applyAggregation = (data, aggregationConfig) => {
        if (!Array.isArray(data)) {
            data = [data]
        }

        const { groupBy, metrics } = aggregationConfig

        if (groupBy.length === 0) {
            // 无分组，对整体数据聚合
            const result = {}
            metrics.forEach(metric => {
                const { field, function: fn, alias } = metric
                const aggregateFunc = aggregateFunctions[fn]
                if (aggregateFunc) {
                    result[alias || `${fn}_${field}`] = aggregateFunc(data, field)
                }
            })
            return [result]
        }

        // 按指定字段分组
        const groups = {}
        data.forEach(item => {
            const key = groupBy.map(field => getNestedValue(item, field)).join('|')
            if (!groups[key]) {
                groups[key] = {
                    _items: [],
                    _groupValues: {}
                }
                groupBy.forEach(field => {
                    groups[key]._groupValues[field] = getNestedValue(item, field)
                })
            }
            groups[key]._items.push(item)
        })

        // 对每个分组应用聚合函数
        return Object.values(groups).map(group => {
            const result = { ...group._groupValues }
            metrics.forEach(metric => {
                const { field, function: fn, alias } = metric
                const aggregateFunc = aggregateFunctions[fn]
                if (aggregateFunc) {
                    result[alias || `${fn}_${field}`] = aggregateFunc(group._items, field)
                }
            })
            return result
        })
    }

    // 应用格式化
    const applyFormatting = (data, formattingRules) => {
        if (!Array.isArray(data)) {
            data = [data]
        }

        return data.map(item => {
            const result = { ...item }

            formattingRules.forEach(rule => {
                const { field, formatter, options } = rule
                const formatFunc = formatters[formatter]
                if (formatFunc && result[field] !== undefined) {
                    result[field] = formatFunc(result[field], options)
                }
            })

            return result
        })
    }

    // 应用自定义脚本
    const applyScript = (data, scriptCode) => {
        try {
            // 创建安全的执行环境
            const fn = new Function('data', 'utils', `
        const { sum, avg, max, min, count, formatNumber, formatDate, formatCurrency, groupBy } = utils;
        ${scriptCode}
        return typeof transform === 'function' ? transform(data) : data;
      `)

            const utils = {
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
                        const key = item[field]
                        if (!groups[key]) groups[key] = []
                        groups[key].push(item)
                    })
                    return groups
                }
            }

            return fn(data, utils)
        } catch (error) {
            console.error('自定义脚本执行错误:', error)
            return data
        }
    }

    // 执行完整的数据转换流水线
    const executeTransform = (data, transformId) => {
        const transform = getTransform(transformId)
        if (!transform) {
            console.error('转换规则不存在:', transformId)
            return data
        }

        let result = data

        // 1. 应用数据映射
        if (transform.mapping.enabled && transform.mapping.rules.length > 0) {
            result = applyMapping(result, transform.mapping.rules)
        }

        // 2. 应用计算字段
        if (transform.calculatedFields.length > 0) {
            result = applyCalculatedFields(result, transform.calculatedFields)
        }

        // 3. 应用过滤条件
        if (transform.filters.enabled && transform.filters.conditions.length > 0) {
            result = applyFilters(result, transform.filters)
        }

        // 4. 应用排序
        if (transform.sorting.enabled && transform.sorting.rules.length > 0) {
            result = applySorting(result, transform.sorting.rules)
        }

        // 5. 应用聚合
        if (transform.aggregation.enabled && transform.aggregation.metrics.length > 0) {
            result = applyAggregation(result, transform.aggregation)
        }

        // 6. 应用格式化
        if (transform.formatting.enabled && transform.formatting.rules.length > 0) {
            result = applyFormatting(result, transform.formatting.rules)
        }

        // 7. 应用自定义脚本
        if (transform.script.enabled && transform.script.code) {
            result = applyScript(result, transform.script.code)
        }

        return result
    }

    // 执行内联转换（不需要预先创建转换规则）
    const executeInlineTransform = (data, config) => {
        let result = data

        if (config.mapping?.enabled && config.mapping?.rules?.length > 0) {
            result = applyMapping(result, config.mapping.rules)
        }

        if (config.calculatedFields?.length > 0) {
            result = applyCalculatedFields(result, config.calculatedFields)
        }

        if (config.filters?.enabled && config.filters?.conditions?.length > 0) {
            result = applyFilters(result, config.filters)
        }

        if (config.sorting?.enabled && config.sorting?.rules?.length > 0) {
            result = applySorting(result, config.sorting.rules)
        }

        if (config.aggregation?.enabled && config.aggregation?.metrics?.length > 0) {
            result = applyAggregation(result, config.aggregation)
        }

        if (config.formatting?.enabled && config.formatting?.rules?.length > 0) {
            result = applyFormatting(result, config.formatting.rules)
        }

        if (config.script?.enabled && config.script?.code) {
            result = applyScript(result, config.script.code)
        }

        return result
    }

    // 辅助函数：获取嵌套对象的值
    const getNestedValue = (obj, path) => {
        if (!path) return obj
        const keys = path.split('.')
        let value = obj
        for (const key of keys) {
            if (value === null || value === undefined) return undefined
            // 支持数组索引，如 items[0]
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

    // 辅助函数：执行条件判断
    const evaluateCondition = (fieldValue, operator, compareValue) => {
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
                return String(fieldValue).includes(String(compareValue))
            case 'notContains':
                return !String(fieldValue).includes(String(compareValue))
            case 'startsWith':
                return String(fieldValue).startsWith(String(compareValue))
            case 'endsWith':
                return String(fieldValue).endsWith(String(compareValue))
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
                    const regex = new RegExp(compareValue)
                    return regex.test(String(fieldValue))
                } catch {
                    return false
                }
            default:
                return true
        }
    }

    // 辅助函数：执行表达式
    const evaluateExpression = (expression, context) => {
        // 安全的表达式执行
        const fn = new Function('$', `
      with ($) {
        return ${expression};
      }
    `)
        return fn(context)
    }

    return {
        transforms,
        aggregateFunctions,
        formatters,
        createTransform,
        updateTransform,
        removeTransform,
        getTransform,
        applyMapping,
        applyCalculatedFields,
        applyFilters,
        applySorting,
        applyAggregation,
        applyFormatting,
        applyScript,
        executeTransform,
        executeInlineTransform,
        getNestedValue,
        evaluateCondition,
        evaluateExpression
    }
}, {
    persist: {
        pick: ['transforms']
    }
})
