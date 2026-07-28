// 模板数据类型定义
export interface TemplateConfig {
    components?: Array<{
        id?: number
        name: string
        type: string
        x?: number
        y?: number
        width?: number
        height?: number
        props?: Record<string, any>
        api?: any
    }>
}

export interface Template {
    id?: string
    hashValue: string
    template: TemplateConfig | any  // 支持 JSONB 类型
    created_at?: string
    updated_at?: string
}
