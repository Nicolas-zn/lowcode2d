<template>
    <div class="title-brick">
        <h2>{{ text }}</h2>
    </div>
</template>

<script setup>
const props = defineProps({
    text: {
        type: String,
        default: '标题文字'
    },
    fontSize: {
        type: Number,
        default: 24
    },
    textAlign: {
        type: String,
        default: 'center'
    }
})
</script>

<style scoped>
.title-brick {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: v-bind('props.textAlign === "left" ? "flex-start" : props.textAlign === "right" ? "flex-end" : "center"');
    background: transparent;
    padding: 0 20px;
}

.title-brick h2 {
    margin: 0;
    font-size: v-bind('props.fontSize + "px"');
    font-weight: bold;
    color: #000000;
    text-align: v-bind('props.textAlign');
}
</style>
