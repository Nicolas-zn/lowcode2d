export default {
    plugins: {
        'postcss-pxtorem': {
            rootValue: 16, // 1rem = 16px（设计稿基准）
            propList: ['*'], // 转换所有px
            selectorBlackList: [], // 排除的选择器
            replace: true,
            mediaQuery: false,
            minPixelValue: 0, // 最小转换值
            exclude: /node_modules/i // 排除node_modules
        }
    }
}
