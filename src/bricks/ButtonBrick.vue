<template>
  <div class="button-brick" ref="containerRef">
    <el-button 
      :type="actualProps.buttonType" 
      :size="actualProps.size" 
      :plain="actualProps.plain" 
      :round="actualProps.round"
      :circle="actualProps.circle"
      :color="actualProps.customColor ? actualProps.customColor : undefined"
      style="width: 100%; height: 100%; font-size: inherit;"
    >
      {{ actualProps.text }}
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useComponentEvents } from '../composables/useComponentEvents'

const props = defineProps({
  events: {
    type: Array,
    default: () => []
  },
  text: {
    type: String,
    default: '点击按钮'
  },
  buttonType: {
    type: String,
    default: 'primary' // primary, success, warning, danger, info, text
  },
  size: {
    type: String,
    default: 'default' // large, default, small
  },
  plain: {
    type: Boolean,
    default: false
  },
  round: {
    type: Boolean,
    default: false
  },
  circle: {
    type: Boolean,
    default: false
  },
  customColor: {
    type: String,
    default: ''
  }
})

// 默认直接使用解构出来的 props
const actualProps = computed(() => props)

// 设置该节点的DOM引用以供注册事件
const containerRef = ref(null)

// 注册组件的各种交互事件。因为外部通过 :events 传入而不是 :component，所以此处将 props 本体作为实体对象传入
const { handleEvent } = useComponentEvents(props, containerRef)
</script>

<style scoped>
.button-brick {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 按钮的字体大小可以通过外层控制继承 */
.button-brick :deep(.el-button) {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
