<template>
  <view class="yd-chart" :style="containerStyle">
    <!-- 图表画布 -->
    <LEchart v-show="!loading && !empty" ref="chartRef" />

    <!-- 加载状态 -->
    <view v-if="loading" class="yd-chart__state">
      <text class="text-26rpx text-[#999]">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="empty" class="yd-chart__state">
      <text class="text-26rpx text-[#999]">暂无统计数据</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import LEchart from '../lime-echart/l-echart.vue'

// #ifdef MP-WEIXIN
import mpEcharts from '../lime-echart/echarts'
// #endif

// #ifndef MP-WEIXIN
import * as echarts from 'echarts/core'
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
} from 'echarts/charts'
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
// #endif

const props = withDefaults(defineProps<{
  option?: Record<string, any> // ECharts 配置
  height?: string | number // 图表高度
  loading?: boolean // 加载状态
  empty?: boolean // 空状态
  notMerge?: boolean // 是否替换旧配置
}>(), {
  option: () => ({}),
  height: '420rpx',
  loading: false,
  empty: false,
  notMerge: true,
})

const emit = defineEmits<{
  ready: [chart: any]
  click: [params: any]
}>()

// #ifndef MP-WEIXIN
echarts.use([
  BarChart,
  FunnelChart,
  GaugeChart,
  LineChart,
  PieChart,
  CanvasRenderer,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
])
// #endif

const chartRef = ref<any>() // lime-echart 组件引用
let chartInstance: any // ECharts 实例
let renderTimer: ReturnType<typeof setTimeout> | undefined // 延迟渲染定时器

const containerStyle = computed(() => { // 容器尺寸
  const height = typeof props.height === 'number' ? `${props.height}rpx` : props.height
  return { height }
})

/** 初始化图表 */
async function initChart() {
  if (props.loading || props.empty || !props.option) {
    return
  }
  await nextTick()
  if (!chartRef.value) {
    return
  }
  if (!chartInstance) {
    // #ifdef MP-WEIXIN
    chartInstance = await chartRef.value.init(mpEcharts)
    // #endif

    // #ifndef MP-WEIXIN
    chartInstance = await chartRef.value.init(echarts)
    // #endif

    chartInstance?.on?.('click', (params: any) => emit('click', params))
    emit('ready', chartInstance)
  }
  chartInstance?.setOption?.(props.option, props.notMerge)
  // 容器可能在隐藏（loading / tab 切换）时完成初始化导致画布 0×0，渲染后再量一次尺寸兜底
  chartRef.value?.resize?.()
}

/** 延迟渲染图表，等待容器尺寸稳定 */
function scheduleRender() {
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  renderTimer = setTimeout(() => {
    initChart()
  }, 80)
}

/** 刷新图表尺寸 */
function resize() {
  chartRef.value?.resize?.()
}

/** 设置图表配置 */
function setOption(option: Record<string, any>) {
  chartInstance?.setOption?.(option, props.notMerge)
}

watch(
  () => [props.option, props.loading, props.empty],
  () => scheduleRender(),
  { deep: true },
)

onMounted(() => {
  scheduleRender()
})

onBeforeUnmount(() => {
  if (renderTimer) {
    clearTimeout(renderTimer)
  }
  chartInstance?.dispose?.()
  chartInstance = undefined
})

defineExpose({
  resize,
  setOption,
  getChart: () => chartInstance,
})
</script>

<style lang="scss" scoped>
.yd-chart {
  position: relative;
  width: 100%;
}

.yd-chart__state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
