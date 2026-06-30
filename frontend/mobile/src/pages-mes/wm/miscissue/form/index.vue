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
          <wd-form-item title="出库单编号" title-width="200rpx" prop="code">
            <view class="flex items-center gap-16rpx">
              <wd-input
                v-model="formData.code"
                class="min-w-0 flex-1"
                clearable
                :disabled="isHeaderReadonly"
                placeholder="请输入出库单编号"
              />
              <wd-button v-if="!isHeaderReadonly" size="small" type="primary" :loading="codeLoading" @click="handleGenerateCode">
                生成
              </wd-button>
            </view>
          </wd-form-item>
          <wd-form-item title="出库单名称" title-width="200rpx" prop="name">
            <wd-input v-model="formData.name" clearable :disabled="isHeaderReadonly" placeholder="请输入出库单名称" />
          </wd-form-item>
          <wd-form-item title="业务类型" title-width="200rpx" prop="type">
            <wd-radio-group v-model="formData.type" :disabled="isHeaderReadonly" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_MISC_ISSUE_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="出库日期" title-width="200rpx" prop="issueDate">
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openIssueDatePicker">
              <text :class="formatDateTime(formData.issueDate) ? 'text-[#333]' : 'text-[#999]'">
                {{ formatDateTime(formData.issueDate) || '请选择出库日期' }}
              </text>
              <wd-icon v-if="!isHeaderReadonly" name="arrow-right" size="28rpx" color="#999" />
            </view>
          </wd-form-item>
          <wd-datetime-picker
            v-model="formData.issueDate"
            v-model:visible="pickerVisible.issueDate"
            title="请选择出库日期"
            type="date"
          />
          <wd-form-item title="来源单据类型" title-width="200rpx" prop="sourceDocType">
            <wd-input v-model="formData.sourceDocType" clearable :disabled="isHeaderReadonly" placeholder="请输入来源单据类型" />
          </wd-form-item>
          <wd-form-item title="来源单据编号" title-width="200rpx" prop="sourceDocCode">
            <wd-input v-model="formData.sourceDocCode" clearable :disabled="isHeaderReadonly" placeholder="请输入来源单据编号" />
          </wd-form-item>
          <wd-form-item v-if="currentId" title="单据状态" title-width="200rpx">
            <dict-tag v-if="formData.status != null" :type="DICT_TYPE.MES_WM_MISC_ISSUE_STATUS" :value="formData.status" />
            <text v-else>-</text>
          </wd-form-item>
          <wd-form-item title="备注" title-width="200rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :disabled="isHeaderReadonly"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <MiscIssueLineList v-if="currentId" :issue-id="currentId" :readonly="!isEditable" />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-white p-24rpx text-26rpx text-[#8c8c8c] leading-40rpx">
        保存主表后，可继续维护出库物料。
      </view>

      <view v-if="isFinish" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#f6ffed] p-24rpx text-26rpx text-[#389e0d] leading-42rpx">
        执行出库会扣减库存台账；H5 验证仅打开确认框并取消，不确认真实出库。
      </view>
      <view class="h-180rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions content-class="flex gap-24rpx text-28rpx">
      <view
        v-if="isEditable"
        class="flex-1 rounded-8rpx bg-[#1677ff] py-20rpx text-center text-white"
        :class="formLoading ? 'opacity-60' : ''"
        @click="handleSubmit"
      >
        {{ formLoading ? '保存中...' : '保存' }}
      </view>
      <view
        v-if="canSubmit"
        class="flex-1 rounded-8rpx bg-[#faad14] py-20rpx text-center text-white"
        :class="submitLoading ? 'opacity-60' : ''"
        @click="handleSubmitIssue"
      >
        {{ submitLoading ? '提交中...' : '提交' }}
      </view>
      <view
        v-if="isFinish"
        class="flex-1 rounded-8rpx bg-[#52c41a] py-20rpx text-center text-white"
        :class="finishLoading ? 'opacity-60' : ''"
        @click="handleFinishIssue"
      >
        {{ finishLoading ? '出库中...' : '执行出库' }}
      </view>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { WmMiscIssueCreateReqVO } from '@/api/mes/wm/miscissue'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import {
  createMiscIssue,
  finishMiscIssue,
  getMiscIssue,
  submitMiscIssue,
  updateMiscIssue,
} from '@/api/mes/wm/miscissue'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE, MesAutoCodeRuleCode, MesWmMiscIssueStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import MiscIssueLineList from '../components/misc-issue-line-list.vue'

interface WmMiscIssueFormData {
  id?: number
  code: string
  name: string
  type?: number
  sourceDocType?: string
  sourceDocId?: number
  sourceDocCode?: string
  issueDate?: string | number | Date
  status?: number
  remark?: string
  createTime?: string | Date
}

const props = defineProps<{
  id?: number | string
  mode?: 'finish' | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const dialog = useDialog()
const toast = useToast()
const { getRouteQueryNumber, getRouteQueryValue } = useRouteQuery(props, '/pages-mes/wm/miscissue/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 路由编号
const routeMode = computed(() => String(getRouteQueryValue('mode') || '')) // 路由模式
const currentId = ref<number>() // 当前编辑编号
const currentMode = ref<string>() // 当前操作模式
const getTitle = computed(() => {
  if (currentMode.value === 'finish') {
    return '执行杂项出库'
  }
  return currentId.value ? '编辑杂项出库' : '新增杂项出库'
})
const formLoading = ref(false) // 表单提交状态
const submitLoading = ref(false) // 提交状态
const finishLoading = ref(false) // 执行出库状态
const codeLoading = ref(false) // 编码生成状态
const formData = ref<WmMiscIssueFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '出库单编号不能为空' }],
  name: [{ required: true, message: '出库单名称不能为空' }],
  type: [{ required: true, message: '业务类型不能为空' }],
  issueDate: [{ required: true, message: '出库日期不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const pickerVisible = ref<Record<string, boolean>>({}) // 日期选择器显示状态
const isFinish = computed(() => currentMode.value === 'finish' && formData.value.status === MesWmMiscIssueStatusEnum.APPROVED)
const isEditable = computed(() => !currentMode.value || currentMode.value === 'update')
const isHeaderReadonly = computed(() => isFinish.value)
const canSubmit = computed(() => (
  isEditable.value
  && currentId.value
  && formData.value.status === MesWmMiscIssueStatusEnum.PREPARE
))

/** 默认表单数据 */
function getDefaultFormData(): WmMiscIssueFormData {
  return {
    code: '',
    name: '',
    type: undefined,
    sourceDocType: '',
    sourceDocCode: '',
    issueDate: '',
    remark: '',
  }
}

/** 刷新当前路由参数 */
function refreshRouteState() {
  currentId.value = routeId.value
  currentMode.value = routeMode.value
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/miscissue/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getMiscIssue(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code || '',
    name: data.name || '',
    type: data.type,
    sourceDocType: data.sourceDocType || '',
    sourceDocId: data.sourceDocId,
    sourceDocCode: data.sourceDocCode || '',
    issueDate: data.issueDate,
    status: data.status,
    remark: data.remark || '',
    createTime: data.createTime,
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

/** 打开出库日期选择 */
function openIssueDatePicker() {
  if (isHeaderReadonly.value) {
    return
  }
  pickerVisible.value.issueDate = true
}

/** 生成出库单编号 */
async function handleGenerateCode() {
  if (codeLoading.value || isHeaderReadonly.value) {
    return
  }
  codeLoading.value = true
  try {
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.WM_MISC_ISSUE_CODE)
  } finally {
    codeLoading.value = false
  }
}

/** 构造提交数据 */
function buildSubmitData(): WmMiscIssueCreateReqVO {
  if (formData.value.type == null || !formData.value.issueDate) {
    throw new Error('业务类型和出库日期不能为空')
  }
  return {
    code: formData.value.code,
    name: formData.value.name,
    type: formData.value.type,
    sourceDocType: formData.value.sourceDocType || undefined,
    sourceDocId: formData.value.sourceDocId,
    sourceDocCode: formData.value.sourceDocCode || undefined,
    issueDate: formData.value.issueDate,
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
      await updateMiscIssue({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      const id = await createMiscIssue(data)
      toast.success('新增成功')
      currentId.value = id
      formData.value.id = id
      formData.value.status = MesWmMiscIssueStatusEnum.PREPARE
    }
    uni.$emit('mes:wm:miscissue:reload')
  } finally {
    formLoading.value = false
  }
}

/** 提交杂项出库单 */
async function handleSubmitIssue() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认提交该杂项出库单？提交前请确认已维护出库物料，提交后将不能修改。',
    })
  } catch {
    return
  }
  submitLoading.value = true
  try {
    await updateMiscIssue({ ...buildSubmitData(), id: currentId.value })
    await submitMiscIssue(currentId.value)
    toast.success('提交成功')
    uni.$emit('mes:wm:miscissue:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    submitLoading.value = false
  }
}

/** 执行出库 */
async function handleFinishIssue() {
  if (!currentId.value) {
    return
  }
  try {
    await dialog.confirm({
      title: '提示',
      msg: '确认执行出库？执行后将更新库存台账。',
    })
  } catch {
    return
  }
  finishLoading.value = true
  try {
    await finishMiscIssue(currentId.value)
    toast.success('出库成功')
    uni.$emit('mes:wm:miscissue:reload')
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    finishLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  initPage()
})

onShow(() => {
  initPage()
})

watch([routeId, routeMode], () => {
  initPage()
})
</script>
