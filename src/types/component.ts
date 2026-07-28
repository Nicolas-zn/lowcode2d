/**
 * 组件类型定义
 * 统一组件库组件和业务组件的数据格式
 */

/**
 * API 配置
 */
export interface ApiConfig {
  url: string
  suffix: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  token?: string
  headers?: Record<string, string>
  _t?: number // 时间戳，用于强制更新
}

/**
 * 数据转换配置
 */
export interface DataTransformConfig {
  /** 是否启用转换 */
  enabled: boolean
  /** 数据路径映射 */
  pathMapping?: Record<string, string>
  /** 自定义转换函数（字符串形式） */
  transformFunction?: string
}

/**
 * 事件动作类型
 */
export type EventActionType = 'emit' | 'setVariable' | 'navigate' | 'custom'

/**
 * 事件动作配置
 */
export interface EventAction {
  /** 动作类型 */
  type: EventActionType
  /** 事件名称（emit 类型使用） */
  eventName?: string
  /** 变量名（setVariable 类型使用） */
  variableName?: string
  /** 变量值表达式（setVariable 类型使用） */
  variableValue?: string
  /** 导航URL（navigate 类型使用） */
  url?: string
  /** 自定义代码（custom 类型使用） */
  customCode?: string
}

/**
 * 组件事件配置
 */
export interface ComponentEvent {
  /** 事件类型 */
  eventType: 'click' | 'hover' | 'change'
  /** 是否启用 */
  enabled: boolean
  /** 事件动作列表 */
  actions: EventAction[]
}

/**
 * 组件属性（动态，不包含 title）
 */
export interface ComponentProps {
  text?: string
  chartType?: string
  data?: any
  [key: string]: any
}

/**
 * 基础组件配置（所有组件的共同部分）
 */
export interface BaseComponentConfig {
  /** 组件类型（对应 Vue 组件名） */
  type: string
  /** 组件名称（显示名） */
  name: string
  /** 图标类名 */
  icon: string
  /** 组件标题 */
  title: string
  /** 默认宽度 */
  defaultWidth: number
  /** 默认高度 */
  defaultHeight: number
}

/**
 * 组件库组件配置（包含默认数据）
 */
export interface BrickConfig extends BaseComponentConfig {
  /** 默认属性（包含默认数据，但不包含 title） */
  defaultProps: ComponentProps
}

/**
 * 业务组件配置（通过 API 获取数据）
 */
export interface BusinessComponentConfig extends BaseComponentConfig {
  /** 预配置的 API */
  api: ApiConfig
  /** 标记为业务组件 */
  isBusinessComponent: true
  // 注意：业务组件不需要 defaultProps，数据从 API 获取
}

/**
 * 组件配置（联合类型）
 */
export type ComponentConfig = BrickConfig | BusinessComponentConfig

/**
 * 画布上的组件实例
 */
export interface ComponentInstance {
  /** 唯一标识 */
  id: number | string
  /** 组件名称 */
  name: string
  /** 组件类型 */
  type: string
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 组件属性（包含 title 和其他数据） */
  props: ComponentProps & { title?: string }
  /** API 配置（可选） */
  api?: ApiConfig | null
  /** 数据源ID（可选） */
  dataSourceId?: string | null
  /** 数据转换配置（可选） */
  dataTransform?: DataTransformConfig | null
  /** 事件配置（可选） */
  events?: ComponentEvent[]
  /** 条件显示表达式（可选） */
  visibilityCondition?: string
  /** 是否为业务组件 */
  isBusinessComponent?: boolean
}

/**
 * 模板数据
 */
export interface TemplateData {
  version: string
  createTime: string
  components: ComponentInstance[]
}

/**
 * 类型守卫：判断是否为业务组件配置
 */
export function isBusinessComponentConfig(
  config: ComponentConfig
): config is BusinessComponentConfig {
  return 'isBusinessComponent' in config && config.isBusinessComponent === true
}

/**
 * 类型守卫：判断是否为业务组件实例
 */
export function isBusinessComponentInstance(
  instance: ComponentInstance
): boolean {
  return instance.isBusinessComponent === true
}
