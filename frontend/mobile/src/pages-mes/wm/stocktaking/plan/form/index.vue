<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="方案编码" title-width="220rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                placeholder="请输入方案编码"
              />
              <wd-button size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入方案名称" />
          </wd-form-item>
          <wd-form-item title="盘点类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in stockTakingTypeOptions" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-if="isDynamicType"
            title="开始时间"
            title-width="220rpx"
            prop="startTime"
          >
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="pickerVisible.startTime = true">
              <text :class="formatDateTime(formData.startTime) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.startTime) || '请选择开始时间' }}
              </text>
              <wd-icon name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.startTime"
            v-model:visible="pickerVisible.startTime"
            title="请选择开始时间"
            type="datetime"
          />
          <wd-form-item
            v-if="isDynamicType"
            title="结束时间"
            title-width="220rpx"
            prop="endTime"
          >
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="pickerVisible.endTime = true">
              <text :class="formatDateTime(formData.endTime) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.endTime) || '请选择结束时间' }}
              </text>
              <wd-icon name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.endTime"
            v-model:visible="pickerVisible.endTime"
            title="请选择结束时间"
            type="datetime"
          />
          <wd-form-item title="是否盲盘" title-width="220rpx" prop="blindFlag" center>
            <wd-switch v-model="formData.blindFlag" />
          </wd-form-item>
          <wd-form-item title="冻结库存" title-width="220rpx" prop="frozen" center>
            <wd-switch v-model="formData.frozen" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="状态" title-width="220rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
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

      <view v-if="currentId" class="px-24rpx">
        <PlanParamList :plan-id="currentId" :readonly="!canMaintainParams" />
        <view
          v-if="!canMaintainParams"
          class="mt-16rpx rounded-12rpx bg-[#fff7e6] p-24rpx text-26rpx text-[#ad6800] leading-42rpx"
        >
          只有关闭状态的盘点方案允许维护参数，请先停用方案后再调整条件。
        </view>
      </view>
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#8c8c8c] leading-40rpx">
        请先保存盘点方案主表，保存后可继续查看和维护盘点参数。
      </view>
      <view class="h-180rpx" />
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
import type {
  StockTakingPlanCreateReqVO,
  StockTakingPlanVO,
} from '@/api/mes/wm/stocktaking/plan'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { createStockTakingPlan, getStockTakingPlan, updateStockTakingPlan } from '@/api/mes/wm/stocktaking/plan'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE, MesAutoCodeRuleCode, MesWmStockTakingTypeEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import PlanParamList from '../components/plan-param-list.vue'

interface StockTakingPlanFormData {
  id?: number
  code: string
  name: string
  type?: number
  startTime?: string | number | Date
  endTime?: string | number | Date
  blindFlag: boolean
  frozen: boolean
  status?: number
  remark?: string
}

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/stocktaking/plan/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const currentId = ref<number>() // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑盘点方案' : '新增盘点方案')
const formLoading = ref(false) // 表单提交状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<StockTakingPlanFormData>(getDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const stockTakingTypeOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_STOCK_TAKING_TYPE))
const isDynamicType = computed(() => formData.value.type === MesWmStockTakingTypeEnum.DYNAMIC)
const canMaintainParams = computed(() => {
  return currentId.value !== undefined && formData.value.status === CommonStatusEnum.DISABLE
})
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编码不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  type: [{ required: true, message: '盘点类型不能为空' }],
  startTime: [{ required: () => isDynamicType.value, message: '开始时间不能为空' }],
  endTime: [
    { required: () => isDynamicType.value, message: '结束时间不能为空' },
    { validator: validateEndTime },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): StockTakingPlanFormData {
  return {
    code: '',
    name: '',
    type: undefined,
    startTime: undefined,
    endTime: undefined,
    blindFlag: false,
    frozen: false,
    status: CommonStatusEnum.DISABLE,
    remark: '',
  }
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/stocktaking/plan/index')
}

/** 结束时间校验 */
function validateEndTime() {
  if (!isDynamicType.value || !formData.value.startTime || !formData.value.endTime) {
    return true
  }
  return new Date(formData.value.endTime).getTime() > new Date(formData.value.startTime).getTime()
    || '结束时间必须晚于开始时间'
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data: StockTakingPlanVO = await getStockTakingPlan(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    type: data.type,
    startTime: data.startTime,
    endTime: data.endTime,
    blindFlag: Boolean(data.blindFlag),
    frozen: Boolean(data.frozen),
    status: data.status,
    remark: data.remark || '',
  }
}

/** 初始化页面数据 */
async function initPage() {
  const oldId = currentId.value
  refreshRouteState()
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  if (oldId !== currentId.value || !formData.value.id) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 生成方案编码 */
async function handleGenerateCode() {
  if (codeLoading.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_STOCK_TAKING_PLAN_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): StockTakingPlanCreateReqVO {
  if (!formData.value.type) {
    throw new Error('盘点类型不能为空')
  }
  return {
    code: formData.value.code,
    name: formData.value.name,
    type: formData.value.type,
    startTime: isDynamicType.value ? formData.value.startTime : undefined,
    endTime: isDynamicType.value ? formData.value.endTime : undefined,
    blindFlag: formData.value.blindFlag,
    frozen: formData.value.frozen,
    remark: formData.value.remark || undefined,
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
    const data = buildSubmitData()
    if (currentId.value) {
      await updateStockTakingPlan({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createStockTakingPlan(data)
      currentId.value = id
      formData.value.id = id
      formData.value.status = CommonStatusEnum.DISABLE
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:stocktaking:plan:reload')
    await getDetail()
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.type, () => {
  if (!isDynamicType.value) {
    formData.value.startTime = undefined
    formData.value.endTime = undefined
  }
})

/** 初始化 */
onMounted(() => {
  initPage()
})

/** 页面显示时刷新 */
onShow(() => {
  initPage()
})

watch(routeId, () => {
  initPage()
})
</script>
