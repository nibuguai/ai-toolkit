<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES SN 码详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 批次信息 -->
    <view class="p-24rpx">
      <wd-cell-group border>
        <wd-cell title="批次 UUID" :value="groupData?.uuid || currentUuid || '-'" />
        <wd-cell title="物料编码" :value="groupData?.itemCode || firstDetail?.itemCode || '-'" />
        <wd-cell title="物料名称" :value="groupData?.itemName || firstDetail?.itemName || '-'" />
        <wd-cell title="规格型号" :value="groupData?.specification || firstDetail?.specification || '-'" />
        <wd-cell title="单位" :value="groupData?.unitName || firstDetail?.unitName || '-'" />
        <wd-cell title="批次号" :value="groupData?.batchCode || firstDetail?.batchCode || '-'" />
        <wd-cell title="SN 码数量" :value="String(groupData?.count ?? detailList.length)" />
        <wd-cell title="工单编号" :value="String(groupData?.workOrderId || firstDetail?.workOrderId || '-')" />
        <wd-cell title="生成时间" :value="formatDateTime(groupData?.createTime || firstDetail?.createTime) || '-'" />
      </wd-cell-group>
    </view>

    <!-- SN 明细列表 -->
    <view class="px-24rpx pb-24rpx">
      <view class="mb-16rpx text-28rpx text-[#666] font-semibold">
        SN 码明细
      </view>
      <view v-if="loading" class="rounded-12rpx bg-white py-48rpx text-center">
        <wd-loading />
      </view>
      <view v-else-if="detailList.length === 0" class="rounded-12rpx bg-white py-48rpx">
        <wd-empty icon="content" tip="暂无 SN 码明细" />
      </view>
      <template v-else>
        <view
          v-for="item in visibleDetailList"
          :key="item.id"
          class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
        >
          <view class="mb-12rpx truncate text-30rpx text-[#333] font-semibold">
            {{ item.code || '-' }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">物料编码：</text>{{ item.itemCode || '-' }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">物料名称：</text>{{ item.itemName || '-' }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">规格型号：</text>{{ item.specification || '-' }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">批次号：</text>{{ item.batchCode || '-' }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="text-[#999]">生成时间：</text>{{ formatDateTime(item.createTime) || '-' }}
          </view>
        </view>
        <wd-button
          v-if="hasMoreDetails"
          block
          variant="plain"
          @click="loadMoreDetails"
        >
          加载更多（{{ visibleDetailList.length }}/{{ detailList.length }}）
        </wd-button>
        <view v-else-if="detailList.length > initialVisibleSize" class="py-12rpx text-center text-24rpx text-[#999]">
          已显示全部 {{ detailList.length }} 条 SN 码
        </view>
      </template>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { WmSnGroupVO, WmSnVO } from '@/api/mes/wm/sn'
import { computed, onMounted, ref, watch } from 'vue'
import { getSnGroupPage, getSnListByUuid } from '@/api/mes/wm/sn'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{
  id?: string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const groupData = ref<WmSnGroupVO>() // 批次概要
const detailList = ref<WmSnVO[]>([]) // SN 明细列表
const loading = ref(false) // 明细加载状态
const initialVisibleSize = 20 // 首屏展示条数
const visibleSize = ref(initialVisibleSize) // 当前展示条数
const firstDetail = computed(() => detailList.value[0])
const { getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/sn/detail/index')
const currentUuid = computed(() => {
  const uuid = getRouteQueryValue('id')
  return uuid ? String(uuid) : undefined
})
const visibleDetailList = computed(() => detailList.value.slice(0, visibleSize.value))
const hasMoreDetails = computed(() => visibleDetailList.value.length < detailList.value.length)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/sn/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentUuid.value) {
    return
  }
  loading.value = true
  visibleSize.value = initialVisibleSize
  const uuid = currentUuid.value
  try {
    const [groupPage, detailRows] = await Promise.all([
      getSnGroupPage({
        uuid,
        pageNo: 1,
        pageSize: 1,
      }),
      getSnListByUuid(uuid),
    ])
    groupData.value = groupPage.list?.[0] || { uuid, count: detailRows.length }
    detailList.value = detailRows
  } finally {
    loading.value = false
  }
}

/** 加载更多明细 */
function loadMoreDetails() {
  visibleSize.value = Math.min(visibleSize.value + initialVisibleSize, detailList.value.length)
}

/** 初始化 */
onMounted(() => {
  getDetail()
})

watch(currentUuid, () => {
  getDetail()
})
</script>
