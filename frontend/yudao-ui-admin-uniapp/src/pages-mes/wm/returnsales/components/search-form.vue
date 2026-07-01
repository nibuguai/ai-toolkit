<template>
  <!-- 搜索框入口 -->
  <view class="relative" @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
    <view class="absolute inset-0 z-1" />
  </view>

  <!-- 搜索弹窗 -->
  <wd-popup
    v-model="visible"
    position="top"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入退货单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          退货单名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入退货单名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <MesSearchSelectorField
          :model-value="selectedClientText"
          placeholder="请选择客户"
          clearable
          @click="openClientSelector"
          @clear="clearClient"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in statusOptions" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">
          重置
        </wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">
          搜索
        </wd-button>
      </view>
    </view>
  </wd-popup>

  <ClientSelector ref="clientSelectorRef" @confirm="handleClientConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-radio-group 状态筛选改 yd-search-picker（status，配 dict-kind + all-option）；② 客户选择器 MesSearchSelectorField+ClientSelector 后续评估收敛为 yd-search-picker
import type { MdClientVO } from '@/api/mes/md/client'
import type { WmReturnSalesQueryParams } from '@/api/mes/wm/returnsales'
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import ClientSelector from '../../../md/client/components/client-selector.vue'

const emit = defineEmits<{
  search: [data: WmReturnSalesQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const selectedClient = ref<MdClientVO>() // 当前选择客户
const formData = reactive<WmReturnSalesQueryParams>({
  code: undefined,
  name: undefined,
  salesOrderCode: undefined,
  clientId: undefined,
  status: undefined,
}) // 搜索表单数据
const statusOptions = computed(() => getIntDictOptions(DICT_TYPE.MES_WM_RETURN_SALES_STATUS)) // 状态选项
const selectedClientText = computed(() => {
  return selectedClient.value
    ? `${selectedClient.value.code || '-'} ${selectedClient.value.name || ''}`.trim()
    : ''
})
const selectedStatusText = computed(() => {
  if (formData.status === undefined) {
    return ''
  }
  return statusOptions.value.find(item => item.value === formData.status)?.label || ''
})

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.name) {
    conditions.push(`名称:${formData.name}`)
  }
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  if (selectedClientText.value) {
    conditions.push(`客户:${selectedClientText.value}`)
  }
  if (selectedStatusText.value) {
    conditions.push(`状态:${selectedStatusText.value}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索销售退货'
})

/** 打开客户选择器 */
function openClientSelector() {
  clientSelectorRef.value?.open()
}

/** 确认选择客户 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  if (!client) {
    return
  }
  selectedClient.value = client
  formData.clientId = client.id
}

/** 清空客户 */
function clearClient() {
  selectedClient.value = undefined
  formData.clientId = undefined
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', { ...formData })
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = undefined
  formData.name = undefined
  formData.salesOrderCode = undefined
  formData.status = undefined
  clearClient()
  visible.value = false
  emit('reset')
}
</script>
