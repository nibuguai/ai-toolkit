<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 工作记录详情"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="编号" :value="formData?.id ? String(formData.id) : '-'" />
        <wd-cell title="用户" :value="formData?.userNickname || '-'" />
        <wd-cell title="工作站编码" :value="formData?.workstationCode || '-'" />
        <wd-cell title="工作站名称" :value="formData?.workstationName || '-'" />
        <wd-cell title="操作类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_PRO_WORK_RECORD_TYPE" :value="formData.type" />
          <text v-else>-</text>
        </wd-cell>
        <wd-cell title="操作时间" :value="formatDateTime(formData?.createTime) || '-'" />
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ProWorkRecordLogVO } from '@/api/mes/pro/workrecord'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getWorkRecordLog } from '@/api/mes/pro/workrecord'
import { useRouteQuery } from '@/hooks/useRouteQuery'
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

const toast = useToast()
const formData = ref<ProWorkRecordLogVO>() // 详情数据
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/workrecord/detail/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/workrecord/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    formData.value = undefined
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getWorkRecordLog(currentId.value)
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

/** 初始化 */
onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
