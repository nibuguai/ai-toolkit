<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="设备消息" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <view @click="visible = true">
      <wd-search :placeholder="placeholder" hide-cancel disabled />
    </view>

    <!-- 搜索弹窗 -->
    <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
      <view class="yd-search-form-container">
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">消息方法</view>
          <wd-picker v-model="formData.method" :columns="methodOptions" value-key="value" label-key="label" placeholder="请选择消息方法" clearable />
        </view>
        <view class="yd-search-form-item">
          <view class="yd-search-form-label">消息方向</view>
          <wd-radio-group v-model="formData.upstream" type="button">
            <wd-radio value="all">全部</wd-radio>
            <wd-radio :value="true">上行</wd-radio>
            <wd-radio :value="false">下行</wd-radio>
          </wd-radio-group>
        </view>
        <view class="yd-search-form-actions">
          <wd-button class="flex-1" variant="plain" @click="handleReset">重置</wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">搜索</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 消息列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无设备消息" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id || item.requestId" class="mb-24rpx rounded-12rpx bg-white p-24rpx shadow-sm">
          <view class="mb-16rpx flex items-center justify-between gap-16rpx">
            <view class="min-w-0 flex-1 text-30rpx text-[#333] font-semibold">
              {{ getDeviceMessageMethodLabel(item.method) || item.method || '-' }}
            </view>
            <view class="shrink-0 rounded-6rpx px-12rpx py-4rpx text-24rpx" :class="item.upstream ? 'bg-[#e6f4ff] text-[#1677ff]' : 'bg-[#f6ffed] text-[#52c41a]'">
              {{ item.upstream ? '上行' : '下行' }}
            </view>
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">请求编号：</text>{{ item.requestId || '-' }}
          </view>
          <view class="mb-12rpx text-26rpx text-[#666]">
            <text class="mr-8rpx text-[#999]">是否回复：</text>{{ item.reply ? '是' : '否' }}
          </view>
          <view class="mb-12rpx break-all rounded-8rpx bg-[#f7f8fa] p-16rpx text-24rpx text-[#666]">
            {{ formatPayload(item) }}
          </view>
          <view class="text-24rpx text-[#999]">
            {{ formatDateTime(item.ts || item.createTime) || '-' }}
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDeviceMessagePage } from '@/api/iot/device/device'
import { getDeviceMessageMethodLabel, getDeviceMessageMethodOptions } from '@/pages-iot/utils/constants'
import { navigateBackPlus, getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ deviceId?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const list = ref<any[]>([]) // 消息列表
const pagingRef = ref<any>() // 分页组件引用
const visible = ref(false) // 搜索弹窗显示状态
const queryParams = ref<Record<string, any>>({}) // 查询参数
const formData = reactive({ method: undefined as string | undefined, upstream: 'all' as boolean | 'all' }) // 搜索表单数据
const methodOptions = getDeviceMessageMethodOptions()
const placeholder = computed(() => {
  if (formData.method) {
    return getDeviceMessageMethodLabel(formData.method)
  }
  if (formData.upstream !== 'all') {
    return formData.upstream ? '上行消息' : '下行消息'
  }
  return '搜索设备消息'
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/device/device/detail/index?id=${props.deviceId}`)
}

/** 查询设备消息 */
async function queryList(pageNo: number, pageSize: number) {
  if (!props.deviceId) {
    pagingRef.value?.completeByTotal([], 0)
    return
  }
  try {
    const data = await getDeviceMessagePage({
      ...queryParams.value,
      deviceId: Number(props.deviceId),
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 格式化消息数据 */
function formatPayload(item: any) {
  if (item.reply) {
    return JSON.stringify({ code: item.code, msg: item.msg, data: item.data })
  }
  if (typeof item.params === 'string') {
    return item.params || '-'
  }
  return item.params ? JSON.stringify(item.params) : '-'
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  queryParams.value = {
    method: formData.method,
    upstream: formData.upstream === 'all' ? undefined : formData.upstream,
  }
  pagingRef.value?.reload()
}

/** 重置按钮操作 */
function handleReset() {
  formData.method = undefined
  formData.upstream = 'all'
  visible.value = false
  queryParams.value = {}
  pagingRef.value?.reload()
}
</script>
