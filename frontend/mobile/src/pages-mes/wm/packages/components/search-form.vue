<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
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
          装箱单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入装箱单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          销售订单编号
        </view>
        <wd-input v-model="formData.salesOrderCode" placeholder="请输入销售订单编号" clearable />
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
          检查员
        </view>
        <UserPicker
          v-model="formData.inspectorUserId"
          type="radio"
          placeholder="请选择检查员"
          use-default-slot
          @confirm="handleInspectorConfirm"
        >
          <MesSearchSelectorField
            :model-value="selectedInspectorText"
            placeholder="请选择检查员"
            clearable
            @clear="clearInspector"
          />
        </UserPicker>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_PACKAGE_STATUS)" :key="dict.value" :value="dict.value">
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

  <ClientSelector ref="clientSelectorRef" :multiple="false" @confirm="handleClientConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——① wd-radio-group 状态筛选改 yd-search-picker（status，配 dict-kind + all-option）；② 客户选择器 MesSearchSelectorField+ClientSelector 后续评估收敛为 yd-search-picker
import type { MdClientVO } from '@/api/mes/md/client'
import type { WmPackageQueryParams } from '@/api/mes/wm/packages'
import type { User } from '@/api/system/user'
import { computed, reactive, ref } from 'vue'
import UserPicker from '@/components/system-select/user-picker.vue'
import { getIntDictOptions } from '@/hooks/useDict'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import { DICT_TYPE } from '@/utils/constants'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: WmPackageQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器
const selectedClient = ref<MdClientVO>() // 已选客户
const selectedInspectorText = ref('') // 已选检查员
const formData = reactive<Pick<WmPackageQueryParams, 'code' | 'salesOrderCode' | 'clientId' | 'inspectorUserId' | 'status'>>({
  code: '',
  salesOrderCode: '',
  clientId: undefined,
  inspectorUserId: undefined,
  status: undefined,
}) // 搜索表单数据
const selectedClientText = computed(() => selectedClient.value ? `${selectedClient.value.code || '-'} / ${selectedClient.value.name || '-'}` : '')

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.salesOrderCode) {
    conditions.push(`销售订单:${formData.salesOrderCode}`)
  }
  if (selectedClient.value) {
    conditions.push(`客户:${selectedClient.value.code}`)
  }
  if (selectedInspectorText.value) {
    conditions.push(`检查员:${selectedInspectorText.value}`)
  }
  if (formData.status !== undefined) {
    const dict = getIntDictOptions(DICT_TYPE.MES_WM_PACKAGE_STATUS).find(item => item.value === formData.status)
    conditions.push(`状态:${dict?.label || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索装箱单'
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

/** 确认选择检查员 */
function handleInspectorConfirm(users: User[]) {
  selectedInspectorText.value = users[0]?.nickname || ''
}

/** 清空客户 */
function clearClient() {
  selectedClient.value = undefined
  formData.clientId = undefined
}

/** 清空检查员 */
function clearInspector() {
  selectedInspectorText.value = ''
  formData.inspectorUserId = undefined
}

/** 构造搜索参数 */
function buildParams() {
  const params: WmPackageQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.salesOrderCode) {
    params.salesOrderCode = formData.salesOrderCode
  }
  if (formData.clientId) {
    params.clientId = formData.clientId
  }
  if (formData.inspectorUserId) {
    params.inspectorUserId = formData.inspectorUserId
  }
  if (formData.status !== undefined) {
    params.status = formData.status
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.salesOrderCode = ''
  formData.clientId = undefined
  formData.inspectorUserId = undefined
  formData.status = undefined
  clearClient()
  clearInspector()
  visible.value = false
  emit('reset')
}
</script>
