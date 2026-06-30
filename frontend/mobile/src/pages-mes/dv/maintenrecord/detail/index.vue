<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 保养记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="设备编码" :value="formData?.machineryCode || '-'" />
        <wd-cell title="设备名称" :value="formData?.machineryName || '-'" />
        <wd-cell title="品牌" :value="formData?.machineryBrand || '-'" />
        <wd-cell title="规格型号" :value="formData?.machinerySpecification || '-'" />
        <wd-cell title="计划编码" :value="formData?.planCode || '-'" />
        <wd-cell title="计划名称" :value="formData?.planName || '-'" />
        <wd-cell title="保养时间" :value="formatDateTime(formData?.maintenTime) || '-'" />
        <wd-cell title="保养人" :value="formData?.nickname || '-'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.MES_MAINTEN_RECORD_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
      <MaintenRecordLineList :record-id="currentId" readonly />
      <view v-if="hasFooter" class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx">
        <view class="mb-20rpx text-28rpx text-[#333] font-semibold">
          记录操作
        </view>
        <view class="flex gap-16rpx text-28rpx">
          <view
            v-if="canUpdatePrepare"
            class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
            @click="handleEdit"
          >
            编辑
          </view>
          <view
            v-if="canDeletePrepare"
            class="flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white"
            :class="deleting ? 'opacity-60' : ''"
            @click="handleDelete"
          >
            {{ deleting ? '删除中...' : '删除' }}
          </view>
          <view
            v-if="canSubmitPrepare"
            class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
            :class="submitting ? 'opacity-60' : ''"
            @click="handleSubmitRecord"
          >
            {{ submitting ? '提交中...' : '提交' }}
          </view>
        </view>
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions v-if="hasFooter">
      <view
        v-if="canUpdatePrepare"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        @click="handleEdit"
      >
        编辑
      </view>
      <view
        v-if="canDeletePrepare"
        class="flex-1 rounded-8rpx bg-[#f56c6c] py-20rpx text-center text-white"
        :class="deleting ? 'opacity-60' : ''"
        @click="handleDelete"
      >
        {{ deleting ? '删除中...' : '删除' }}
      </view>
      <view
        v-if="canSubmitPrepare"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="submitting ? 'opacity-60' : ''"
        @click="handleSubmitRecord"
      >
        {{ submitting ? '提交中...' : '提交' }}
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { DvMaintenRecordVO } from '@/api/mes/dv/maintenrecord'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteMaintenRecord, getMaintenRecord, submitMaintenRecord } from '@/api/mes/dv/maintenrecord'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesDvMaintenRecordStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import MaintenRecordLineList from '../components/mainten-record-line-list.vue'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/maintenrecord/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前详情编号
const formData = ref<DvMaintenRecordVO>() // 详情数据
const deleting = ref(false) // 删除状态
const submitting = ref(false) // 提交状态
const canUpdatePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:update'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const canDeletePrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:delete'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const canSubmitPrepare = computed(() => (
  hasAccessByCodes(['mes:dv-mainten-record:update'])
  && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE
))
const hasFooter = computed(() => canUpdatePrepare.value || canDeletePrepare.value || canSubmitPrepare.value)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/maintenrecord/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getMaintenRecord(currentId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 300)
      return
    }
    formData.value = detailData
  } finally {
    toast.close()
  }
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  if (!formData.value || formData.value.id !== currentId.value) {
    await getDetail()
  }
}

/** 编辑 */
function handleEdit() {
  uni.navigateTo({
    url: `/pages-mes/dv/maintenrecord/form/index?id=${currentId.value}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value || !formData.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${formData.value.machineryCode || formData.value.machineryName || formData.value.id}」吗？`,
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteMaintenRecord(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:dv:maintenrecord:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 提交保养记录 */
async function handleSubmitRecord() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该保养记录？提交后将不能修改。',
    })
  } catch {
    return
  }
  submitting.value = true
  try {
    await submitMaintenRecord(currentId.value)
    toast.success('提交成功')
    await getDetail()
    uni.$emit('mes:dv:maintenrecord:reload')
  } finally {
    submitting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
