<template>
  <view class="yd-page-container">
    <wd-navbar title="固件详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" /><view>
      <wd-cell-group border>
        <wd-cell title="固件编号" :value="String(formData?.id || '-')" /><wd-cell title="固件名称" :value="formData?.name || '-'" /><wd-cell title="所属产品" :value="formData?.productName || String(formData?.productId || '-')" /><wd-cell title="版本号" :value="formData?.version || '-'" /><wd-cell title="文件地址" :value="formData?.fileUrl || '-'" /><wd-cell title="文件大小" :value="formatFileSize(formData?.fileSize)" /><wd-cell title="签名算法" :value="formData?.fileDigestAlgorithm || '-'" /><wd-cell title="签名结果" :value="formData?.fileDigestValue || '-'" /><wd-cell title="固件描述" :value="formData?.description || '-'" /><wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>
    </view><view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button class="flex-1" type="info" @click="handleCreateTask">
          升级
        </wd-button><wd-button v-if="hasAccessByCodes(['iot:ota-firmware:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button><wd-button v-if="hasAccessByCodes(['iot:ota-firmware:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { OtaFirmware } from '@/api/iot/ota/firmware'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { ref } from 'vue'
import { deleteOtaFirmware, getOtaFirmware } from '@/api/iot/ota/firmware'
import { useAccess } from '@/hooks/useAccess'
import { delay, navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { formatFileSize } from '@/utils/download'

const props = defineProps<{ id?: number | any }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<OtaFirmware>() // 详情数据
const deleting = ref(false) // 删除状态
/** 返回上一页 */
function handleBack() { navigateBackPlus('/pages-iot/ota/firmware/index') }
/** 加载固件详情 */
async function getDetail() {
  if (props.id && !deleting.value)
    formData.value = await getOtaFirmware(Number(props.id))
}
/** 编辑固件 */
function handleEdit() { uni.navigateTo({ url: `/pages-iot/ota/firmware/form/index?id=${props.id}` }) }
/** 创建升级任务 */
function handleCreateTask() { uni.navigateTo({ url: `/pages-iot/ota/task/form/index?firmwareId=${props.id}` }) }
/** 删除固件 */
async function handleDelete() {
  if (!props.id)
    return; try { await dialog.confirm({ title: '提示', msg: '确定要删除该固件吗？' }) } catch { return } deleting.value = true; try { await deleteOtaFirmware(Number(props.id)); toast.success('删除成功'); uni.$emit('iot:ota-firmware:reload'); delay(handleBack) } finally { deleting.value = false }
}
/** 初始化 */
onShow(() => { getDetail() })
</script>
