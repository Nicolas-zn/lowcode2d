// 导入所有模板文件
import lowcode_template_20251223_151952 from './lowcode_template_20251223_151952.json'
// 模板列表
export const templateList = [
    {
        id: 'lowcode_template_20251223_151952',
        ...lowcode_template_20251223_151952
    },
]

// 根据 ID 获取模板
export const getTemplateById = (id) => {
    return templateList.find(t => t.id === id)
}
