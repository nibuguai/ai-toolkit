<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="假期设置" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 月份切换 -->
    <view class="bg-white px-24rpx py-20rpx">
      <view class="flex items-center justify-between">
        <wd-button size="small" variant="plain" @click="changeMonth(-1)">
          上月
        </wd-button>
        <view class="text-34rpx text-[#333] font-semibold">
          {{ currentMonthText }}
        </view>
        <wd-button size="small" variant="plain" @click="changeMonth(1)">
          下月
        </wd-button>
      </view>
      <view class="mt-16rpx flex items-center justify-center gap-24rpx text-24rpx text-[#666]">
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#52c41a]" />
          <text>休息日</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#1677ff]" />
          <text>工作日</text>
        </view>
        <view class="flex items-center gap-8rpx">
          <text class="h-18rpx w-18rpx rounded-full bg-[#f56c6c]" />
          <text>周末</text>
        </view>
      </view>
    </view>

    <!-- 日历视图 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <view class="m-24rpx overflow-hidden rounded-16rpx bg-white shadow-sm">
        <view class="grid grid-cols-7 border-b border-[#f2f3f5]">
          <view
            v-for="week in weekLabels"
            :key="week"
            class="py-18rpx text-center text-24rpx text-[#999]"
          >
            {{ week }}
          </view>
        </view>
        <view class="grid grid-cols-7">
          <view
            v-for="day in calendarDays"
            :key="day.date"
            class="min-h-128rpx border-b border-r border-[#f2f3f5] p-10rpx"
            :class="day.isCurrentMonth ? 'bg-white' : 'bg-[#fafafa]'"
            @click="handleDayClick(day)"
          >
            <view class="flex items-start justify-between gap-6rpx">
              <text
                class="text-28rpx font-semibold"
                :class="[
                  day.isCurrentMonth ? 'text-[#333]' : 'text-[#c8c9cc]',
                  day.isWeekend && day.isCurrentMonth ? 'text-[#f56c6c]' : '',
                ]"
              >
                {{ day.dayOfMonth }}
              </text>
              <text
                v-if="day.isCurrentMonth"
                class="rounded-6rpx px-8rpx py-2rpx text-20rpx text-white"
                :class="isHoliday(day.date) ? 'bg-[#52c41a]' : 'bg-[#1677ff]'"
              >
                {{ isHoliday(day.date) ? '休' : '班' }}
              </text>
            </view>
            <view v-if="day.isToday" class="mt-8rpx text-22rpx text-[#1677ff]">
              今天
            </view>
            <view v-if="day.isCurrentMonth && holidayMap[day.date]?.remark" class="line-clamp-2 mt-8rpx text-22rpx text-[#666]">
              {{ holidayMap[day.date]?.remark }}
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 假期设置弹层 -->
    <wd-popup v-model="formVisible" position="bottom" :safe-area-inset-bottom="true">
      <view class="max-h-[80vh] flex flex-col bg-white">
        <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
          <text class="text-32rpx text-[#333] font-semibold">
            假期设置
          </text>
          <wd-icon name="close" size="36rpx" @click="formVisible = false" />
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-cell title="日期" :value="selectedDay || '-'" />
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
              <wd-textarea
                v-model="formData.remark"
                placeholder="请输入备注"
                :maxlength="200"
                show-word-limit
                clearable
              />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="p-24rpx">
          <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalHolidayVO } from '@/api/mes/cal/holiday'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { getHolidayByDay, getHolidayList, saveHoliday } from '@/api/mes/cal/holiday'
import { getIntDictOptions } from '@/hooks/useDict'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

interface CalendarDay {
  date: string
  dayOfMonth: string
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
}

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

const { hasAccessByCodes } = useAccess()
const toast = useToast()
const currentMonth = ref(dayjs().startOf('month')) // 当前查看月份
const holidayMap = ref<Record<string, CalHolidayVO>>({}) // 日期维度的假期配置
const formVisible = ref(false) // 设置弹层显示状态
const formLoading = ref(false) // 设置提交状态
const selectedDay = ref('') // 当前设置日期
const formRef = ref<FormInstance>() // 设置表单引用
const formData = reactive({
  id: undefined as number | undefined,
  day: '',
  type: HolidayType.WORKDAY as number,
  remark: '',
}) // 设置表单数据
const formSchema = createFormSchema({
  type: [{ required: true, message: '类型不能为空' }],
})
const weekLabels = ['一', '二', '三', '四', '五', '六', '日'] // 周标题
const currentMonthText = computed(() => currentMonth.value.format('YYYY年MM月'))
const calendarDays = computed<CalendarDay[]>(() => {
  const startOfMonth = currentMonth.value.startOf('month')
  const endOfMonth = currentMonth.value.endOf('month')
  const mondayOffset = (startOfMonth.day() + 6) % 7
  const start = startOfMonth.subtract(mondayOffset, 'day')
  const totalDays = Math.ceil((mondayOffset + endOfMonth.date()) / 7) * 7
  return Array.from({ length: totalDays }, (_, index) => {
    const day = start.add(index, 'day')
    return {
      date: day.format('YYYY-MM-DD'),
      dayOfMonth: day.format('D'),
      isCurrentMonth: day.month() === currentMonth.value.month(),
      isToday: day.isSame(dayjs(), 'day'),
      isWeekend: day.day() === 0 || day.day() === 6,
    }
  })
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/home/index')
}

/** 日期转接口日期时间 */
function toDateTime(day: string) {
  return `${day} 00:00:00`
}

/** 后端日期格式化为 yyyy-MM-dd */
function normalizeDay(day?: number | string) {
  return day ? dayjs(day).format('YYYY-MM-DD') : ''
}

/** 判断是否为休息日 */
function isHoliday(day: string) {
  return holidayMap.value[day]?.type === HolidayType.HOLIDAY
}

/** 加载当前月前后可见范围假期 */
async function getList() {
  const startDay = currentMonth.value.subtract(1, 'month').startOf('month').format('YYYY-MM-DD 00:00:00')
  const endDay = currentMonth.value.add(1, 'month').endOf('month').format('YYYY-MM-DD 23:59:59')
  const list = await getHolidayList({ startDay, endDay })
  holidayMap.value = list.reduce<Record<string, CalHolidayVO>>((map, item) => {
    const day = normalizeDay(item.day)
    if (day) {
      map[day] = item
    }
    return map
  }, {})
}

/** 切换月份 */
function changeMonth(step: number) {
  currentMonth.value = currentMonth.value.add(step, 'month').startOf('month')
  getList()
}

/** 点击日期 */
async function handleDayClick(day: CalendarDay) {
  if (!day.isCurrentMonth) {
    return
  }
  if (!hasAccessByCodes(['mes:cal-holiday:create'])) {
    toast.warning('没有假期设置权限')
    return
  }
  selectedDay.value = day.date
  formData.id = undefined
  formData.day = toDateTime(day.date)
  formData.type = HolidayType.WORKDAY
  formData.remark = ''
  formRef.value?.reset()
  formVisible.value = true
  formLoading.value = true
  try {
    const detail = await getHolidayByDay(toDateTime(day.date))
    if (detail) {
      formData.id = detail.id
      formData.type = detail.type ?? HolidayType.WORKDAY
      formData.remark = detail.remark || ''
    }
  } finally {
    formLoading.value = false
  }
}

/** 保存假期设置 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    await saveHoliday({
      id: formData.id,
      day: formData.day,
      type: formData.type,
      remark: formData.remark || undefined,
    })
    toast.success('设置成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>
