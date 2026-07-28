import { createRouter, createWebHashHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import HashView from '../views/HashView.vue'
import PreviewView from '../views/PreviewView.vue'
import { useEventBusStore } from '../stores/eventBusStore'
import { useVariableStore } from '../stores/variableStore'
import { useAuthStore } from '../stores/authStore'

const LOGIN_PATH = '/login'

const routes = [
    {
        path: '/',
        redirect: '/workspace'
    },
    {
        path: '/workspace',
        name: 'workspace',
        component: () => import('../views/WorkspaceView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/editor/:projectId?',
        name: 'editor',
        component: EditorView,
        meta: { requiresAuth: true }
    },
    {
        path: LOGIN_PATH,
        name: 'login',
        component: () => import('../views/LoginView.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/preview',
        name: 'preview',
        component: PreviewView,
        meta: { requiresAuth: true }
    },
    {
        path: '/hash/:hashValue',
        name: 'hash',
        component: HashView,
        props: true,
        meta: { requiresAuth: false }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const session = authStore.hasCachedSession() ? await authStore.loadSession() : null

    if (to.meta.requiresAuth && !session) {
        next({ path: LOGIN_PATH, query: { redirect: encodeURIComponent(to.fullPath) } })
        return
    }

    if (to.path === LOGIN_PATH && session) {
        next('/workspace')
        return
    }

    if (from.name) {
        const eventBus = useEventBusStore()
        eventBus.clear()
    }

    next()
})

export default router
