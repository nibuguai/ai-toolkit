<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="方案编码" title-width="200rpx" prop="code">
            <wd-input
              v-model="formData.code"
              clearable
              placeholder="请输入或点击生成"
            >
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="方案名称" title-width="200rpx" prop="name">
            <wd-input
              v-model="formData.name"
              clearable
              placeholder="请输入方案名称"
            />
          </wd-form-item>
          <wd-form-item title="方案类型" title-width="200rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_SUBJECT_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.startDate"
            type="date"
            label="开始日期"
            label-width="200rpx"
            prop="startDate"
          />
          <wd-datetime-picker
            v-model="formData.endDate"
            type="date"
            label="结束日期"
            label-width="200rpx"
            prop="endDate"
          />
          <wd-form-item title="周期类型" title-width="200rpx" prop="cycleType">
            <wd-radio-group v-model="formData.cycleType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_CYCLE_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="周期数量" title-width="200rpx" prop="cycleCount" center>
            <wd-input-number v-model="formData.cycleCount" :min="1" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status">
            <dict-tag :type="DICT_TYPE.MES_DV_CHECK_PLAN_STATUS" :value="formData.status" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
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
      <view v-if="currentId" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#e6f4ff] px-24rpx py-18rpx text-26rpx text-[#0958d9]">
        草稿方案可维护关联设备和保养项目；保存关联会立即写入，请谨慎操作。
      </view>
      <MachineryList v-if="currentId" :plan-id="currentId" />
      <SubjectList v-if="currentId" :plan-id="currentId" />
    </view>

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
import type { DvCheckPlanCreateReqVO } from '@/api/mes/dv/checkplan'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createCheckPlan, getCheckPlan, updateCheckPlan } from '@/api/mes/dv/checkplan'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesDvCheckPlanStatusEnum } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MachineryList from '../components/machinery-list.vue'
import SubjectList from '../components/subject-list.vue'

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
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/checkplan/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前编辑编号
const getTitle = computed(() => currentId.value ? '编辑点检方案' : '新增点检方案')
const formLoading = ref(false) // 表单提交状态
interface DvCheckPlanFormData extends DvCheckPlanCreateReqVO {
  id?: number
}
const formData = ref<DvCheckPlanFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '方案编码不能为空' }],
  name: [{ required: true, message: '方案名称不能为空' }],
  type: [{ required: true, message: '方案类型不能为空' }],
  cycleType: [{ required: true, message: '周期类型不能为空' }],
  cycleCount: [{ required: true, message: '周期数量不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    code: '',
    name: '',
    type: undefined,
    startDate: undefined,
    endDate: undefined,
    cycleType: undefined,
    cycleCount: 1,
    status: MesDvCheckPlanStatusEnum.PREPARE,
    remark: '',
  } as DvCheckPlanFormData
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/dv/checkplan/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getCheckPlan(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    type: data.type,
    startDate: data.startDate || undefined,
    endDate: data.endDate || undefined,
    cycleType: data.cycleType,
    cycleCount: data.cycleCount,
    status: data.status,
    remark: data.remark || '',
  }
}

/** 初始化页面数据 */
async function initPage() {
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  if (!formData.value.id || formData.value.id !== currentId.value) {
    formData.value = getDefaultFormData()
    await getDetail()
  }
}

/** 生成方案编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.DV_CHECK_PLAN_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
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
    const data: DvCheckPlanCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name,
      type: formData.value.type,
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      cycleType: formData.value.cycleType,
      cycleCount: formData.value.cycleCount,
      status: formData.value.status,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      await updateCheckPlan({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createCheckPlan(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:checkplan:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
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
