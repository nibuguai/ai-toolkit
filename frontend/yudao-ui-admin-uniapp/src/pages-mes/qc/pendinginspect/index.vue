<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 待检任务管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm :initial-query="queryParams" @search="handleQuery" @reset="handleReset" />

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无待检任务数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="getItemKey(item)"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.sourceDocCode || '-' }}
              </view>
              <dict-tag :type="DICT_TYPE.MES_QC_TYPE" :value="item.qcType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">来源单据类型：</text>
              <dict-tag :type="DICT_TYPE.MES_QC_SOURCE_DOC_TYPE" :value="item.sourceDocType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">检验类型：</text>
              <dict-tag :type="DICT_TYPE.MES_QC_TYPE" :value="item.qcType" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料编码：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.itemCode || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">物料名称：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.itemName || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">待检数量：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }} {{ item.unitName || '' }}</text>
            </view>
            <view v-if="item.vendorName" class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">供应商：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.vendorName }}</text>
            </view>
            <view v-if="item.clientName" class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">客户：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.clientName }}</text>
            </view>
            <view v-if="item.workstationName || item.taskCode" class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">生产信息：</text>
              <text class="min-w-0 flex-1 truncate">{{ getProductionText(item) }}</text>
            </view>
            <view v-if="item.recordTime" class="mb-16rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务时间：</text>
              <text class="min-w-0 flex-1 truncate">{{ formatDateTime(item.recordTime) || '-' }}</text>
            </view>
            <view v-if="getCreateAction(item)" class="flex justify-end border-t border-t-[#f0f0f0] pt-20rpx">
              <wd-button size="small" type="primary" @click="handleCreateInspect(item)">
                {{ getCreateAction(item)?.label }}
              </wd-button>
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { QcPendingInspectPageParam, QcPendingInspectVO } from '@/api/mes/qc/pendinginspect'
import { onUnload } from '@dcloudio/uni-app'
import { onMounted, ref } from 'vue'
import { getPendingInspectPage } from '@/api/mes/qc/pendinginspect'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const props = defineProps<{
  sourceDocCode?: string
  qcType?: number | string
  itemId?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/qc/pendinginspect/index')
const list = ref<QcPendingInspectVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<QcPendingInspectVO>>() // 分页组件引用
const queryParams = ref<Omit<QcPendingInspectPageParam, 'pageNo' | 'pageSize'>>(getInitialQueryParams()) // 查询参数

const MesQcTypeEnum = {
  IQC: 1,
  IPQC: 2,
  OQC: 3,
  RQC: 4,
} as const

interface CreateAction {
  label: string
  permission: string
  url: string
}

/** 初始查询参数 */
function getInitialQueryParams() {
  return {
    sourceDocCode: getRouteQueryValue('sourceDocCode') as string | undefined,
    qcType: getRouteQueryNumber('qcType'),
    itemId: getRouteQueryNumber('itemId'),
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getPendingInspectPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: Omit<QcPendingInspectPageParam, 'pageNo' | 'pageSize'>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 生产信息展示 */
function getProductionText(item: QcPendingInspectVO) {
  return [
    item.taskCode ? `任务 ${item.taskCode}` : '',
    item.workstationName ? `工位 ${item.workstationName}` : '',
  ].filter(Boolean).join(' / ') || '-'
}

/** 列表唯一标识 */
function getItemKey(item: QcPendingInspectVO) {
  return `${item.sourceDocType}-${item.sourceDocId}-${item.sourceLineId}-${item.qcType}`
}

/** 获取创建动作 */
function getCreateAction(item: QcPendingInspectVO): CreateAction | undefined {
  const actionMap: Record<number, CreateAction> = {
    [MesQcTypeEnum.IQC]: {
      label: '来料检验',
      permission: 'mes:qc-iqc:create',
      url: '/pages-mes/qc/iqc/form/index',
    },
    [MesQcTypeEnum.IPQC]: {
      label: '过程检验',
      permission: 'mes:qc-ipqc:create',
      url: '/pages-mes/qc/ipqc/form/index',
    },
    [MesQcTypeEnum.OQC]: {
      label: '出货检验',
      permission: 'mes:qc-oqc:create',
      url: '/pages-mes/qc/oqc/form/index',
    },
    [MesQcTypeEnum.RQC]: {
      label: '退料检验',
      permission: 'mes:qc-rqc:create',
      url: '/pages-mes/qc/rqc/form/index',
    },
  }
  const action = actionMap[item.qcType]
  if (!action || !hasAccessByCodes([action.permission])) {
    return undefined
  }
  return action
}

/** 拼接创建页参数 */
function buildCreateQuery(item: QcPendingInspectVO) {
  const params = [
    `sourceDocType=${item.sourceDocType}`,
    `sourceDocId=${item.sourceDocId}`,
    `sourceLineId=${item.sourceLineId}`,
    `sourceDocCode=${encodeURIComponent(item.sourceDocCode)}`,
    `itemId=${item.itemId}`,
    `itemCode=${encodeURIComponent(item.itemCode || '')}`,
    `itemName=${encodeURIComponent(item.itemName || '')}`,
    `itemSpecification=${encodeURIComponent(item.specification || '')}`,
    `unitName=${encodeURIComponent(item.unitName || '')}`,
  ]
  if (item.recordTime) {
    params.push(`recordTime=${encodeURIComponent(item.recordTime)}`)
  }
  if (item.vendorId) {
    params.push(`vendorId=${item.vendorId}`)
  }
  if (item.vendorName) {
    params.push(`vendorNickname=${encodeURIComponent(item.vendorName)}`)
  }
  if (item.clientId) {
    params.push(`clientId=${item.clientId}`)
  }
  if (item.clientName) {
    params.push(`clientNickname=${encodeURIComponent(item.clientName)}`)
  }
  if (item.workOrderId) {
    params.push(`workOrderId=${item.workOrderId}`)
  }
  if (item.workstationId) {
    params.push(`workstationId=${item.workstationId}`)
  }
  if (item.workstationName) {
    params.push(`workstationName=${encodeURIComponent(item.workstationName)}`)
  }
  if (item.taskId) {
    params.push(`taskId=${item.taskId}`)
  }
  if (item.taskCode) {
    params.push(`taskCode=${encodeURIComponent(item.taskCode)}`)
  }
  return params.join('&')
}

/** 创建检验单 */
function handleCreateInspect(item: QcPendingInspectVO) {
  const action = getCreateAction(item)
  if (!action) {
    return
  }
  const query = buildCreateQuery(item)
  const nameMap: Record<number, string> = {
    [MesQcTypeEnum.IQC]: `${item.sourceDocCode} 来料检验单`,
    [MesQcTypeEnum.IPQC]: `${item.sourceDocCode} 过程检验单`,
    [MesQcTypeEnum.OQC]: `${item.sourceDocCode} 出货检验单`,
    [MesQcTypeEnum.RQC]: `${item.sourceDocCode} 退料检验单`,
  }
  uni.navigateTo({
    url: `${action.url}?${query}&quantity=${item.quantity}&name=${encodeURIComponent(nameMap[item.qcType] || item.sourceDocCode)}`,
  })
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:qc:pendinginspect:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:qc:pendinginspect:reload', reload)
})
</script>
