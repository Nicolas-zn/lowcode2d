/**
 * 业务组件库主入口
 * 汇总所有业务分类的组件配置
 */

import { assetComponents } from './asset/index.js'
import { deviceComponents } from './device/index.js'
import { hostComponents } from './host/index.js'
import { alarmComponents } from './alarm/index.js'
import { logComponents } from './log/index.js'
import { wirelessComponents } from './wireless/index.js'
import { middlewareComponents } from './middleware/index.js'
import { flowComponents } from './flow/index.js'
// 兼容旧版导入
import { assetsBusinessComponents } from './assets/index.js'

// 汇总所有业务组件
const allBusinessComponents = [
    ...assetComponents,
    ...deviceComponents,
    ...hostComponents,
    ...alarmComponents,
    ...logComponents,
    ...wirelessComponents,
    ...middlewareComponents,
    ...flowComponents
]

// 按分类分组
const businessComponentsByCategory = {
    '资产': assetComponents,
    '设备': deviceComponents,
    '主机': hostComponents,
    '告警': alarmComponents,
    '日志': logComponents,
    '无线': wirelessComponents,
    '中间件': middlewareComponents,
    '流量': flowComponents
}

export {
    allBusinessComponents,
    businessComponentsByCategory,
    // 兼容旧版导入
    assetsBusinessComponents,
    // 单独导出各分类
    assetComponents,
    deviceComponents,
    hostComponents,
    alarmComponents,
    logComponents,
    wirelessComponents,
    middlewareComponents,
    flowComponents
}