import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBusinessComponentStore = defineStore('businessComponent', () => {
    // 业务组件列表
    const businessComponents = ref([])

    // 添加业务组件
    const addBusinessComponent = (component) => {
        const newComponent = {
            id: Date.now() + Math.random(),
            name: component.name,
            type: component.type,
            icon: component.icon || 'bi-box-seam',
            createTime: new Date().toISOString(),
            // 保存原始组件数据（不包含位置信息）
            componentData: {
                type: component.type,
                width: component.width,
                height: component.height,
                props: JSON.parse(JSON.stringify(component.props)), // 深拷贝
                api: component.api ? JSON.parse(JSON.stringify(component.api)) : null,
                isBusinessComponent: true // 标记为业务组件
            }
        }

        businessComponents.value.push(newComponent)
        return newComponent
    }

    // 删除业务组件
    const removeBusinessComponent = (id) => {
        const index = businessComponents.value.findIndex(c => c.id === id)
        if (index !== -1) {
            businessComponents.value.splice(index, 1)
        }
    }

    return {
        businessComponents,
        addBusinessComponent,
        removeBusinessComponent
    }
}, {
    persist: true
})
