<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 条码配置详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="条码格式">
          <dict-tag v-if="formData?.format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="formData.format" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="业务类型">
          <dict-tag v-if="formData?.bizType != null" :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" :value="formData.bizType" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="内容格式模板" :value="formData?.contentFormat || '-'" />
        <wd-cell title="内容样例" :value="formData?.contentExample || '-'" />
        <wd-cell title="自动生成" :value="formData?.autoGenerateFlag ? '是' : '否'" />
        <wd-cell title="默认打印模板" :value="formData?.defaultTemplate || '报表/打印专项维护'" />
        <wd-cell title="状态">
          <dict-tag v-if="formData?.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f7faff] p-24rpx text-26rpx text-[#666] leading-40rpx">
        默认打印模板暂不在移动端选择；正式打印和模板维护归入报表/打印专项。
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button
        v-if="hasAccessByCodes(['mes:wm-barcode-config:update'])"
        class="flex-1" type="warning" @click="handleEdit"
      >
        编辑
      </wd-button>
      <wd-button
        v-if="hasAccessByCodes(['mes:wm-barcode-config:delete'])"
        class="flex-1" type="danger" :loading="deleting" @click="handleDelete"
      >
        删除
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { WmBarcodeConfigVO } from '@/api/mes/wm/barcode/config'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { deleteBarcodeConfig, getBarcodeConfig } from '@/api/mes/wm/barcode/config'
import { useAccess } from '@/hooks/useAccess'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/barcode/config/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const formData = ref<WmBarcodeConfigVO>() // 详情数据
const deleting = ref(false) // 删除状态

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getBarcodeConfig(currentId.value)
    if (!detailData) {
      uni.showToast({ icon: 'none', title: '详情不存在，已返回列表' })
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
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
    url: `/pages-mes/wm/barcode/config/form/index?id=${currentId.value}`,
  })
}

/** 删除 */
async function handleDelete() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确定要删除该条码配置吗？',
    })
  } catch {
    return
  }
  deleting.value = true
  try {
    await deleteBarcodeConfig(currentId.value)
    toast.success('删除成功')
    uni.$emit('mes:wm:barcode:config:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

watch(currentId, () => {
  initPage()
})
</script>
