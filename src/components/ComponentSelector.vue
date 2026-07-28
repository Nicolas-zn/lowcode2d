<template>
    <el-dialog v-model="dialogVisible" title="选择组件或模板" width="1000px" :close-on-click-modal="false">
        <el-tabs v-model="activeTab" class="selector-tabs">

            <!-- 业务组件选项卡 -->
            <el-tab-pane label="业务组件" name="business">
                <div class="business-selector">
                    <!-- 按分类分组显示 -->
                    <el-collapse v-model="activeCategories" class="category-collapse">
                        <el-collapse-item v-for="(components, category) in groupedBusinessComponents" :key="category"
                            :name="category">
                            <template #title>
                                <div class="category-header">
                                    <el-icon>
                                        <FolderOpened />
                                    </el-icon>
                                    <span>{{ category }}</span>
                                    <el-tag size="small" type="info">{{ components.length }}</el-tag>
                                </div>
                            </template>

                            <el-row :gutter="16">
                                <el-col v-for="businessComp in components" :key="businessComp.name" :span="6">
                                    <el-card class="brick-card business-card" shadow="hover">
                                        <div class="brick-content" @click="selectBusinessComponent(businessComp)">
                                            <i :class="['brick-icon', businessComp.icon]"></i>
                                            <div class="brick-name">{{ businessComp.name }}</div>
                                        </div>
                                        <div class="business-actions">
                                            <el-button :icon="Delete" type="danger" size="small" circle
                                                @click.stop="deleteBusinessComponent(businessComp.id)" title="删除业务组件" />
                                        </div>
                                    </el-card>
                                </el-col>
                            </el-row>
                        </el-collapse-item>
                    </el-collapse>
                </div>
            </el-tab-pane>

            <!-- 模板选项卡 -->
            <el-tab-pane label="模板" name="template">
                <div class="template-selector">
                    <el-row :gutter="16">
                        <el-col v-for="template in templateList" :key="template.id" :span="12">
                            <el-card class="template-card" shadow="hover" @click="selectTemplate(template)">
                                <div class="template-content">
                                    <div class="template-icon">{{ template.thumbnail }}</div>
                                    <div class="template-info">
                                        <div class="template-name">{{ template.name }}</div>
                                        <div class="template-desc">{{ template.description }}</div>
                                        <div class="template-count">
                                            <el-icon>
                                                <Document />
                                            </el-icon>
                                            {{ template.components.length }} 个组件
                                        </div>
                                    </div>
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>
            </el-tab-pane>
            <!-- 组件选项卡 -->
            <el-tab-pane label="根组件" name="component">
                <div class="component-selector">
                    <el-row :gutter="16">
                        <el-col v-for="brick in brickLibrary" :key="brick.type" :span="6">
                            <el-card class="brick-card" shadow="hover" @click="selectBrick(brick)">
                                <div class="brick-content">
                                    <i :class="['brick-icon', brick.icon]"></i>
                                    <div class="brick-name">{{ brick.name }}</div>
                                    <!-- <div class="brick-desc">{{ brick.defaultWidth }}×{{ brick.defaultHeight }}</div> -->
                                </div>
                            </el-card>
                        </el-col>
                    </el-row>
                </div>
            </el-tab-pane>


        </el-tabs>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { brickLibrary } from '../bricks'
import { templateList } from '../templates'
import { usePanelStore } from '../stores/panelStore'
import { useBusinessComponentStore } from '../stores/businessComponentStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Delete, Box, FolderOpened } from '@element-plus/icons-vue'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const panelStore = usePanelStore()
const businessComponentStore = useBusinessComponentStore()

// 使用 computed 来避免循环更新
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const activeTab = ref('business')

// 业务组件列表
import { assetsBusinessComponents } from '../business'
console.log(assetsBusinessComponents);
const businessComponents = computed(() =>
    [...assetsBusinessComponents])
console.log(businessComponents.value);

// 分类展开状态 - 默认展开所有分类
const activeCategories = ref([])

// 按category分组业务组件
const groupedBusinessComponents = computed(() => {
    const groups = {}
    businessComponents.value.forEach(comp => {
        const category = comp.category || '未分类'
        if (!groups[category]) {
            groups[category] = []
        }
        groups[category].push(comp)
    })

    return groups
})

// 初始化展开状态
onMounted(() => {
    const groups = groupedBusinessComponents.value
    if (Object.keys(groups).length > 0) {
        activeCategories.value = Object.keys(groups)
    }
})

// 监听 modelValue 变化
watch(() => props.modelValue, (val) => {
    if (val) {
        activeTab.value = 'business'
    }
})

// 选择单个组件
const selectBrick = (brick) => {
    const randomX = Math.floor(Math.random() * 300)
    const randomY = Math.floor(Math.random() * 300)

    panelStore.addComponent({
        name: brick.name,
        type: brick.type,
        x: randomX,
        y: randomY,
        width: brick.defaultWidth,
        height: brick.defaultHeight,
        props: { ...brick.defaultProps }
    })

    ElMessage({
        message: `已添加 ${brick.name}`,
        type: 'success',
        duration: 1500
    })

    dialogVisible.value = false
}

// 选择业务组件
const selectBusinessComponent = (businessComp) => {
    const randomX = Math.floor(Math.random() * 300)
    const randomY = Math.floor(Math.random() * 300)

    panelStore.addComponent({
        name: businessComp.name,
        type: businessComp.componentData.type,
        x: randomX,
        y: randomY,
        width: businessComp.componentData.width,
        height: businessComp.componentData.height,
        // props: JSON.parse(JSON.stringify(businessComp.componentData.props)), // 深拷贝
        api: businessComp.componentData.api ? JSON.parse(JSON.stringify(businessComp.componentData.api)) : null,
        isBusinessComponent: true // 标记为业务组件
    })

    ElMessage({
        message: `已添加业务组件 ${businessComp.name}`,
        type: 'success',
        duration: 1500
    })

    dialogVisible.value = false
}

// 删除业务组件
const deleteBusinessComponent = async (id) => {
    try {
        await ElMessageBox.confirm(
            '确认删除该业务组件？',
            '警告',
            {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )

        businessComponentStore.removeBusinessComponent(id)

        ElMessage({
            message: '业务组件已删除',
            type: 'success',
            duration: 1500
        })
    } catch {
        // 用户取消删除
    }
}

// 选择模板
const selectTemplate = async (template) => {
    try {
        // 如果画布不为空，询问是否清空
        if (panelStore.components.length > 0) {
            await ElMessageBox.confirm(
                '加载模板会清空当前画布，是否继续？',
                '提示',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning',
                }
            )
            // 清空现有组件
            panelStore.clearComponents()
        }

        // 加载模板中的所有组件，为每个组件重新生成 ID 避免冲突
        template.components.forEach(comp => {
            panelStore.addComponent({
                ...comp,
                id: undefined // 让 store 重新生成 ID
            })
        })

        ElMessage({
            message: `已加载模板"${template.name}"，共 ${template.components.length} 个组件`,
            type: 'success',
            duration: 2000
        })

        dialogVisible.value = false
    } catch (error) {
        // 用户取消操作
        if (error === 'cancel') {
            return
        }
        console.error('加载模板失败:', error)
    }
}
</script>

<style scoped>
.selector-tabs {
    min-height: 400px;
}

.component-selector,
.template-selector {
    padding: 10px 0;
}

.brick-card {
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    height: 160px;
}

.brick-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.brick-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 8px;
}

.brick-icon {
    font-size: 48px;
    margin-bottom: 8px;
}

.brick-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    text-align: center;
}

.brick-desc {
    font-size: 12px;
    color: var(--color-text-tertiary);
    text-align: center;
}

/* 模板卡片样式 */
.template-card {
    cursor: pointer;
    margin-bottom: 16px;
    transition: all 0.3s ease;
    height: 140px;
}

.template-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}

.template-content {
    display: flex;
    align-items: center;
    gap: 16px;
    height: 100%;
}

.template-icon {
    font-size: 60px;
    flex-shrink: 0;
}

.template-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.template-name {
    font-size: 18px;
    font-weight: 600;
    color: #333;
}

.template-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.4;
}

.template-count {
    font-size: 12px;
    color: #999;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
}

:deep(.el-card__body) {
    padding: 20px;
    height: 100%;
}


/* 业务组件样式 */
.business-selector {
    padding: 10px 0;
}

.business-card {
    position: relative;
}

.business-actions {
    position: absolute;
    top: 8px;
    right: 8px;
    display: none;
    z-index: 10;
}

.business-card:hover .business-actions {
    display: block;
}

/* 分类折叠面板样式 */
.category-collapse {
    border: none;
}

:deep(.category-collapse .el-collapse-item__header) {
    background: var(--color-bg-tertiary);
    padding: 12px 16px;
    font-weight: 600;
    border-radius: 8px;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

:deep(.category-collapse .el-collapse-item__header:hover) {
    background: var(--color-bg-secondary);
}

.category-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    font-size: 14px;
}

.category-header .el-tag {
    margin-left: auto;
}

:deep(.category-collapse .el-collapse-item__wrap) {
    border: none;
}

:deep(.category-collapse .el-collapse-item__content) {
    padding: 0 0 16px 0;
}
</style>
