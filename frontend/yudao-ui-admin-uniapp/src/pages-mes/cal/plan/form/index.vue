<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="计划编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="计划名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入计划名称" clearable />
          </wd-form-item>
          <wd-form-item title="班组类型" title-width="220rpx" prop="calendarType">
            <wd-radio-group v-model="formData.calendarType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="开始日期" title-width="220rpx" prop="startDate" is-link :value="formData.startDate || ''" placeholder="请选择开始日期" @click="dateVisible.startDate = true" />
          <wd-datetime-picker v-model="formData.startDate" v-model:visible="dateVisible.startDate" title="请选择开始日期" type="date" />
          <wd-form-item title="结束日期" title-width="220rpx" prop="endDate" is-link :value="formData.endDate || ''" placeholder="请选择结束日期" @click="dateVisible.endDate = true" />
          <wd-datetime-picker v-model="formData.endDate" v-model:visible="dateVisible.endDate" title="请选择结束日期" type="date" />
          <wd-form-item title="轮班方式" title-width="220rpx" prop="shiftType">
            <wd-radio-group v-model="formData.shiftType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_SHIFT_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="showShiftMethod" title="倒班方式" title-width="220rpx" prop="shiftMethod">
            <wd-radio-group v-model="formData.shiftMethod" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_SHIFT_METHOD)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item v-if="formData.shiftMethod === MesCalShiftMethodEnum.DAY" title="倒班天数" title-width="220rpx" prop="shiftCount" center>
            <wd-input-number v-model="formData.shiftCount" :min="1" :precision="0" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <view v-if="currentId" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        新增排班计划会自动生成默认班次。确认计划前，请检查班次和班组数量；确认后不可再编辑。
      </view>
      <PlanShiftList v-if="currentId" :plan-id="currentId" :editable="isPrepare" />
      <PlanTeamList v-if="currentId" :plan-id="currentId" :editable="isPrepare" />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        保存排班计划后，可继续维护班次和班组。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="yd-detail-footer-actions">
      <wd-button v-if="currentId && isPrepare" class="flex-1" type="warning" :loading="confirmLoading" @click="handleConfirm">
        确认计划
      </wd-button>
      <wd-button class="flex-1" type="primary" :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { CalPlanCreateReqVO, CalPlanUpdateReqVO, CalPlanVO } from '@/api/mes/cal/plan'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { confirmPlan, createPlan, getPlan, updatePlan } from '@/api/mes/cal/plan'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import PlanShiftList from '../components/plan-shift-list.vue'
import PlanTeamList from '../components/plan-team-list.vue'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  CAL_PLAN_CODE: 'CAL_PLAN_CODE',
} as const
const MesCalPlanStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
} as const
const MesCalShiftTypeEnum = {
  SINGLE: 1,
} as const
const MesCalShiftMethodEnum = {
  DAY: 4,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/cal/plan/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑排班计划' : '新增排班计划')
const formLoading = ref(false) // 表单提交状态
const confirmLoading = ref(false) // 确认状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<Partial<CalPlanVO>>(getDefaultFormData()) // 表单数据
const dateVisible = reactive({
  startDate: false,
  endDate: false,
}) // 日期弹层
const formSchema = createFormSchema({
  code: [{ required: true, message: '计划编码不能为空' }],
  name: [{ required: true, message: '计划名称不能为空' }],
  calendarType: [{ required: true, message: '班组类型不能为空' }],
  startDate: [{ required: true, message: '开始日期不能为空' }],
  endDate: [{ required: true, message: '结束日期不能为空' }],
  shiftType: [{ required: true, message: '轮班方式不能为空' }],
})
const isPrepare = computed(() => formData.value.status === MesCalPlanStatusEnum.PREPARE)
const showShiftMethod = computed(() => !!formData.value.shiftType && formData.value.shiftType !== MesCalShiftTypeEnum.SINGLE)

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/plan/index')
}

/** 日期转接口日期时间 */
function toDateTime(day?: number | string) {
  return day ? `${dayjs(day).format('YYYY-MM-DD')} 00:00:00` : ''
}

/** 默认表单数据 */
function getDefaultFormData(): Partial<CalPlanVO> {
  return {
    code: '',
    name: '',
    calendarType: undefined,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(6, 'day').format('YYYY-MM-DD'),
    shiftType: undefined,
    shiftMethod: undefined,
    shiftCount: undefined,
    status: MesCalPlanStatusEnum.PREPARE,
    remark: '',
  }
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  formData.value = { ...getDefaultFormData(), ...await getPlan(currentId.value) }
  formData.value.startDate = dayjs(formData.value.startDate).format('YYYY-MM-DD')
  formData.value.endDate = dayjs(formData.value.endDate).format('YYYY-MM-DD')
}

/** 生成排班计划编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.CAL_PLAN_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): CalPlanCreateReqVO | CalPlanUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    calendarType: Number(formData.value.calendarType),
    startDate: toDateTime(formData.value.startDate),
    endDate: toDateTime(formData.value.endDate),
    shiftType: Number(formData.value.shiftType),
    shiftMethod: showShiftMethod.value ? formData.value.shiftMethod : undefined,
    shiftCount: formData.value.shiftMethod === MesCalShiftMethodEnum.DAY ? formData.value.shiftCount : undefined,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updatePlan(data)
      toast.success('修改成功')
    } else {
      await createPlan(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:cal:plan:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 确认计划 */
async function handleConfirm() {
  if (!currentId.value) {
    return
  }
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  try {
    await dialog.confirm({
      title: '确认计划',
      msg: '确认前会先保存当前计划，确认后将生成班组排班记录且不可再修改。确定继续吗？',
    })
  } catch {
    return
  }
  confirmLoading.value = true
  try {
    await updatePlan(buildSubmitData() as CalPlanUpdateReqVO)
    await confirmPlan(currentId.value)
    toast.success('确认成功')
    uni.$emit('mes:cal:plan:reload')
    setTimeout(() => handleBack(), 500)
  } finally {
    confirmLoading.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
