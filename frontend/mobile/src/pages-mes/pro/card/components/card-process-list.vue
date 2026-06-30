<template>
  <view class="mx-24rpx mt-24rpx">
    <view class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        工序记录
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openForm('create')">
        新增工序
      </wd-button>
    </view>

    <view v-if="loading" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="rounded-12rpx bg-white py-40rpx text-center text-26rpx text-[#999]">
      暂无工序记录
    </view>
    <view v-else>
      <view v-for="item in list" :key="item.id" class="mb-16rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
        <view class="p-20rpx">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-28rpx text-[#333] font-semibold">
                {{ item.processName || '未选择工序' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                序号 {{ item.sort ?? '-' }}，{{ item.processCode || '-' }}
              </view>
            </view>
          </view>
          <view class="text-24rpx text-[#666] space-y-6rpx">
            <view>进入：{{ formatDateTime(item.inputTime) || '-' }}</view>
            <view>出工序：{{ formatDateTime(item.outputTime) || '-' }}</view>
            <view>数量：投入 {{ item.inputQuantity ?? '-' }}，产出 {{ item.outputQuantity ?? '-' }}，不良 {{ item.unqualifiedQuantity ?? '-' }}</view>
            <view>工位：{{ item.workstationCode || '-' }} / {{ item.workstationName || '-' }}</view>
            <view>操作人：{{ item.nickname || '-' }}</view>
            <view v-if="item.remark">
              备注：{{ item.remark }}
            </view>
          </view>
        </view>
        <view v-if="editable" class="flex border-t border-[#f3f4f6] text-26rpx">
          <view class="flex-1 py-18rpx text-center text-[#1677ff]" @click="openForm('update', item)">
            编辑
          </view>
          <view class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
            删除
          </view>
        </view>
      </view>
    </view>

    <!-- 工序记录表单 -->
    <wd-popup
      v-model="formVisible"
      position="bottom"
      safe-area-inset-bottom
      custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    >
      <view class="h-full flex flex-col bg-[#f5f5f5]">
        <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
          <wd-button variant="plain" size="small" @click="formVisible = false">
            取消
          </wd-button>
          <view class="text-32rpx text-[#333] font-semibold">
            {{ formType === 'create' ? '新增工序记录' : '编辑工序记录' }}
          </view>
          <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
            保存
          </wd-button>
        </view>
        <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
          <wd-form ref="formRef" :model="formData" :schema="formSchema">
            <wd-cell-group border>
              <wd-form-item title="序号" title-width="220rpx" prop="sort" center>
                <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
              </wd-form-item>
              <wd-form-item title="工序" title-width="220rpx" prop="processId" is-link :value="processDisplayValue" placeholder="请选择工序" @click="processPickerVisible = true" />
              <wd-form-item title="进入时间" title-width="220rpx" prop="inputTime">
                <wd-datetime-picker v-model="formData.inputTime" type="datetime" placeholder="请选择进入时间" />
              </wd-form-item>
              <wd-form-item title="出工序时间" title-width="220rpx" prop="outputTime">
                <wd-datetime-picker v-model="formData.outputTime" type="datetime" placeholder="请选择出工序时间" />
              </wd-form-item>
              <wd-form-item title="投入数量" title-width="220rpx" prop="inputQuantity" center>
                <wd-input-number v-model="formData.inputQuantity" :min="0" :precision="2" />
              </wd-form-item>
              <wd-form-item title="产出数量" title-width="220rpx" prop="outputQuantity" center>
                <wd-input-number v-model="formData.outputQuantity" :min="0" :precision="2" />
              </wd-form-item>
              <wd-form-item title="不良数量" title-width="220rpx" prop="unqualifiedQuantity" center>
                <wd-input-number v-model="formData.unqualifiedQuantity" :min="0" :precision="2" />
              </wd-form-item>
              <wd-form-item title="工位" title-width="220rpx" prop="workstationId" is-link :value="workstationDisplayValue" placeholder="请选择工位" @click="workstationPickerVisible = true" />
              <UserPicker v-model="formData.userId" label="操作人" label-width="220rpx" prop="userId" type="radio" placeholder="请选择操作人" />
              <wd-form-item title="备注" title-width="220rpx" prop="remark">
                <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="300" show-word-limit clearable />
              </wd-form-item>
            </wd-cell-group>
          </wd-form>
          <view class="h-60rpx" />
        </scroll-view>
      </view>
    </wd-popup>

    <wd-picker v-model:visible="processPickerVisible" :model-value="processPickerValue" title="选择工序" :columns="processOptions" label-key="displayName" value-key="id" @confirm="handleProcessConfirm" />
    <wd-picker v-model:visible="workstationPickerVisible" :model-value="workstationPickerValue" title="选择工位" :columns="workstationOptions" label-key="displayName" value-key="id" @confirm="handleWorkstationConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ProCardProcessCreateReqVO, ProCardProcessUpdateReqVO, ProCardProcessVO } from '@/api/mes/pro/card/process'
import type { ProProcessVO } from '@/api/mes/pro/process'
import type { MdWorkstationVO } from '@/api/mes/md/workstation'
import UserPicker from '@/components/system-select/user-picker.vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { getWorkstationPage } from '@/api/mes/md/workstation'
import { createCardProcess, deleteCardProcess, getCardProcessPage, updateCardProcess } from '@/api/mes/pro/card/process'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import { CommonStatusEnum } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'
import type { WotPickerValue } from '@/utils/wot'

interface ProcessOption extends ProProcessVO {
  id: number
  displayName: string
}

interface WorkstationOption extends MdWorkstationVO {
  displayName: string
}

interface ProcessFormData {
  id?: number
  cardId: number
  sort?: number
  processId?: number
  inputTime?: number | string
  outputTime?: number | string
  inputQuantity?: number
  outputQuantity?: number
  unqualifiedQuantity?: number
  workstationId?: number
  userId?: number
  remark: string
}

const props = defineProps<{
  cardId: number
  editable?: boolean
}>()

const emit = defineEmits<{
  changed: []
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<ProCardProcessVO[]>([]) // 工序记录列表
const formVisible = ref(false) // 表单弹层
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create')
const formRef = ref<FormInstance>() // 表单组件引用
const processPickerVisible = ref(false) // 工序选择显示状态
const workstationPickerVisible = ref(false) // 工位选择显示状态
const processOptions = ref<ProcessOption[]>([]) // 工序选项
const workstationOptions = ref<WorkstationOption[]>([]) // 工位选项
const formData = ref<ProcessFormData>({
  cardId: props.cardId,
  remark: '',
})
const formSchema = createFormSchema({
  sort: [{ required: true, message: '序号不能为空' }],
  inputTime: [
    {
      validator: (value, model) => {
        if (!value || !model.outputTime) {
          return true
        }
        return new Date(String(value)).getTime() <= new Date(String(model.outputTime)).getTime() || '进入时间不能晚于出工序时间'
      },
    },
  ],
  outputQuantity: [
    {
      validator: (value, model) => {
        if (value === undefined || value === null || model.inputQuantity === undefined || model.inputQuantity === null) {
          return true
        }
        return Number(value) <= Number(model.inputQuantity) || '产出数量不能大于投入数量'
      },
    },
  ],
  unqualifiedQuantity: [
    {
      validator: (value, model) => {
        if (value === undefined || value === null || model.outputQuantity === undefined || model.outputQuantity === null) {
          return true
        }
        return Number(value) <= Number(model.outputQuantity) || '不良数量不能大于产出数量'
      },
    },
  ],
})
const processPickerValue = computed(() => formData.value.processId === undefined ? [] : [formData.value.processId])
const workstationPickerValue = computed(() => formData.value.workstationId === undefined ? [] : [formData.value.workstationId])
const processDisplayValue = computed(() => {
  const process = processOptions.value.find(item => item.id === formData.value.processId)
  return process?.displayName || ''
})
const workstationDisplayValue = computed(() => {
  const workstation = workstationOptions.value.find(item => item.id === formData.value.workstationId)
  return workstation?.displayName || ''
})

/** 查询工序记录 */
async function getList() {
  loading.value = true
  try {
    const data = await getCardProcessPage({
      cardId: props.cardId,
      pageNo: 1,
      pageSize: 100,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 加载选择器选项 */
async function loadOptions() {
  const [processes, workstations] = await Promise.all([
    getProcessSimpleList(),
    getWorkstationPage({ pageNo: 1, pageSize: 100, status: CommonStatusEnum.ENABLE }),
  ])
  processOptions.value = (processes || [])
    .filter(item => item.id !== undefined)
    .map(item => ({ ...item, id: Number(item.id), displayName: `${item.name || '-'} (${item.code || '-'})` }))
  workstationOptions.value = workstations.list.map(item => ({
    ...item,
    displayName: `${item.name || '-'} (${item.code || '-'})`,
  }))
}

/** 打开新增或编辑表单 */
function openForm(type: 'create' | 'update', row?: ProCardProcessVO) {
  formType.value = type
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formData.value = row
    ? {
        id: row.id,
        cardId: row.cardId,
        sort: row.sort,
        processId: row.processId,
        inputTime: row.inputTime,
        outputTime: row.outputTime,
        inputQuantity: row.inputQuantity,
        outputQuantity: row.outputQuantity,
        unqualifiedQuantity: row.unqualifiedQuantity,
        workstationId: row.workstationId,
        userId: row.userId,
        remark: row.remark || '',
      }
    : {
        cardId: props.cardId,
        sort: maxSort + 1,
        inputQuantity: 0,
        outputQuantity: 0,
        unqualifiedQuantity: 0,
        remark: '',
      }
  formVisible.value = true
  // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
  setTimeout(() => formRef.value?.reset(), 0)
}

/** 选择工序 */
function handleProcessConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.processId = Number(value[0])
}

/** 选择工位 */
function handleWorkstationConfirm({ value }: { value: WotPickerValue[] }) {
  formData.value.workstationId = Number(value[0])
}

/** 构造提交数据 */
function buildSubmitData(): ProCardProcessCreateReqVO | ProCardProcessUpdateReqVO {
  const data = {
    cardId: props.cardId,
    sort: formData.value.sort,
    processId: formData.value.processId,
    inputTime: formData.value.inputTime,
    outputTime: formData.value.outputTime,
    inputQuantity: formData.value.inputQuantity,
    outputQuantity: formData.value.outputQuantity,
    unqualifiedQuantity: formData.value.unqualifiedQuantity,
    workstationId: formData.value.workstationId,
    userId: formData.value.userId,
    remark: formData.value.remark || undefined,
  }
  if (formType.value === 'update' && formData.value.id) {
    return { ...data, id: formData.value.id }
  }
  return data
}

/** 提交工序记录 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await createCardProcess(data)
      toast.success('新增成功')
    } else {
      await updateCardProcess(data)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
    emit('changed')
  } finally {
    formLoading.value = false
  }
}

/** 删除工序记录 */
async function handleDelete(item: ProCardProcessVO) {
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除「${item.processName || item.processCode || item.sort}」工序记录吗？` })
  } catch {
    return
  }
  await deleteCardProcess(item.id)
  toast.success('删除成功')
  await getList()
  emit('changed')
}

onMounted(() => {
  loadOptions()
  getList()
})

defineExpose({ getList })
</script>
