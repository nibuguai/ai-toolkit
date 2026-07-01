<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-cell-group border>
        <wd-cell title="日期" :value="dayText || '-'" />
        <wd-cell title="日期类型">
          <dict-tag v-if="formData?.type != null" :type="DICT_TYPE.MES_CAL_HOLIDAY_TYPE" :value="formData.type" />
          <text v-else>
            工作日
          </text>
        </wd-cell>
        <wd-cell title="备注" :value="formData?.remark || '-'" />
      </wd-cell-group>
    </scroll-view>

    <!-- 底部操作按钮 -->
    <MesFooterActions>
      <wd-button
        v-if="hasAccessByCodes(['mes:cal-holiday:create'])"
        type="primary"
        block
        @click="handleEdit"
      >
        设置
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { CalHolidayVO } from '@/api/mes/cal/holiday'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, ref } from 'vue'
import { getHolidayByDay } from '@/api/mes/cal/holiday'
import { useAccess } from '@/hooks/useAccess'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{ day?: string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const formData = ref<CalHolidayVO>() // 详情数据
const dayText = computed(() => props.day ? dayjs(props.day).format('YYYY-MM-DD') : '')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/holiday/index')
}

/** 加载详情 */
async function getDetail() {
  if (!dayText.value) {
    return
  }
  try {
    toast.loading('加载中...')
    const detailData = await getHolidayByDay(`${dayText.value} 00:00:00`)
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

/** 设置假期 */
function handleEdit() {
  if (!dayText.value) {
    return
  }
  uni.navigateTo({ url: `/pages-mes/cal/holiday/form/index?day=${dayText.value}` })
}

onMounted(() => {
  getDetail()
})
</script>
