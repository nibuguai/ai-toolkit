<template>
  <MesLineListShell
    title="维修项目明细"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无维修项目明细"
    :readonly="readonly"
    @add="openCreateForm"
  >
    <view
      v-for="item in list"
      :key="item.id"
      class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
    >
      <view class="mb-12rpx flex items-center justify-between gap-16rpx">
        <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
          {{ item.subjectName || `明细 #${item.id}` }}
        </view>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">故障描述：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.malfunction || '-' }}</text>
      </view>
      <view v-if="item.malfunctionUrl" class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">故障图片：</text>
        <!-- TODO @YunaiV：图片展示改用 wd-img（width/height/mode="aspectFill"/enable-preview，去掉手写占位），对齐 AGENTS.md -->
        <image
          :src="item.malfunctionUrl"
          mode="aspectFill"
          class="h-96rpx w-96rpx rounded-8rpx"
          @click="handlePreviewImage(item.malfunctionUrl)"
        />
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">维修描述：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.description || '-' }}</text>
      </view>
      <view class="flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
      </view>
      <view v-if="!readonly" class="mt-16rpx flex rounded-8rpx bg-[#f7f8fa] text-26rpx">
        <view class="flex-1 py-16rpx text-center text-[#1677ff]" @click="openUpdateForm(item)">
          编辑
        </view>
        <view class="flex-1 py-16rpx text-center text-[#f56c6c]" @click="handleDelete(item)">
          删除
        </view>
      </view>
    </view>
  </MesLineListShell>

  <!-- 明细表单弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="formVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="维修项目" title-width="200rpx" prop="subjectId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openSubjectSelector">
                <text :class="selectedSubjectText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedSubjectText || '请选择维修项目' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="故障描述" title-width="200rpx" prop="malfunction">
              <wd-textarea v-model="formData.malfunction" placeholder="请输入故障描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="故障图片" title-width="200rpx" prop="malfunctionUrl">
              <yd-upload-img v-model="formData.malfunctionUrl" directory="mes/dv/repair" />
            </wd-form-item>
            <wd-form-item title="维修描述" title-width="200rpx" prop="description">
              <wd-textarea v-model="formData.description" placeholder="请输入维修描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <SubjectSelector ref="subjectSelectorRef" :existing-ids="existingSubjectIds" @confirm="handleSubjectConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvSubjectVO } from '@/api/mes/dv/subject'
import type {
  DvRepairLineCreateReqVO,
  DvRepairLineVO,
} from '@/api/mes/dv/repair/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import {
  createRepairLine,
  deleteRepairLine,
  getRepairLinePage,
  updateRepairLine,
} from '@/api/mes/dv/repair/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import SubjectSelector from '../../subject/components/subject-selector.vue'

interface DvRepairLineFormData extends DvRepairLineCreateReqVO {
  id?: number
}

const props = defineProps<{
  repairId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvRepairLineVO[]>([]) // 明细列表
const formVisible = ref(false) // 明细表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<DvRepairLineFormData>(getDefaultFormData()) // 表单数据
const selectedSubject = ref<DvSubjectVO>() // 当前选择维修项目
const subjectSelectorRef = ref<InstanceType<typeof SubjectSelector>>() // 项目选择器引用
const formTitle = computed(() => formData.value.id ? '编辑明细' : '添加明细')
const existingSubjectIds = computed(() => list.value
  .filter(item => item.id !== formData.value.id && item.subjectId != null)
  .map(item => item.subjectId))
const selectedSubjectText = computed(() => {
  if (!selectedSubject.value) {
    return ''
  }
  return `${selectedSubject.value.code || '-'} ${selectedSubject.value.name || ''}`.trim()
})
const formSchema = createFormSchema({
  malfunction: [{ required: true, message: '故障描述不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    repairId: props.repairId || 0,
    subjectId: undefined,
    malfunction: '',
    malfunctionUrl: '',
    description: '',
    remark: '',
  } as DvRepairLineFormData
}

/** 查询明细列表 */
async function getList() {
  if (!props.repairId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getRepairLinePage({
      pageNo: 1,
      pageSize: 100,
      repairId: props.repairId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedSubject.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: DvRepairLineVO) {
  formData.value = {
    id: item.id,
    repairId: item.repairId,
    subjectId: item.subjectId,
    malfunction: item.malfunction || '',
    malfunctionUrl: item.malfunctionUrl || '',
    description: item.description || '',
    remark: item.remark || '',
  }
  selectedSubject.value = item.subjectId
    ? {
        id: item.subjectId,
        code: '',
        name: item.subjectName || '',
        content: item.subjectContent || '',
        standard: item.subjectStandard || '',
        type: undefined,
        status: undefined,
      } as DvSubjectVO
    : undefined
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectSelector() {
  subjectSelectorRef.value?.open()
}

/** 选择维修项目 */
function handleSubjectConfirm(item: DvSubjectVO) {
  selectedSubject.value = item
  formData.value.subjectId = item.id
}

/** 预览故障图片 */
function handlePreviewImage(url: string) {
  uni.previewImage({
    urls: [url],
    current: url,
  })
}

/** 提交明细 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.repairId) {
    return
  }
  formLoading.value = true
  try {
    const data: DvRepairLineCreateReqVO = {
      repairId: props.repairId,
      subjectId: formData.value.subjectId,
      malfunction: formData.value.malfunction,
      malfunctionUrl: formData.value.malfunctionUrl || undefined,
      description: formData.value.description || undefined,
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateRepairLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createRepairLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除明细 */
async function handleDelete(item: DvRepairLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.subjectName || item.malfunction || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteRepairLine(item.id)
  toast.success('删除成功')
  await getList()
}

watch(
  () => props.repairId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
