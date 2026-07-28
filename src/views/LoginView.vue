<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElNotification, ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/authStore'

const formRef = ref()
const form = ref({
  email: '',
  password: '',
  displayName: '',
})
const mode = ref('login')

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const rules = {
  displayName: [{ required: false, message: '请输入名称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: ['blur', 'change'] },
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const isRegisterMode = computed(() => mode.value === 'register')
const submitText = computed(() => isRegisterMode.value ? '创建账号并进入工作区' : '登录')

async function onSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const payload = {
        email: form.value.email,
        password: form.value.password,
      }
      if (isRegisterMode.value && form.value.displayName) {
        payload.displayName = form.value.displayName
      }
      const action = isRegisterMode.value ? auth.authRegister : auth.authLogin
      const { userInfo } = await action(payload, async () => {
        const redirect = route.query.redirect ? decodeURIComponent(route.query.redirect) : '/workspace'
        await router.replace(redirect)
      })
      ElNotification({
        title: isRegisterMode.value ? '账号创建成功' : '登录成功',
        message: `欢迎，${userInfo?.realName || userInfo?.email || ''}`,
        type: 'success',
      })
    } catch (e) {
      console.error(e)
      ElMessage.error(e?.message || '操作失败，请检查邮箱或密码')
    }
  })
}

function toggleMode() {
  mode.value = isRegisterMode.value ? 'login' : 'register'
}
</script>

<template>
  <div class="login-page">
    <section class="login-brand">
      <div class="brand-mark">2D</div>
      <div>
        <p class="brand-kicker">Enterprise Low-Code Workspace</p>
        <h1>可视化大屏低代码平台</h1>
        <p class="brand-desc">统一管理组件、数据源、交互规则和发布模板，面向企业数字化项目的生产级搭建工作台。</p>
      </div>

      <div class="brand-metrics">
        <div>
          <strong>可视化搭建</strong>
          <span>拖拽组件、模板布局、图层管理</span>
        </div>
        <div>
          <strong>数据驱动</strong>
          <span>请求器、接口数据源、转换调试</span>
        </div>
        <div>
          <strong>企业交付</strong>
          <span>预览发布、模板复用、权限扩展</span>
        </div>
      </div>
    </section>

    <section class="login-card">
      <div class="login-header">
        <div>
          <h2 class="login-title">{{ isRegisterMode ? '创建工作台账号' : '登录工作台' }}</h2>
          <p class="login-subtitle">{{ isRegisterMode ? '创建账号后会自动生成默认工作区' : '使用企业账号继续编辑和发布可视化项目' }}</p>
        </div>
        <el-tag effect="plain" type="primary">v2 SaaS</el-tag>
      </div>

      <ElForm ref="formRef" :model="form" :rules="rules" label-width="0" class="login-form" @submit.prevent="onSubmit">
        <ElFormItem v-if="isRegisterMode" prop="displayName">
          <ElInput v-model="form.displayName" autocomplete="name" placeholder="显示名称" size="large">
            <template #prefix>
              <ElIcon>
                <User />
              </ElIcon>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="email">
          <ElInput v-model="form.email" autocomplete="email" placeholder="邮箱" size="large">
            <template #prefix>
              <ElIcon>
                <Message />
              </ElIcon>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem prop="password">
          <ElInput v-model="form.password" type="password" autocomplete="current-password" placeholder="密码"
            show-password size="large">
            <template #prefix>
              <ElIcon>
                <Lock />
              </ElIcon>
            </template>
          </ElInput>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :loading="auth.loginLoading" class="login-btn" size="large" @click="onSubmit">
            {{ submitText }}
          </ElButton>
        </ElFormItem>
      </ElForm>

      <button class="mode-switch" type="button" @click="toggleMode">
        {{ isRegisterMode ? '已有账号，返回登录' : '还没有账号，创建一个工作区' }}
      </button>

      <div class="login-support">
        <span>环境：NestJS Auth</span>
        <span>版本：v2 SaaS Baseline</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  align-items: center;
  gap: 72px;
  padding: clamp(32px, 6vw, 84px);
  background:
    linear-gradient(90deg, rgba(37, 99, 235, 0.08), transparent 42%),
    var(--lc-bg-page);
  color: var(--lc-text-primary);
}

.login-brand {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand-mark {
  width: 56px;
  height: 56px;
  border-radius: var(--lc-radius-xl);
  background: var(--lc-brand-500);
  color: var(--lc-text-inverse);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 800;
  box-shadow: 0 16px 36px rgba(37, 99, 235, 0.22);
}

.brand-kicker {
  margin: 0 0 10px;
  color: var(--lc-brand-600);
  font-size: var(--lc-font-size-caption);
  font-weight: 700;
  line-height: var(--lc-line-height-caption);
  text-transform: uppercase;
}

.login-brand h1 {
  max-width: 620px;
  margin: 0;
  color: var(--lc-text-primary);
  font-size: 40px;
  line-height: 1.18;
  font-weight: 700;
}

.brand-desc {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--lc-text-secondary);
  font-size: 16px;
  line-height: 28px;
}

.brand-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--lc-space-3);
}

.brand-metrics div {
  min-width: 0;
  padding: var(--lc-space-4);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: color-mix(in srgb, var(--lc-bg-panel) 86%, transparent);
}

.brand-metrics strong,
.brand-metrics span {
  display: block;
}

.brand-metrics strong {
  color: var(--lc-text-primary);
  font-size: var(--lc-font-size-body);
  line-height: var(--lc-line-height-body);
}

.brand-metrics span {
  margin-top: var(--lc-space-1);
  color: var(--lc-text-secondary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

.login-card {
  width: 100%;
  padding: 32px;
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-xl);
  background: var(--lc-bg-panel);
  box-shadow: var(--lc-shadow-lg);
}

.login-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--lc-space-3);
  margin-bottom: 32px;
}

.login-title {
  margin: 0 0 4px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  color: var(--lc-text-primary);
}

.login-subtitle {
  margin: 0;
  font-size: var(--lc-font-size-body);
  color: var(--lc-text-secondary);
  line-height: var(--lc-line-height-body);
}

.login-form {
  margin-top: 4px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  background: var(--lc-bg-panel);
  border: 1px solid var(--lc-border-subtle);
  border-radius: var(--lc-radius-lg);
  box-shadow: none;
  transition: border-color 0.2s, background 0.2s;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: var(--lc-border-strong);
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: var(--lc-brand-500);
  box-shadow: 0 0 0 3px var(--lc-focus-ring);
}

.login-form :deep(.el-input__inner) {
  color: var(--lc-text-primary);
}

.login-form :deep(.el-input__inner::placeholder) {
  color: var(--lc-text-tertiary);
}

.login-form :deep(.el-input__prefix) {
  color: var(--lc-text-tertiary);
  margin-right: 4px;
}

.login-btn {
  width: 100%;
  height: 44px;
  border-radius: var(--lc-radius-lg);
  font-size: 15px;
  font-weight: 600;
  background: var(--lc-brand-500);
  border: none;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.22);
  transition: opacity 0.2s, transform 0.15s;
}

.login-btn:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

.mode-switch {
  width: 100%;
  height: 34px;
  border: 0;
  background: transparent;
  color: var(--lc-brand-600);
  font-size: var(--lc-font-size-caption);
  cursor: pointer;
}

.mode-switch:hover {
  text-decoration: underline;
}

.login-support {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--lc-space-3);
  margin: 24px 0 0;
  padding-top: 18px;
  border-top: 1px solid var(--lc-border-subtle);
  color: var(--lc-text-tertiary);
  font-size: var(--lc-font-size-caption);
  line-height: var(--lc-line-height-caption);
}

@media (max-width: 980px) {
  .login-page {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .login-brand h1 {
    font-size: 32px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 24px;
  }

  .brand-metrics {
    grid-template-columns: 1fr;
  }

  .login-card {
    padding: 24px;
  }

  .login-support {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
