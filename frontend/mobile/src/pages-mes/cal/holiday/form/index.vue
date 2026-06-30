<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="日期"
            title-width="180rpx"
            prop="day"
            is-link
            :value="formData.day || ''"
            placeholder="请选择日期"
            @click="handleOpenDayPicker"
          />
          <wd-datetime-picker
            v-model="formData.day"
            v-model:visible="dayVisible"
            title="请选择日期"
            type="date"
          />
          <wd-form-item title="类型" title-width="180rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_HOLIDAY_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import dayjs from 'dayjs'
import { onMounted, reactive, ref } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { getHolidayByDay, saveHoliday } from '@/api/mes/cal/holiday'
import { getIntDictOptions } from '@/hooks/useDict'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ day?: string }>()
const HolidayType = {
  WORKDAY: 1,
  HOLIDAY: 2,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formLoading = ref(false) // 表单提交状态
const dayVisible = ref(false) // 日期选择弹层
const formRef = ref<FormInstance>() // 表单组件引用
const formData = reactive({
  id: undefined as number | undefined,
  day: dayjs().format('YYYY-MM-DD'),
  type: HolidayType.WORKDAY as number,
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  day: [{ required: true, message: '日期不能为空' }],
  type: [{ required: true, message: '类型不能为空' }],
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/holiday/index')
}

/** 打开日期选择 */
function handleOpenDayPicker() {
  if (props.day) {
    return
  }
  dayVisible.value = true
}

/** 日期转接口日期时间 */
function toDateTime(day: string) {
  return `${dayjs(day).format('YYYY-MM-DD')} 00:00:00`
}

/** 加载详情 */
async function getDetail() {
  if (props.day) {
    formData.day = props.day
  }
  formLoading.value = true
  try {
    const detail = await getHolidayByDay(toDateTime(formData.day))
    if (detail) {
      formData.id = detail.id
      formData.type = detail.type ?? HolidayType.WORKDAY
      formData.remark = detail.remark || ''
    }
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    await saveHoliday({
      id: formData.id,
      day: toDateTime(formData.day),
      type: formData.type,
      remark: formData.remark || undefined,
    })
    toast.success('设置成功')
    uni.$emit('mes:cal:holiday:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  getDetail()
})
</script>
