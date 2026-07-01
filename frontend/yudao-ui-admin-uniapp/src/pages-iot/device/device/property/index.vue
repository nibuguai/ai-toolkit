<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物模型数据" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 物模型运行态分类 -->
    <wd-tabs v-model="activeTab" line-theme="text" @change="handleTabChange">
      <wd-tab title="属性" :name="0" />
      <wd-tab title="事件" :name="1" />
      <wd-tab title="服务" :name="2" />
    </wd-tabs>

    <!-- 属性 -->
    <template v-if="activeTab === 0">
      <!-- 搜索组件 -->
      <view @click="visible = true">
        <wd-search :placeholder="placeholder" hide-cancel disabled />
      </view>

      <!-- 搜索弹窗 -->
      <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
        <view class="yd-search-form-container">
          <view class="yd-search-form-item">
            <view class="yd-search-form-label">属性关键字</view>
            <wd-input v-model="formData.keyword" placeholder="请输入属性名称或标识符" clearable />
          </view>
          <view class="yd-search-form-actions">
            <wd-button class="flex-1" variant="plain" @click="handleReset">重置</wd-button>
            <wd-button class="flex-1" type="primary" @click="handleSearch">搜索</wd-button>
          </view>
        </view>
      </wd-popup>

      <!-- 属性列表 -->
      <view class="min-h-0 flex-1 overflow-y-auto p-24rpx">
        <wd-loading v-if="loading" />
        <view v-else-if="list.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
          暂无物模型属性数据
        </view>
        <view v-else>
          <view v-for="item in list" :key="item.identifier" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
                {{ item.name || item.identifier }}
              </view>
              <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
                {{ item.dataType || '-' }}
              </view>
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.identifier || '-' }}
            </view>
            <view class="mb-12rpx text-26rpx text-[#666]">
              <text class="mr-8rpx text-[#999]">属性值：</text>{{ formatValueWithUnit(item) }}
            </view>
            <view class="flex items-center justify-between">
              <text class="text-24rpx text-[#999]">{{ formatDateTime(item.updateTime) || '-' }}</text>
              <wd-button size="small" type="primary" variant="plain" @click="handleHistory(item)">
                查看历史
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 事件 -->
    <view v-else-if="activeTab === 1" class="min-h-0 flex-1 overflow-y-auto p-24rpx">
      <wd-loading v-if="messageLoading" />
      <view v-else-if="eventList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无事件上报数据
      </view>
      <view v-else>
        <view v-for="(item, index) in eventList" :key="index" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ getEventName(item.request?.identifier) }}
            </view>
            <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
              {{ getEventType(item.request?.identifier) }}
            </view>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.request?.identifier || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">输入参数：</text>{{ parseParams(item.request?.params) }}
          </view>
          <view class="text-24rpx text-[#999]">{{ formatDateTime(item.request?.reportTime) || '-' }}</view>
        </view>
      </view>
    </view>

    <!-- 服务 -->
    <view v-else class="min-h-0 flex-1 overflow-y-auto p-24rpx">
      <wd-loading v-if="messageLoading" />
      <view v-else-if="serviceList.length === 0" class="py-80rpx text-center text-28rpx text-[#999]">
        暂无服务调用数据
      </view>
      <view v-else>
        <view v-for="(item, index) in serviceList" :key="index" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-32rpx text-[#333] font-semibold">
              {{ getServiceName(item.request?.identifier) }}
            </view>
            <view class="shrink-0 rounded-6rpx bg-[#f0f5ff] px-12rpx py-4rpx text-24rpx text-[#2f54eb]">
              {{ getCallType(item.request?.identifier) }}
            </view>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">标识符：</text>{{ item.request?.identifier || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">输入参数：</text>{{ parseParams(item.request?.params) }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">输出参数：</text>{{ formatReply(item.reply) }}
          </view>
          <view class="mb-8rpx text-24rpx text-[#999]">
            <text class="mr-8rpx">调用时间：</text>{{ formatDateTime(item.request?.reportTime) || '-' }}
          </view>
          <view class="text-24rpx text-[#999]">
            <text class="mr-8rpx">响应时间：</text>{{ formatDateTime(item.reply?.reportTime) || '-' }}
          </view>
        </view>
      </view>
    </view>

    <!-- 历史数据弹窗 -->
    <wd-popup v-model="historyVisible" position="bottom" custom-style="border-radius: 24rpx 24rpx 0 0;">
      <view class="max-h-[70vh] p-24rpx">
        <view class="mb-24rpx text-center text-32rpx text-[#333] font-semibold">
          {{ currentProperty?.name || currentProperty?.identifier || '属性历史' }}
        </view>
        <view v-if="historyLoading" class="py-60rpx text-center">
          <wd-loading />
        </view>
        <view v-else-if="historyList.length === 0" class="py-60rpx text-center text-28rpx text-[#999]">
          最近 7 天暂无历史数据
        </view>
        <scroll-view v-else scroll-y class="max-h-[48vh]">
          <view v-for="item in historyList" :key="String(item.updateTime) + String(item.value)" class="mb-16rpx rounded-8rpx bg-[#f7f8fa] p-16rpx">
            <view class="break-all text-28rpx text-[#333]">{{ formatHistoryValue(item.value) }}</view>
            <view class="mt-8rpx text-24rpx text-[#999]">{{ formatDateTime(item.updateTime) || '-' }}</view>
          </view>
        </scroll-view>
        <wd-button class="mt-24rpx" block @click="historyVisible = false">关闭</wd-button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { IotDevicePropertyDetailRespVO } from '@/api/iot/device/device'
import type { ThingModelData } from '@/api/iot/thingmodel'
import { computed, onMounted, reactive, ref } from 'vue'
import { getDevice, getDeviceMessagePairPage, getHistoryDevicePropertyList, getLatestDeviceProperties } from '@/api/iot/device/device'
import { getThingModelList } from '@/api/iot/thingmodel'
import { getIotOptionLabel, IoTThingModelEventTypeEnum, IoTThingModelServiceCallTypeEnum, IoTThingModelTypeEnum, IotDeviceMessageMethodEnum } from '@/pages-iot/utils/constants'
import { navigateBackPlus, getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ deviceId?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const activeTab = ref(0) // 当前 tab：0 属性 / 1 事件 / 2 服务
const loading = ref(false) // 属性列表加载状态
const allList = ref<IotDevicePropertyDetailRespVO[]>([]) // 完整属性列表
const list = ref<IotDevicePropertyDetailRespVO[]>([]) // 展示属性列表
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({ keyword: '' }) // 搜索表单数据
const historyVisible = ref(false) // 历史弹窗显示状态
const historyLoading = ref(false) // 历史加载状态
const historyList = ref<any[]>([]) // 历史数据
const currentProperty = ref<IotDevicePropertyDetailRespVO>() // 当前属性
const placeholder = computed(() => formData.keyword ? `关键字:${formData.keyword}` : '搜索物模型属性')

const thingModelList = ref<ThingModelData[]>([]) // 物模型列表（用于反查事件/服务名称与类型）
const messageLoading = ref(false) // 事件/服务列表加载状态
const eventList = ref<any[]>([]) // 事件上报列表
const serviceList = ref<any[]>([]) // 服务调用列表
const eventLoaded = ref(false) // 事件是否已加载
const serviceLoaded = ref(false) // 服务是否已加载

/** 事件类型的物模型数据 */
const eventThingModels = computed(() => {
  return thingModelList.value.filter(item => item.type === IoTThingModelTypeEnum.EVENT)
})

/** 服务类型的物模型数据 */
const serviceThingModels = computed(() => {
  return thingModelList.value.filter(item => item.type === IoTThingModelTypeEnum.SERVICE)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 查询最新属性 */
async function getList() {
  if (!props.deviceId) {
    allList.value = []
    list.value = []
    return
  }
  loading.value = true
  try {
    allList.value = await getLatestDeviceProperties({ deviceId: Number(props.deviceId) })
    handleFilter()
  } finally {
    loading.value = false
  }
}

/** 前端筛选属性 */
function handleFilter() {
  const keyword = formData.keyword.trim().toLowerCase()
  if (!keyword) {
    list.value = allList.value
    return
  }
  list.value = allList.value.filter((item) => {
    return item.identifier?.toLowerCase().includes(keyword) || item.name?.toLowerCase().includes(keyword)
  })
}

/** 格式化属性值 */
function formatValueWithUnit(item: IotDevicePropertyDetailRespVO) {
  if (item.value === undefined || item.value === null || item.value === '') {
    return '-'
  }
  const value = typeof item.value === 'object' ? JSON.stringify(item.value) : String(item.value)
  const unitName = item.dataSpecs?.unitName
  return unitName ? `${value} ${unitName}` : value
}

/** 格式化历史值 */
function formatHistoryValue(value: any) {
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

/** 最近 7 天时间范围 */
function getDefaultTimes() {
  const end = new Date()
  const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  return [formatDateTime(start), formatDateTime(end)]
}

/** 查看历史数据 */
async function handleHistory(item: IotDevicePropertyDetailRespVO) {
  if (!props.deviceId || !item.identifier) {
    return
  }
  currentProperty.value = item
  historyVisible.value = true
  historyLoading.value = true
  try {
    historyList.value = await getHistoryDevicePropertyList({
      deviceId: Number(props.deviceId),
      identifier: item.identifier,
      times: getDefaultTimes(),
    })
  } finally {
    historyLoading.value = false
  }
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  handleFilter()
}

/** 重置按钮操作 */
function handleReset() {
  formData.keyword = ''
  visible.value = false
  handleFilter()
}

/** 加载物模型列表（先取设备 productId 再查物模型，用于反查名称/类型） */
async function loadThingModelList() {
  if (!props.deviceId || thingModelList.value.length > 0) {
    return
  }
  const device = await getDevice(Number(props.deviceId))
  if (!device?.productId) {
    return
  }
  thingModelList.value = await getThingModelList({ productId: device.productId })
}

/** 查询事件上报列表 */
async function getEventList() {
  if (!props.deviceId) {
    return
  }
  messageLoading.value = true
  try {
    await loadThingModelList()
    // 移动端简化为最近 50 条，无需分页/无限滚动
    const data = await getDeviceMessagePairPage({
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.EVENT_POST.method,
      pageNo: 1,
      pageSize: 50,
    } as any)
    eventList.value = data.list || []
    eventLoaded.value = true
  } finally {
    messageLoading.value = false
  }
}

/** 查询服务调用列表 */
async function getServiceList() {
  if (!props.deviceId) {
    return
  }
  messageLoading.value = true
  try {
    await loadThingModelList()
    // 移动端简化为最近 50 条，无需分页/无限滚动
    const data = await getDeviceMessagePairPage({
      deviceId: Number(props.deviceId),
      method: IotDeviceMessageMethodEnum.SERVICE_INVOKE.method,
      pageNo: 1,
      pageSize: 50,
    } as any)
    serviceList.value = data.list || []
    serviceLoaded.value = true
  } finally {
    messageLoading.value = false
  }
}

/** 切换 tab：首次进入对应 tab 时再加载数据 */
function handleTabChange() {
  if (activeTab.value === 1 && !eventLoaded.value) {
    getEventList()
  } else if (activeTab.value === 2 && !serviceLoaded.value) {
    getServiceList()
  }
}

/** 获取事件名称 */
function getEventName(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  return eventThingModels.value.find(item => item.identifier === identifier)?.name || identifier
}

/** 获取事件类型 */
function getEventType(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  const event = eventThingModels.value.find(item => item.identifier === identifier)
  const type = event?.event?.type
  if (!type) {
    return '-'
  }
  // 映射类型 label，找不到则显示原始值
  return getIotOptionLabel(Object.values(IoTThingModelEventTypeEnum), type) || type
}

/** 获取服务名称 */
function getServiceName(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  return serviceThingModels.value.find(item => item.identifier === identifier)?.name || identifier
}

/** 获取服务调用方式 */
function getCallType(identifier?: string) {
  if (!identifier) {
    return '-'
  }
  const service = serviceThingModels.value.find(item => item.identifier === identifier)
  const callType = service?.service?.callType
  if (!callType) {
    return '-'
  }
  // 映射调用方式 label，找不到则显示原始值
  return getIotOptionLabel(Object.values(IoTThingModelServiceCallTypeEnum), callType) || callType
}

/** 解析输入参数：JSON.parse 后取 .params */
function parseParams(params?: string) {
  if (!params) {
    return '-'
  }
  try {
    const parsed = JSON.parse(params)
    const result = parsed.params ?? parsed
    return typeof result === 'object' ? JSON.stringify(result) : String(result)
  } catch {
    return params
  }
}

/** 格式化服务输出参数（reply：code/msg/data） */
function formatReply(reply?: { code?: number, msg?: string, data?: any }) {
  if (!reply) {
    return '-'
  }
  const data = typeof reply.data === 'object' ? JSON.stringify(reply.data) : reply.data
  return `{"code":${reply.code},"msg":"${reply.msg ?? ''}","data":${data}}`
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
