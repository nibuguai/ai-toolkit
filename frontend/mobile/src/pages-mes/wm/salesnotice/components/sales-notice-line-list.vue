<template>
  <MesLineListShell
    title="发货物料"
    :loading="loading"
    :empty="list.length === 0"
    empty-text="暂无发货物料"
    :readonly="readonly"
    add-text="添加物料"
    @add="openCreateForm"
  >
    <view
      v-for="item in list"
      :key="item.id"
      class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
    >
      <view class="mb-12rpx flex items-start justify-between gap-16rpx">
        <view class="min-w-0 flex-1">
          <view class="truncate text-28rpx text-[#333] font-medium">
            {{ item.itemCode || `物料 #${item.itemId}` }}
          </view>
          <view class="mt-4rpx truncate text-26rpx text-[#666]">
            {{ item.itemName || '-' }}
          </view>
        </view>
        <dict-tag :type="DICT_TYPE.INFRA_BOOLEAN_STRING" :value="String(Boolean(item.oqcCheckFlag))" />
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">规格型号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.specification || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">单位：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.unitMeasureName || '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">发货数量：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.quantity ?? '-' }}</text>
      </view>
      <view class="mb-8rpx flex text-26rpx text-[#666]">
        <text class="mr-8rpx shrink-0 text-[#999]">批次号：</text>
        <text class="min-w-0 flex-1 truncate">{{ item.batchCode || '-' }}</text>
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

  <!-- 发货物料表单弹窗 -->
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
            <wd-form-item title="物料" title-width="220rpx" prop="itemId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openItemSelector">
                <text :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedItemText || '请选择物料' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="发货数量" title-width="220rpx" prop="quantity" center>
              <wd-input-number v-model="formData.quantity" :min="0.01" :precision="2" />
            </wd-form-item>
            <wd-form-item title="批次号" title-width="220rpx" prop="batchCode">
              <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" />
            </wd-form-item>
            <wd-cell title="是否检验" center>
              <view class="flex justify-end">
                <wd-switch v-model="formData.oqcCheckFlag" />
              </view>
            </wd-cell>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type {
  WmSalesNoticeLineCreateReqVO,
  WmSalesNoticeLineVO,
} from '@/api/mes/wm/salesnotice/line'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import {
  createSalesNoticeLine,
  deleteSalesNoticeLine,
  getSalesNoticeLinePage,
  updateSalesNoticeLine,
} from '@/api/mes/wm/salesnotice/line'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MesLineListShell from '@/pages-mes/components/mes-line-list-shell.vue'
import ItemSelector from '../../../md/item/components/item-selector.vue'

interface WmSalesNoticeLineFormData extends WmSalesNoticeLineCreateReqVO {
  id?: number
}

interface SelectedItemPreview {
  id: number
  code?: string
  name?: string
  specification?: string
  unitMeasureName?: string
}

const props = defineProps<{
  noticeId?: number
  readonly?: boolean
}>()

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmSalesNoticeLineVO[]>([]) // 发货物料列表
const formVisible = ref(false) // 行表单显示状态
const formLoading = ref(false) // 表单提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref<WmSalesNoticeLineFormData>(getDefaultFormData()) // 表单数据
const selectedItem = ref<SelectedItemPreview>() // 当前选择物料
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formTitle = computed(() => formData.value.id ? '编辑发货物料' : '添加发货物料')
const selectedItemText = computed(() => {
  if (!selectedItem.value) {
    return ''
  }
  return `${selectedItem.value.code || '-'} ${selectedItem.value.name || ''}`.trim()
})
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  quantity: [
    { required: true, message: '发货数量不能为空' },
    { validator: value => Number(value) > 0 || '发货数量必须大于 0' },
  ],
  oqcCheckFlag: [{ required: true, message: '是否检验不能为空' }],
})

/** 默认表单数据 */
function getDefaultFormData() {
  return {
    noticeId: props.noticeId || 0,
    itemId: undefined,
    batchId: undefined,
    batchCode: '',
    quantity: undefined,
    oqcCheckFlag: true,
    remark: '',
  } as WmSalesNoticeLineFormData
}

/** 查询发货物料列表 */
async function getList() {
  if (!props.noticeId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getSalesNoticeLinePage({
      pageNo: 1,
      pageSize: 100,
      noticeId: props.noticeId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开新增表单 */
function openCreateForm() {
  formData.value = getDefaultFormData()
  selectedItem.value = undefined
  formVisible.value = true
}

/** 打开编辑表单 */
function openUpdateForm(item: WmSalesNoticeLineVO) {
  formData.value = {
    id: item.id,
    noticeId: item.noticeId,
    itemId: item.itemId,
    batchId: item.batchId,
    batchCode: item.batchCode || '',
    quantity: item.quantity,
    oqcCheckFlag: Boolean(item.oqcCheckFlag),
    remark: item.remark || '',
  }
  selectedItem.value = {
    id: item.itemId,
    code: item.itemCode || '',
    name: item.itemName || '',
    specification: item.specification || '',
    unitMeasureName: item.unitMeasureName || '',
  }
  formVisible.value = true
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
}

/** 提交发货物料 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.noticeId) {
    return
  }
  formLoading.value = true
  try {
    const data: WmSalesNoticeLineCreateReqVO = {
      noticeId: props.noticeId,
      itemId: formData.value.itemId,
      batchId: formData.value.batchId,
      batchCode: formData.value.batchCode || undefined,
      quantity: formData.value.quantity,
      oqcCheckFlag: formData.value.oqcCheckFlag,
      remark: formData.value.remark || undefined,
    }
    if (formData.value.id) {
      await updateSalesNoticeLine({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createSalesNoticeLine(data)
      toast.success('添加成功')
    }
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除发货物料 */
async function handleDelete(item: WmSalesNoticeLineVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.itemCode || item.itemName || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteSalesNoticeLine(item.id)
  toast.success('删除成功')
  await getList()
}

watch(
  () => props.noticeId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
