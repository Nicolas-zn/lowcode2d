<template>
    <div class="stat-card">
        <div class="stat-title">{{ title }}</div>
        <div class="stat-value">{{ formattedValue }}</div>
        <div class="stat-trend" :class="trendClass">
            <span class="trend-icon">{{ trendIcon }}</span>
            <span class="trend-text">{{ actualTrend }}</span>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useApiData } from '../composables/useApiData'

const props = defineProps({
    title: {
        type: String,
        default: 'Transactions Analysed'
    },
    value: {
        type: [Number, String],
        default: 14852
    },
    trend: {
        type: String,
        default: '12.3% vs. last week'
    },
    trendType: {
        type: String,
        default: 'up', // 'up', 'down', 'neutral'
        validator: (value) => ['up', 'down', 'neutral'].includes(value)
    },
    backgroundColor: {
        type: String,
        default: '#ffffff'
    },
    titleColor: {
        type: String,
        default: '#999999'
    },
    valueColor: {
        type: String,
        default: '#000000'
    },
    upColor: {
        type: String,
        default: '#52c41a'
    },
    downColor: {
        type: String,
        default: '#ff4d4f'
    },
    neutralColor: {
        type: String,
        default: '#666666'
    },
    apiConfig: {
        type: Object,
        default: null
    }
})

// 使用 API 数据
const apiConfigRef = computed(() => props.apiConfig)
const { apiData } = useApiData(apiConfigRef)

// 使用 API 数据或默认数据
const actualValue = computed(() => {
    if (apiData.value) {
        return apiData.value.value !== undefined ? apiData.value.value : props.value
    }
    return props.value
})

const actualTrend = computed(() => {
    if (apiData.value && apiData.value.trend !== undefined) {
        return apiData.value.trend
    }
    return props.trend
})

const actualTrendType = computed(() => {
    if (apiData.value && apiData.value.trendType !== undefined) {
        return apiData.value.trendType
    }
    return props.trendType
})

// 格式化数值
const formattedValue = computed(() => {
    if (typeof actualValue.value === 'number') {
        return actualValue.value.toLocaleString()
    }
    return actualValue.value
})

// 趋势类名
const trendClass = computed(() => {
    return `trend-${actualTrendType.value}`
})

// 趋势图标
const trendIcon = computed(() => {
    switch (actualTrendType.value) {
        case 'up':
            return '↑'
        case 'down':
            return '↓'
        default:
            return '→'
    }
})
</script>

<style scoped>
.stat-card {
    width: 100%;
    height: 100%;
    background: v-bind(backgroundColor);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.3s ease;
}

.stat-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.stat-title {
    font-size: 13px;
    color: v-bind(titleColor);
    font-weight: 400;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: v-bind(valueColor);
    line-height: 1.2;
    margin: 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.stat-trend {
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
}

.trend-icon {
    font-size: 14px;
    font-weight: bold;
}

.trend-up {
    color: v-bind(upColor);
}

.trend-down {
    color: v-bind(downColor);
}

.trend-neutral {
    color: v-bind(neutralColor);
}

.trend-text {
    font-weight: 400;
}
</style>
