<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        组成工序
      </view>
      <wd-button v-if="editable" size="small" type="primary" variant="plain" @click="openForm('create')">
        添加工序
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      暂无组成工序
    </view>
    <view v-else class="px-24rpx pb-8rpx">
      <view v-for="item in list" :key="item.id" class="mb-16rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="truncate text-30rpx text-[#333] font-semibold">
              {{ item.sort }}. {{ item.processName || '-' }}
            </view>
            <view class="mt-4rpx text-24rpx text-[#999]">
              {{ item.processCode || '-' }}
            </view>
          </view>
          <view class="flex shrink-0 gap-12rpx">
            <text v-if="editable" class="text-26rpx text-[#1677ff]" @click="openForm('update', item)">
              编辑
            </text>
            <text v-if="editable" class="text-26rpx text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </text>
          </view>
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>下一道工序：{{ item.nextProcessName || '-' }}</view>
          <view>
            与下道关系：
            <dict-tag v-if="item.linkType != null" :type="DICT_TYPE.MES_PRO_LINK_TYPE" :value="item.linkType" />
            <text v-else>-</text>
          </view>
          <view class="flex gap-24rpx">
            <view>
              关键工序：<dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="normalizeBoolean(item.keyFlag)" />
            </view>
            <view>
              质检确认：<dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="normalizeBoolean(item.checkFlag)" />
            </view>
          </view>
          <view>准备/等待：{{ item.prepareTime ?? 0 }} / {{ item.waitTime ?? 0 }} 分钟</view>
          <view class="flex items-center gap-8rpx">
            <text>甘特图颜色：</text>
            <view v-if="item.colorCode" class="h-24rpx w-40rpx rounded-4rpx" :style="{ backgroundColor: item.colorCode }" />
            <text>{{ item.colorCode || '-' }}</text>
          </view>
          <view v-if="item.remark">
            备注：{{ item.remark }}
          </view>
        </view>
      </view>
    </view>
  </view>

  <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 86vh;">
    <view class="max-h-[86vh] flex flex-col bg-white">
      <view class="flex items-center justify-between border-b border-[#f0f0f0] px-24rpx py-20rpx">
        <text class="text-32rpx text-[#333] font-semibold">{{ formTitle }}</text>
        <wd-icon name="close" size="36rpx" @click="formVisible = false" />
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="序号" title-width="220rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="1" :precision="0" />
            </wd-form-item>
            <wd-form-item title="工序" title-width="220rpx" prop="processId" is-link :value="processDisplayValue" placeholder="请选择工序" @click="processPickerVisible = true" />
            <wd-picker v-model:visible="processPickerVisible" :model-value="formData.processId !== undefined ? [formData.processId] : []" :columns="processOptions" label-key="displayName" value-key="id" @confirm="handleProcessConfirm" />
            <wd-form-item title="下一道工序" title-width="220rpx" prop="nextProcessId" is-link :value="nextProcessDisplayValue" placeholder="请选择下一道工序" @click="nextProcessPickerVisible = true" />
            <wd-picker v-model:visible="nextProcessPickerVisible" :model-value="formData.nextProcessId !== undefined ? [formData.nextProcessId] : []" :columns="nextProcessOptions" label-key="displayName" value-key="id" @confirm="handleNextProcessConfirm" />
            <view v-if="formData.nextProcessId != null" class="px-24rpx pb-16rpx text-right">
              <text class="text-26rpx text-[#1677ff]" @click="clearNextProcess">
                清空下一道工序
              </text>
            </view>
            <wd-form-item title="与下道关系" title-width="220rpx" prop="linkType">
              <wd-radio-group v-model="formData.linkType" type="button">
                <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_PRO_LINK_TYPE)" :key="dict.value" :value="dict.value">
                  {{ dict.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-cell title="关键工序" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.keyFlag" />
              </view>
            </wd-cell>
            <wd-cell title="质检确认" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.checkFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="准备时间" title-width="220rpx" prop="prepareTime" center>
              <view class="flex items-center gap-12rpx">
                <wd-input-number v-model="formData.prepareTime" :min="0" :precision="0" />
                <text class="text-26rpx text-[#999]">分钟</text>
              </view>
            </wd-form-item>
            <wd-form-item title="等待时间" title-width="220rpx" prop="waitTime" center>
              <view class="flex items-center gap-12rpx">
                <wd-input-number v-model="formData.waitTime" :min="0" :precision="0" />
                <text class="text-26rpx text-[#999]">分钟</text>
              </view>
            </wd-form-item>
            <wd-form-item title="甘特图颜色" title-width="220rpx" prop="colorCode">
              <wd-input v-model="formData.colorCode" placeholder="请输入颜色，如 #00AEF3" clearable />
            </wd-form-item>
            <view class="flex flex-wrap gap-12rpx px-24rpx pb-20rpx">
              <view v-for="color in colorOptions" :key="color" class="h-44rpx w-64rpx border-2rpx rounded-8rpx" :class="formData.colorCode === color ? 'border-[#1677ff]' : 'border-transparent'" :style="{ backgroundColor: color }" @click="formData.colorCode = color" />
            </view>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="h-120rpx" />
      </scroll-view>
      <view class="p-24rpx">
        <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProProcessVO } from '@/api/mes/pro/process'
import type {
  ProRouteProcessCreateReqVO,
  ProRouteProcessUpdateReqVO,
  ProRouteProcessVO,
} from '@/api/mes/pro/route/process'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import {
  createRouteProcess,
  deleteRouteProcess,
  getRouteProcessListByRoute,
  updateRouteProcess,
} from '@/api/mes/pro/route/process'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import type { WotPickerValue } from '@/utils/wot'

interface ProcessOption extends ProProcessVO {
  displayName: string // picker 展示名称
}

const props = defineProps<{
  editable: boolean
  routeId: number
}>()
const emit = defineEmits<{ changed: [] }>()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProRouteProcessVO[]>([])
const loading = ref(false)
const processOptions = ref<ProcessOption[]>([])
const formVisible = ref(false)
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formData = ref<Partial<ProRouteProcessVO>>(createDefaultFormData(props.routeId, 1))
const formRef = ref<FormInstance>()
const processPickerVisible = ref(false)
const nextProcessPickerVisible = ref(false)
const colorOptions = ['#00AEF3', '#67C23A', '#E6A23C', '#F56C6C', '#909399'] // 甘特图预设色
const formTitle = computed(() => formType.value === 'create' ? '添加工序' : '编辑工序')
const processDisplayValue = computed(() => getWotPickerFormValue(processOptions.value, formData.value.processId, {
  labelKey: 'displayName',
  valueKey: 'id',
}))
const nextProcessOptions = computed(() => processOptions.value.filter(item => item.id !== formData.value.processId))
const nextProcessDisplayValue = computed(() => getWotPickerFormValue(nextProcessOptions.value, formData.value.nextProcessId, {
  labelKey: 'displayName',
  valueKey: 'id',
}))
const formSchema = createFormSchema({
  sort: [
    { required: true, message: '序号不能为空' },
    { validator: value => Number(value) >= 1 || '序号必须大于 0' },
  ],
  processId: [{ required: true, message: '工序不能为空' }],
  linkType: [{ required: true, message: '工序关系不能为空' }],
  keyFlag: [{ required: true, message: '是否关键工序不能为空' }],
  checkFlag: [{ required: true, message: '是否需要质检确认不能为空' }],
  colorCode: [{ pattern: /^#[0-9a-f]{6}$/i, message: '颜色格式应为 #RRGGBB' }],
})

/** 创建默认表单数据 */
function createDefaultFormData(routeId: number, sort: number): Partial<ProRouteProcessVO> {
  return {
    routeId,
    sort,
    processId: undefined,
    nextProcessId: undefined,
    linkType: 3,
    colorCode: '#00AEF3',
    keyFlag: false,
    checkFlag: false,
    prepareTime: 0,
    waitTime: 0,
    remark: '',
  }
}

/** 归一化布尔显示值 */
function normalizeBoolean(value?: boolean | number) {
  return `${value === true || value === 1}`
}

/** 加载路线工序列表 */
async function getList() {
  if (!props.routeId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getRouteProcessListByRoute(props.routeId)
    list.value = [...(data || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } finally {
    loading.value = false
  }
}

/** 加载生产工序选项 */
async function loadProcessOptions() {
  const data = await getProcessSimpleList()
  processOptions.value = (data || []).map(item => ({
    ...item,
    displayName: `${item.name || '-'} (${item.code || '-'})`,
  }))
}

/** 打开新增或编辑弹层 */
function openForm(type: 'create' | 'update', row?: ProRouteProcessVO) {
  formType.value = type
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formData.value = row
    ? { ...row, keyFlag: normalizeBoolean(row.keyFlag) === 'true', checkFlag: normalizeBoolean(row.checkFlag) === 'true' }
    : createDefaultFormData(props.routeId, maxSort + 1)
  formVisible.value = true
  // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
  setTimeout(() => formRef.value?.reset(), 0)
}

/** 选择工序 */
function handleProcessConfirm({ value }: { value: WotPickerValue[] }) {
  const processId = value[0]
  formData.value.processId = Number(processId)
  if (formData.value.nextProcessId === Number(processId)) {
    formData.value.nextProcessId = undefined
  }
}

/** 选择下一道工序 */
function handleNextProcessConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.nextProcessId = Number(value[0])
}

/** 清空下一道工序 */
function clearNextProcess() {
  formData.value.nextProcessId = undefined
}

/** 构造提交数据 */
function buildSubmitData(): ProRouteProcessCreateReqVO | ProRouteProcessUpdateReqVO {
  const data = {
    routeId: props.routeId,
    processId: Number(formData.value.processId),
    sort: Number(formData.value.sort),
    nextProcessId: formData.value.nextProcessId == null ? undefined : Number(formData.value.nextProcessId),
    linkType: Number(formData.value.linkType),
    prepareTime: Number(formData.value.prepareTime || 0),
    waitTime: Number(formData.value.waitTime || 0),
    colorCode: formData.value.colorCode || undefined,
    keyFlag: normalizeBoolean(formData.value.keyFlag) === 'true',
    checkFlag: normalizeBoolean(formData.value.checkFlag) === 'true',
    remark: formData.value.remark || undefined,
  }
  if (formType.value === 'update') {
    return { ...data, id: Number(formData.value.id) }
  }
  return data
}

/** 提交路线工序 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (formType.value === 'update' && !formData.value.id) {
    toast.error('缺少路线工序编号')
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await createRouteProcess(data)
      toast.success('新增成功')
    } else {
      await updateRouteProcess(data)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 删除路线工序 */
async function handleDelete(item: ProRouteProcessVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.processName || item.processCode || item.sort}」工序吗？` })
  } catch {
    return
  }
  await deleteRouteProcess(item.id)
  toast.success('删除成功')
  await getList()
  emit('changed')
}

watch(() => props.routeId, () => {
  getList()
})

onMounted(async () => {
  await Promise.all([loadProcessOptions(), getList()])
})

defineExpose({ reload: getList })
</script>
