<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="产品 SOP" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <!-- 顶部操作 -->
      <view class="flex justify-end bg-white px-24rpx py-16rpx">
        <wd-button size="small" variant="plain" :loading="loading" @click="loadList">
          刷新
        </wd-button>
      </view>

      <view v-if="loading" class="py-100rpx text-center">
        <wd-loading />
        <view class="mt-16rpx text-28rpx text-[#999]">
          加载中...
        </view>
      </view>

      <template v-else>
        <!-- SOP 卡片列表 -->
        <view class="p-24rpx">
          <view v-for="sop in list" :key="sop.id" class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm">
            <view class="h-320rpx bg-[#f5f7fa]" @click="handlePreview(sop.url)">
              <!-- TODO @YunaiV：图片展示改用 wd-img（width/height/mode="aspectFill"/enable-preview，去掉手写占位），对齐 AGENTS.md -->
              <image v-if="sop.url" :src="sop.url" mode="aspectFill" class="h-full w-full" />
              <view v-else class="h-full flex items-center justify-center">
                <wd-icon name="picture" size="64rpx" color="#c0c4cc" />
              </view>
            </view>
            <view class="p-24rpx">
              <view class="mb-12rpx truncate text-30rpx text-[#333] font-semibold">
                {{ sop.title }}
              </view>
              <view class="text-26rpx text-[#666] space-y-8rpx">
                <view>展示顺序：{{ sop.sort }}</view>
                <view>所属工序：{{ getProcessLabel(sop) }}</view>
                <view v-if="sop.description">
                  内容说明：{{ sop.description }}
                </view>
                <view v-if="sop.remark">
                  备注：{{ sop.remark }}
                </view>
                <view>创建时间：{{ formatDateTime(sop.createTime) || '-' }}</view>
              </view>
              <view v-if="isEdit" class="mt-16rpx flex justify-end gap-16rpx">
                <wd-button v-if="canUpdate" size="small" variant="plain" @click="openForm('update', sop)">
                  编辑
                </wd-button>
                <wd-button v-if="canDelete" size="small" type="danger" variant="plain" :loading="deletingId === sop.id" :disabled="deletingId !== undefined" @click="handleDelete(sop)">
                  删除
                </wd-button>
              </view>
            </view>
          </view>

          <view v-if="list.length === 0" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无 SOP 数据" />
          </view>
        </view>
      </template>

      <view class="h-160rpx" />
    </scroll-view>

    <!-- 添加按钮 -->
    <MesFooterActions v-if="isEdit && canCreate">
      <wd-button type="primary" block @click="openForm('create')">
        添加 SOP
      </wd-button>
    </MesFooterActions>

    <!-- 新增/编辑弹层 -->
    <wd-popup v-model="formVisible" position="bottom" safe-area-inset-bottom custom-style="border-radius: 24rpx 24rpx 0 0; max-height: 85vh;">
      <scroll-view scroll-y class="bg-white px-24rpx pb-40rpx pt-32rpx" style="max-height: 85vh;">
        <view class="mb-32rpx text-center text-32rpx text-[#333] font-semibold">
          {{ formType === 'create' ? '新增 SOP' : '编辑 SOP' }}
        </view>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="标题" title-width="180rpx" prop="title">
              <wd-input v-model="formData.title" placeholder="请输入标题" clearable />
            </wd-form-item>
            <wd-form-item title="展示顺序" title-width="180rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
            </wd-form-item>
            <wd-form-item title="所属工序" title-width="180rpx">
              <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
                <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="processDisplayValue ? 'text-[#333]' : 'text-[#999]'" @click="processPickerVisible = true">
                  {{ processDisplayValue || '请选择工序' }}
                </view>
                <wd-button v-if="formData.processId !== undefined" size="small" variant="plain" @click.stop="clearProcess">
                  清空
                </wd-button>
              </view>
            </wd-form-item>
            <wd-picker v-model:visible="processPickerVisible" :model-value="processPickerValue" :columns="processOptions" label-key="label" value-key="id" @confirm="handleProcessConfirm" />
            <wd-form-item title="内容说明" title-width="180rpx" prop="description">
              <wd-textarea v-model="formData.description" placeholder="请输入详细描述" :maxlength="500" show-word-limit clearable />
            </wd-form-item>
            <wd-form-item title="图片" title-width="180rpx" prop="url">
              <yd-upload-img v-model="formData.url" directory="mes/md/product-sop" />
            </wd-form-item>
            <wd-form-item title="备注" title-width="180rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
        <view class="mt-40rpx flex gap-24rpx">
          <wd-button class="flex-1" variant="plain" @click="formVisible = false">
            取消
          </wd-button>
          <wd-button class="flex-1" type="primary" :loading="formLoading" @click="submitForm">
            确定
          </wd-button>
        </view>
      </scroll-view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import type { MdProductSopCreateReqVO, MdProductSopVO } from '@/api/mes/md/item/productSop'
import type { ProProcessVO } from '@/api/mes/pro/process'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createProductSop, deleteProductSop, getProductSopListByItemId, updateProductSop } from '@/api/mes/md/item/productSop'
import { getProcessSimpleList } from '@/api/mes/pro/process'
import { useAccess } from '@/hooks/useAccess'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { formatDateTime } from '@/utils/date'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ itemId?: number | string, mode?: string }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const { hasAccessByCodes } = useAccess()
const isEdit = computed(() => props.mode === 'edit')
const canCreate = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:create']))
const canUpdate = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:update']))
const canDelete = computed(() => isEdit.value && hasAccessByCodes(['mes:md-item:delete']))
const list = ref<MdProductSopVO[]>([]) // SOP 列表
const loading = ref(false) // 列表加载状态
const deletingId = ref<number>() // 正在删除的 SOP 编号

const processOptions = ref<{ id: number, label: string }[]>([]) // 工序选项
const processMap = ref<Map<number, { code: string, name: string }>>(new Map()) // 工序展示映射

const formVisible = ref(false) // 表单弹层状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<MdProductSopCreateReqVO & { id?: number }>({
  itemId: 0,
  sort: 0,
  title: '',
  processId: undefined,
  description: '',
  url: '',
  remark: '',
}) // 表单数据
const formSchema = createFormSchema({
  title: [{ required: true, message: '标题不能为空' }],
  sort: [{ required: true, message: '展示顺序不能为空' }],
})
const processPickerVisible = ref(false) // 工序选择器状态
const processPickerValue = computed(() => formData.value.processId === undefined ? [] : [formData.value.processId])
const processDisplayValue = computed(() => {
  if (formData.value.processId === undefined) {
    return ''
  }
  const process = processMap.value.get(formData.value.processId)
  return process ? `${process.name} (${process.code})` : String(formData.value.processId)
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus()
}

/** 获取工序展示文案 */
function getProcessLabel(sop: MdProductSopVO): string {
  const process = sop.processId == null ? undefined : processMap.value.get(sop.processId)
  const name = sop.processName || process?.name || ''
  const code = sop.processCode || process?.code || ''
  if (name && code) {
    return `${name} (${code})`
  }
  return name || code || '-'
}

/** 预览图片 */
function handlePreview(url?: string) {
  if (!url) {
    return
  }
  uni.previewImage({ urls: [url] })
}

/** 加载工序选项 */
async function loadProcessOptions() {
  const processList = await getProcessSimpleList()
  const validProcesses = (processList || []).filter((process): process is ProProcessVO & { id: number } => process.id !== undefined)
  processOptions.value = validProcesses.map(process => ({
    id: process.id,
    label: process.code ? `${process.name} (${process.code})` : process.name,
  }))
  processMap.value = new Map(validProcesses.map(process => [process.id, { code: process.code || '', name: process.name || '' }]))
}

/** 加载 SOP 列表 */
async function loadList() {
  if (!props.itemId) {
    return
  }
  loading.value = true
  try {
    list.value = await getProductSopListByItemId(Number(props.itemId))
  } finally {
    loading.value = false
  }
}

/** 打开新增/编辑弹层 */
function openForm(type: 'create' | 'update', sop?: MdProductSopVO) {
  formType.value = type
  formData.value = type === 'update' && sop
    ? {
        id: sop.id,
        itemId: sop.itemId,
        sort: sop.sort,
        title: sop.title,
        processId: sop.processId ?? undefined,
        description: sop.description || '',
        url: sop.url || '',
        remark: sop.remark || '',
      }
    : {
        itemId: Number(props.itemId) || 0,
        sort: 0,
        title: '',
        processId: undefined,
        description: '',
        url: '',
        remark: '',
      }
  formVisible.value = true
}

/** 工序选择确认 */
function handleProcessConfirm({ value }: { value: Array<number | string> }) {
  const processId = Number(value[0])
  formData.value.processId = Number.isFinite(processId) ? processId : undefined
}

/** 清空工序 */
function clearProcess() {
  formData.value.processId = undefined
}

/** 提交表单 */
async function submitForm() {
  if (!formRef.value) {
    return
  }
  const result = await formRef.value.validate()
  if (!result.valid) {
    return
  }
  if (formType.value === 'update' && formData.value.id === undefined) {
    toast.warning('缺少 SOP 编号')
    return
  }

  const isCreate = formType.value === 'create'
  const actionName = isCreate ? '新增' : '修改'
  try {
    await new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '提示',
        content: isCreate ? '确认新增该 SOP 吗？' : '确认保存该 SOP 的修改吗？',
        success: res => res.confirm ? resolve() : reject(new Error('cancelled')),
        fail: () => reject(new Error('cancelled')),
      })
    })
  } catch {
    return
  }

  formLoading.value = true
  try {
    const base = {
      itemId: formData.value.itemId,
      sort: formData.value.sort,
      title: formData.value.title,
      processId: formData.value.processId,
      description: formData.value.description || undefined,
      url: formData.value.url || undefined,
      remark: formData.value.remark || undefined,
    }
    if (isCreate) {
      await createProductSop(base)
    } else {
      const id = formData.value.id
      if (id === undefined) {
        return
      }
      await updateProductSop({ ...base, id })
    }
    formVisible.value = false
    toast.success(`${actionName}成功`)
    await loadList()
  } finally {
    formLoading.value = false
  }
}

/** 删除 SOP */
async function handleDelete(sop: MdProductSopVO) {
  if (deletingId.value !== undefined) {
    return
  }
  try {
    await new Promise<void>((resolve, reject) => {
      uni.showModal({
        title: '提示',
        content: `确定要删除 SOP「${sop.title}」吗？`,
        success: res => res.confirm ? resolve() : reject(new Error('cancelled')),
        fail: () => reject(new Error('cancelled')),
      })
    })
  } catch {
    return
  }
  deletingId.value = sop.id
  try {
    await deleteProductSop(sop.id)
    toast.success('删除成功')
    await loadList()
  } finally {
    deletingId.value = undefined
  }
}

/** 初始化 */
onMounted(async () => {
  if (!props.itemId) {
    uni.showToast({ icon: 'none', title: '缺少物料编号' })
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 1000)
    return
  }
  await Promise.all([loadProcessOptions(), loadList()])
})
</script>
