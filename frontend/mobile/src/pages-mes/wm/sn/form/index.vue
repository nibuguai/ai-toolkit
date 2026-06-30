<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 生成表单 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="物料" title-width="200rpx" prop="itemId" required>
            <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click="openItemSelector">
              <text :class="selectedItemText ? 'text-[#333]' : 'text-[#999]'">
                {{ selectedItemText || '请选择物料' }}
              </text>
              <wd-icon name="arrow-right" color="#999" />
            </view>
          </wd-form-item>
          <wd-form-item title="批次号" title-width="200rpx" prop="batchCode">
            <wd-input v-model="formData.batchCode" clearable placeholder="请输入批次号" :maxlength="100" />
          </wd-form-item>
          <wd-form-item title="生成数量" title-width="200rpx" prop="count" required center>
            <wd-input-number v-model="formData.count" :min="1" :max="1000" />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fffbe6] p-24rpx text-26rpx text-[#8c6d1f]">
        SN 码会由后端按当前规则批量生成。本页只提交物料、批次号和生成数量，最多一次生成 1000 个。
      </view>
    </view>

    <!-- 底部生成按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        生成 SN 码
      </wd-button>
    </MesFooterActions>

    <ItemSelector ref="itemSelectorRef" :multiple="false" @confirm="handleItemConfirm" />
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemVO } from '@/api/mes/md/item'
import type { WmSnGenerateVO } from '@/api/mes/wm/sn'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { generateSnCodes } from '@/api/mes/wm/sn'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import ItemSelector from '../../../md/item/components/item-selector.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => '生成 SN 码')
const formLoading = ref(false) // 表单提交状态
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器
const selectedItem = ref<MdItemVO>() // 已选物料
const formData = ref<Partial<WmSnGenerateVO>>({
  itemId: undefined,
  batchCode: '',
  count: 100,
}) // 表单数据
const formSchema = createFormSchema({
  itemId: [{ required: true, message: '物料不能为空' }],
  count: [
    { required: true, message: '生成数量不能为空' },
    {
      validator: (value) => {
        const count = Number(value)
        return Number.isInteger(count) && count >= 1 && count <= 1000
      },
      message: '生成数量必须在 1 到 1000 之间',
    },
  ],
})
const formRef = ref<FormInstance>() // 表单组件引用
const selectedItemText = computed(() => {
  return selectedItem.value
    ? `${selectedItem.value.code || '-'} / ${selectedItem.value.name || '-'}`
    : ''
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/sn/index')
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 确认选择物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  if (!item) {
    return
  }
  selectedItem.value = item
  formData.value.itemId = item.id
}

/** 组装提交参数 */
function buildSubmitData(): WmSnGenerateVO | undefined {
  if (!formData.value.itemId || !formData.value.count) {
    return undefined
  }
  const count = Number(formData.value.count)
  return {
    itemId: formData.value.itemId,
    batchCode: formData.value.batchCode || undefined,
    count,
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }

  const submitData = buildSubmitData()
  if (!submitData) {
    return
  }
  formLoading.value = true
  try {
    await generateSnCodes(submitData)
    toast.success('生成成功')
    uni.$emit('mes:wm:sn:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}
</script>
