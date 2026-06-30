<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar title="生产流转卡" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 流转卡列表 -->
    <z-paging ref="pagingRef" v-model="list" :fixed="false" class="min-h-0 flex-1" :default-page-size="10" :refresher-enabled="true" :inside-more="true" :loading-more-default-as-loading="true" empty-view-text="暂无生产流转卡数据" @query="queryList">
      <view class="p-24rpx">
        <view v-for="item in list" :key="item.id" class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
          <view class="p-24rpx" @click="handleDetail(item)">
            <view class="mb-16rpx flex items-start justify-between gap-16rpx">
              <view class="min-w-0 flex-1">
                <view class="truncate text-32rpx text-[#333] font-semibold">
                  {{ item.code || '-' }}
                </view>
                <view class="mt-4rpx text-24rpx text-[#999]">
                  {{ item.workOrderCode || '-' }} / {{ item.workOrderName || '-' }}
                </view>
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_PRO_WORK_ORDER_STATUS" :value="item.status" />
            </view>
            <view class="text-26rpx text-[#666] space-y-8rpx">
              <view>批次号：{{ item.batchCode || '-' }}</view>
              <view>产品：{{ item.itemCode || '-' }} / {{ item.itemName || '-' }}</view>
              <view>规格：{{ item.specification || '-' }} / 单位：{{ item.unitMeasureName || '-' }}</view>
              <view>流转数量：{{ item.transferedQuantity ?? '-' }}</view>
            </view>
          </view>
          <view class="flex flex-wrap border-t border-[#f3f4f6] text-26rpx">
            <view v-if="canUpdate && item.status === MesProCardStatusEnum.PREPARE" class="w-1/3 py-18rpx text-center text-[#1677ff]" @click="handleEdit(item)">
              编辑
            </view>
            <view v-if="canUpdate && item.status === MesProCardStatusEnum.PREPARE" class="w-1/3 py-18rpx text-center text-[#faad14]" @click="handleSubmitCard(item)">
              提交
            </view>
            <view v-if="canDelete && item.status === MesProCardStatusEnum.PREPARE" class="w-1/3 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </view>
            <view v-if="canFinish && item.status === MesProCardStatusEnum.CONFIRMED" class="w-1/2 py-18rpx text-center text-[#52c41a]" @click="handleFinish(item)">
              完成
            </view>
            <view v-if="canUpdate && item.status === MesProCardStatusEnum.CONFIRMED" class="w-1/2 py-18rpx text-center text-[#f56c6c]" @click="handleCancel(item)">
              取消
            </view>
            <view class="flex-1 py-18rpx text-center text-[#666]" @click="handleDetail(item)">
              详情
            </view>
          </view>
        </view>
      </view>
    </z-paging>

    <!-- 新增按钮 -->
    <wd-fab v-if="canCreate" position="right-bottom" type="primary" :expandable="false" @click="handleAdd" />
  </view>
</template>

<script lang="ts" setup>
import type { ProCardQueryParams, ProCardVO } from '@/api/mes/pro/card'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { cancelCard, deleteCard, finishCard, getCardPage, submitCard } from '@/api/mes/pro/card'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

const MesProCardStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProCardVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<ProCardVO>>() // 分页组件引用
const queryParams = ref<Partial<ProCardQueryParams>>({}) // 查询参数
const canCreate = computed(() => hasAccessByCodes(['mes:pro-card:create']))
const canUpdate = computed(() => hasAccessByCodes(['mes:pro-card:update']))
const canDelete = computed(() => hasAccessByCodes(['mes:pro-card:delete']))
const canFinish = computed(() => hasAccessByCodes(['mes:pro-card:finish']))/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const data = await getCardPage({
      ...queryParams.value,
      pageNo,
      pageSize,
    })
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data: Partial<ProCardQueryParams>) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery({})
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({ url: '/pages-mes/pro/card/form/index' })
}

/** 编辑 */
function handleEdit(item: ProCardVO) {
  uni.navigateTo({ url: `/pages-mes/pro/card/form/index?id=${item.id}` })
}

/** 查看详情 */
function handleDetail(item: ProCardVO) {
  uni.navigateTo({ url: `/pages-mes/pro/card/detail/index?id=${item.id}` })
}

/** 提交流转卡 */
async function handleSubmitCard(item: ProCardVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认提交「${item.code}」流转卡吗？提交后将不能修改。` })
  } catch {
    return
  }
  await submitCard(item.id)
  toast.success('提交成功')
  reload()
}

/** 完成流转卡 */
async function handleFinish(item: ProCardVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认完成「${item.code}」流转卡吗？` })
  } catch {
    return
  }
  await finishCard(item.id)
  toast.success('完成成功')
  reload()
}

/** 取消流转卡 */
async function handleCancel(item: ProCardVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确认取消「${item.code}」流转卡吗？取消后不可恢复。` })
  } catch {
    return
  }
  await cancelCard(item.id)
  toast.success('取消成功')
  reload()
}

/** 删除流转卡 */
async function handleDelete(item: ProCardVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.code}」流转卡吗？删除后会级联删除工序记录。` })
  } catch {
    return
  }
  await deleteCard(item.id)
  toast.success('删除成功')
  reload()
}

onMounted(() => {
  uni.$on('mes:pro:card:reload', reload)
})

onUnload(() => {
  uni.$off('mes:pro:card:reload', reload)
})
</script>
