<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        操作步骤
      </view>
      <wd-button v-if="hasAccessByCodes(['mes:pro-process:create'])" size="small" type="primary" variant="plain" @click="openForm('create')">
        添加步骤
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx pb-24rpx text-26rpx text-[#999]">
      暂无操作步骤
    </view>
    <view v-else class="px-24rpx pb-8rpx">
      <view v-for="item in list" :key="item.id" class="mb-16rpx rounded-12rpx bg-[#f8fafc] p-20rpx">
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="text-28rpx text-[#333] font-semibold">
            步骤 {{ item.sort }}
          </view>
          <view class="flex shrink-0 gap-12rpx">
            <text v-if="hasAccessByCodes(['mes:pro-process:update'])" class="text-26rpx text-[#1677ff]" @click="openForm('update', item)">
              编辑
            </text>
            <text v-if="hasAccessByCodes(['mes:pro-process:delete'])" class="text-26rpx text-[#f56c6c]" @click="handleDelete(item)">
              删除
            </text>
          </view>
        </view>
        <view class="text-26rpx text-[#666] space-y-8rpx">
          <view>步骤说明：{{ item.content || '-' }}</view>
          <view>辅助设备：{{ item.device || '-' }}</view>
          <view>辅助材料：{{ item.material || '-' }}</view>
          <view>材料文档：{{ item.docUrl || '-' }}</view>
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
              <wd-input-number v-model="formData.sort" :min="1" :max="999" :precision="0" />
            </wd-form-item>
            <wd-form-item title="步骤说明" title-width="220rpx" prop="content">
              <wd-textarea v-model="formData.content" placeholder="请输入步骤说明" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="辅助设备" title-width="220rpx" prop="device">
              <wd-input v-model="formData.device" placeholder="请输入辅助设备" clearable />
            </wd-form-item>
            <wd-form-item title="辅助材料" title-width="220rpx" prop="material">
              <wd-input v-model="formData.material" placeholder="请输入辅助材料" clearable />
            </wd-form-item>
            <wd-form-item title="材料文档 URL" title-width="220rpx" prop="docUrl">
              <wd-input v-model="formData.docUrl" placeholder="请输入材料文档 URL" clearable />
            </wd-form-item>
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
import type {
  ProProcessContentCreateReqVO,
  ProProcessContentUpdateReqVO,
  ProProcessContentVO,
} from '@/api/mes/pro/process/content'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createProcessContent,
  deleteProcessContent,
  getProcessContentListByProcessId,
  updateProcessContent,
} from '@/api/mes/pro/process/content'
import { useAccess } from '@/hooks/useAccess'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ processId: number }>()
const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<ProProcessContentVO[]>([])
const loading = ref(false)
const formVisible = ref(false)
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const formData = ref<Partial<ProProcessContentVO>>(createDefaultFormData(props.processId, 1))
const formRef = ref<FormInstance>()
const formTitle = computed(() => formType.value === 'create' ? '添加操作步骤' : '编辑操作步骤')
const formSchema = createFormSchema({
  sort: [
    { required: true, message: '序号不能为空' },
    { validator: value => Number(value) >= 1 || '序号必须大于 0' },
  ],
})

/** 创建默认表单数据 */
function createDefaultFormData(processId: number, sort: number): Partial<ProProcessContentVO> {
  return {
    processId,
    sort,
    content: '',
    device: '',
    material: '',
    docUrl: '',
    remark: '',
  }
}

/** 查询工序内容列表 */
async function getList() {
  if (!props.processId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getProcessContentListByProcessId(props.processId)
    list.value = [...(data || [])].sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } finally {
    loading.value = false
  }
}

/** 打开新增或编辑弹层 */
function openForm(type: 'create' | 'update', row?: ProProcessContentVO) {
  formType.value = type
  const maxSort = list.value.reduce((max, item) => Math.max(max, item.sort || 0), 0)
  formData.value = row ? { ...row } : createDefaultFormData(props.processId, maxSort + 1)
  formVisible.value = true
}

/** 构造提交数据 */
function buildSubmitData(): ProProcessContentCreateReqVO | ProProcessContentUpdateReqVO {
  const data = {
    processId: props.processId,
    sort: Number(formData.value.sort),
    content: formData.value.content || undefined,
    device: formData.value.device || undefined,
    material: formData.value.material || undefined,
    docUrl: formData.value.docUrl || undefined,
    remark: formData.value.remark || undefined,
  }
  if (formType.value === 'update') {
    return { ...data, id: Number(formData.value.id) }
  }
  return data
}

/** 提交操作步骤 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (formType.value === 'update' && !formData.value.id) {
    toast.error('缺少操作步骤编号')
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (formType.value === 'create') {
      await createProcessContent(data)
      toast.success('新增成功')
    } else {
      await updateProcessContent(data)
      toast.success('修改成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除操作步骤 */
async function handleDelete(item: ProProcessContentVO) {
  if (!item.id) {
    return
  }
  try {
    await dialog.confirm({ title: '提示', msg: `确定要删除步骤 ${item.sort} 吗？` })
  } catch {
    return
  }
  await deleteProcessContent(item.id)
  toast.success('删除成功')
  await getList()
}

watch(() => props.processId, () => {
  getList()
})

onMounted(() => {
  getList()
})
</script>
