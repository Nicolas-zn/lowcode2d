<template>
    <div class="header-brick">
        <div class="header-content">
            <h1 class="header-title">{{ title }}</h1>
            <p class="header-subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>
    </div>
</template>

<script setup>
const props = defineProps({
    title: {
        type: String,
        default: '数据大屏标题'
    },
    subtitle: {
        type: String,
        default: ''
    },
    backgroundColor: {
        type: String,
        default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    textColor: {
        type: String,
        default: '#ffffff'
    }
})
</script>

<style scoped>
.header-brick {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: v-bind(backgroundColor);
    padding: 20px 40px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header-content {
    text-align: center;
    width: 100%;
}

.header-title {
    margin: 0;
    font-size: 42px;
    font-weight: 700;
    color: v-bind(textColor);
    letter-spacing: 2px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    line-height: 1.2;
}

.header-subtitle {
    margin: 12px 0 0 0;
    font-size: 18px;
    font-weight: 400;
    color: v-bind(textColor);
    opacity: 0.9;
    letter-spacing: 1px;
}
</style>
