<template>
    <el-dialog v-model="dialogVisible" title="接口配置" width="500px" :close-on-click-modal="false">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
            <el-form-item label="协议类型" prop="protocol">
                <el-radio-group v-model="form.protocol">
                    <el-radio label="HTTP">HTTP</el-radio>
                    <el-radio label="WS">WebSocket</el-radio>
                </el-radio-group>
            </el-form-item>
            <!-- <el-form-item label="请求地址" prop="url">
                <el-input v-model="form.url" placeholder="请输入接口地址" clearable />
            </el-form-item> -->
            <el-form-item label="请求后缀" prop="suffix">
                <el-input v-model="form.suffix" placeholder="请输入接口后缀" clearable />
            </el-form-item>
            <el-form-item label="请求方法" prop="method" v-if="form.protocol === 'HTTP'">
                <el-select v-model="form.method" placeholder="请选择请求方法" style="width: 100%">
                    <el-option label="GET" value="GET" />
                    <el-option label="POST" value="POST" />
                    <el-option label="PUT" value="PUT" />
                    <el-option label="DELETE" value="DELETE" />
                    <el-option label="PATCH" value="PATCH" />
                </el-select>
            </el-form-item>

            <el-form-item label="Token">
                <el-input v-model="form.token" type="textarea" :rows="3" placeholder="选填，用于身份验证" clearable />
            </el-form-item>
            <el-form-item label="请求频率" prop="interval" v-if="form.protocol === 'HTTP'">
                <el-input-number v-model="form.interval" :min="0" :step="1" placeholder="留空或0表示不自动请求，最低5s" style="width: 100%" />
            </el-form-item>
        </el-form>

        <template #footer>
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleConfirm">确定</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    apiConfig: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

// 使用 computed 来避免循环更新
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)

const form = ref({
    protocol: 'HTTP',
    url: 'http://localhost:3001',
    suffix: '',
    method: 'GET',
    token: 'v9DHm1hduG3wFAZ9I3KL0epz53QUitAu',
    interval: 0
})

const rules = {
    // url: [
    //     { required: true, message: '请输入请求地址', trigger: 'blur' },
    //     {
    //         pattern: /^https?:\/\/.+/,
    //         message: '请输入有效的 URL 地址（以 http:// 或 https:// 开头）',
    //         trigger: 'blur'
    //     }
    // ],
    suffix: [
        { required: true, message: '请输入请求后缀', trigger: 'blur' }
    ],
    method: [
        { required: true, message: '请选择请求方法', trigger: 'change' }
    ],
    interval: [
        { 
            validator: (rule, value, callback) => {
                if (value > 0 && value < 5) {
                    callback(new Error('请求频率最低为 5 秒'))
                } else {
                    callback()
                }
            }, 
            trigger: 'blur' 
        }
    ]
}

// 监听 modelValue 变化，回填数据
watch(() => props.modelValue, (val) => {
    if (val) {
        // 如果有已有配置，回填数据
        if (props.apiConfig) {
            form.value = {
                protocol: props.apiConfig.protocol || 'HTTP',
                url: props.apiConfig.url || 'http://localhost:3001',
                suffix: props.apiConfig.suffix || '',
                method: props.apiConfig.method || 'GET',
                token: props.apiConfig.token || 'v9DHm1hduG3wFAZ9I3KL0epz53QUitAu',
                interval: props.apiConfig.interval || 0
            }
        } else {
            // 重置表单（使用默认值）
            form.value = {
                protocol: 'HTTP',
                url: 'http://localhost:3001',
                suffix: '',
                method: 'GET',
                token: 'v9DHm1hduG3wFAZ9I3KL0epz53QUitAu',
                interval: 0
            }
        }
        // 清除验证状态
        nextTick(() => {
            formRef.value?.clearValidate()
        })
    }
})

// 确认提交
const handleConfirm = async () => {
    try {
        await formRef.value.validate()
        emit('confirm', { ...form.value })
        dialogVisible.value = false
        ElMessage.success('接口配置成功')
    } catch (error) {
        ElMessage.warning('请完善必填项')
    }
}
</script>

<style scoped>
:deep(.el-form-item__label) {
    font-weight: 500;
}
</style>
