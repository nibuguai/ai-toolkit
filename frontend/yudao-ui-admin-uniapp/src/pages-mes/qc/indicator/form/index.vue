<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="检测项编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" :maxlength="64" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="检测项名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入检测项名称" :maxlength="100" clearable />
          </wd-form-item>
          <wd-form-item title="检测项类型" title-width="220rpx" prop="type">
            <wd-radio-group v-model="formData.type" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_INDICATOR_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="检测工具" title-width="220rpx" prop="tool">
            <wd-input v-model="formData.tool" placeholder="请输入检测工具" :maxlength="100" clearable />
          </wd-form-item>
          <wd-form-item title="结果值类型" title-width="220rpx" prop="resultType">
            <wd-radio-group v-model="formData.resultType" type="button" @change="handleResultTypeChange">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_RESULT_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-if="formData.resultType === MesQcResultValueType.FILE"
            title="文件类型"
            title-width="220rpx"
            prop="resultSpecification"
          >
            <wd-radio-group v-model="formData.resultSpecification" type="button">
              <wd-radio value="IMG">
                图片/照片
              </wd-radio>
              <wd-radio value="FILE">
                文件
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item
            v-else-if="formData.resultType === MesQcResultValueType.DICT"
            title="字典类型"
            title-width="220rpx"
            prop="resultSpecification"
          >
            <view class="w-full py-8rpx text-28rpx" @click="openDictTypeSelector">
              <text :class="formData.resultSpecification ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedDictTypeName || '请选择字典类型' }}
              </text>
            </view>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="250" show-word-limit clearable />
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

    <!-- 字典类型选择器 -->
    <DictTypeSelector ref="dictTypeSelectorRef" @confirm="handleDictTypeConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { QcIndicatorCreateReqVO, QcIndicatorUpdateReqVO, QcIndicatorVO } from '@/api/mes/qc/indicator'
import type { DictType } from '@/api/system/dict/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createIndicator, getIndicator, updateIndicator } from '@/api/mes/qc/indicator'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getSimpleDictTypeList } from '@/api/system/dict/type'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import DictTypeSelector from '../components/dict-type-selector.vue'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  QC_INDICATOR_CODE: 'QC_INDICATOR_CODE',
} as const
const MesQcResultValueType = {
  FLOAT: 1,
  INTEGER: 2,
  TEXT: 3,
  DICT: 4,
  FILE: 5,
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/qc/indicator/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑质检指标' : '新增质检指标')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<QcIndicatorVO>>(getDefaultFormData()) // 表单数据
const dictTypeList = ref<DictType[]>([]) // 系统字典类型列表
const dictTypeSelectorRef = ref<InstanceType<typeof DictTypeSelector>>() // 字典类型选择器引用
const selectedDictTypeName = computed(() => {
  if (!formData.value.resultSpecification) {
    return ''
  }
  const dictType = dictTypeList.value.find(item => item.type === formData.value.resultSpecification)
  return dictType ? `${dictType.name}（${dictType.type}）` : formData.value.resultSpecification
}) // 已选字典类型名称
const formSchema = createFormSchema({
  code: [
    { required: true, message: '检测项编码不能为空' },
    { max: 64, message: '检测项编码长度不能超过 64 个字符' },
  ],
  name: [
    { required: true, message: '检测项名称不能为空' },
    { max: 100, message: '检测项名称长度不能超过 100 个字符' },
  ],
  type: [{ required: true, message: '检测项类型不能为空' }],
  resultType: [{ required: true, message: '结果值类型不能为空' }],
  resultSpecification: [{
    required: () => formData.value.resultType === MesQcResultValueType.FILE || formData.value.resultType === MesQcResultValueType.DICT,
    message: '结果值属性不能为空',
  }],
  remark: [{ max: 250, message: '备注长度不能超过 250 个字符' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 默认表单数据 */
function getDefaultFormData(): Partial<QcIndicatorVO> {
  return {
    code: '',
    name: '',
    type: undefined,
    tool: '',
    resultType: undefined,
    resultSpecification: '',
    remark: '',
  }
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/qc/indicator/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = {
    ...getDefaultFormData(),
    ...await getIndicator(currentId.value),
  }
}

/** 加载字典类型 */
async function loadDictTypes() {
  if (dictTypeList.value.length > 0) {
    return
  }
  dictTypeList.value = await getSimpleDictTypeList()
}

/** 加载页面数据 */
async function loadPageData() {
  await loadDictTypes()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 生成检测项编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.QC_INDICATOR_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 结果值类型变更 */
function handleResultTypeChange() {
  formData.value.resultSpecification = ''
}

/** 打开字典类型选择器 */
function openDictTypeSelector() {
  dictTypeSelectorRef.value?.open(formData.value.resultSpecification)
}

/** 选择字典类型 */
function handleDictTypeConfirm(item: DictType) {
  formData.value.resultSpecification = item.type
  if (!dictTypeList.value.some(dictType => dictType.type === item.type)) {
    dictTypeList.value.push(item)
  }
}

/** 构造提交数据 */
function buildSubmitData(): QcIndicatorCreateReqVO | QcIndicatorUpdateReqVO {
  const needSpecification = formData.value.resultType === MesQcResultValueType.FILE || formData.value.resultType === MesQcResultValueType.DICT
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    type: Number(formData.value.type),
    tool: formData.value.tool || undefined,
    resultType: Number(formData.value.resultType),
    resultSpecification: needSpecification ? formData.value.resultSpecification || undefined : undefined,
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
      await updateIndicator(data)
      toast.success('修改成功')
    } else {
      await createIndicator(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:qc:indicator:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
