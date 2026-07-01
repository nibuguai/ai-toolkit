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
          检验单编号
        </view>
        <wd-input v-model="formData.code" placeholder="请输入检验单编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          客户
        </view>
        <view class="flex items-center gap-16rpx">
          <wd-input
            :model-value="selectedClientName"
            placeholder="请选择客户"
            clearable
            readonly
            class="min-w-0 flex-1"
            @click="openClientSelector"
            @clear="clearClient"
          />
          <wd-button size="small" @click="openClientSelector">
            选择
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          批次号
        </view>
        <wd-input v-model="formData.batchCode" placeholder="请输入批次号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          产品物料
        </view>
        <view class="flex items-center gap-16rpx">
          <wd-input
            :model-value="selectedItemName"
            placeholder="请选择产品物料"
            clearable
            readonly
            class="min-w-0 flex-1"
            @click="openItemSelector"
            @clear="clearItem"
          />
          <wd-button size="small" @click="openItemSelector">
            选择
          </wd-button>
        </view>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          检测结果
        </view>
        <wd-radio-group v-model="formData.checkResult" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_QC_CHECK_RESULT)" :key="dict.value" :value="dict.value">
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

  <ClientSelector ref="clientSelectorRef" title="选择客户" :multiple="false" @confirm="handleClientConfirm" />
  <ItemSelector ref="itemSelectorRef" title="选择产品物料" :multiple="false" @confirm="handleItemConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { MdClientVO } from '@/api/mes/md/client'
import type { MdItemVO } from '@/api/mes/md/item'
import type { QcOqcPageParam } from '@/api/mes/qc/oqc'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import ClientSelector from '@/pages-mes/md/client/components/client-selector.vue'
import ItemSelector from '@/pages-mes/md/item/components/item-selector.vue'

const emit = defineEmits<{
  search: [data: Partial<QcOqcPageParam>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const selectedClientName = ref('') // 已选客户展示名
const selectedItemName = ref('') // 已选物料展示名
const clientSelectorRef = ref<InstanceType<typeof ClientSelector>>() // 客户选择器引用
const itemSelectorRef = ref<InstanceType<typeof ItemSelector>>() // 物料选择器引用
const formData = reactive({
  code: '',
  clientId: undefined as number | undefined,
  batchCode: '',
  itemId: undefined as number | undefined,
  checkResult: undefined as number | undefined,
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code) {
    conditions.push(`编号:${formData.code}`)
  }
  if (formData.clientId != null) {
    conditions.push(`客户:${selectedClientName.value || formData.clientId}`)
  }
  if (formData.batchCode) {
    conditions.push(`批次:${formData.batchCode}`)
  }
  if (formData.itemId != null) {
    conditions.push(`物料:${selectedItemName.value || formData.itemId}`)
  }
  if (formData.checkResult != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_QC_CHECK_RESULT, formData.checkResult) || formData.checkResult}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索出货检验单（OQC）'
})

/** 打开客户选择器 */
function openClientSelector() {
  clientSelectorRef.value?.open()
}

/** 清空客户 */
function clearClient() {
  formData.clientId = undefined
  selectedClientName.value = ''
}

/** 确认客户 */
function handleClientConfirm(clients: MdClientVO[]) {
  const client = clients[0]
  formData.clientId = client?.id
  selectedClientName.value = client ? `${client.code || '-'} ${client.nickname || client.name || ''}`.trim() : ''
}

/** 打开物料选择器 */
function openItemSelector() {
  itemSelectorRef.value?.open()
}

/** 清空物料 */
function clearItem() {
  formData.itemId = undefined
  selectedItemName.value = ''
}

/** 确认物料 */
function handleItemConfirm(items: MdItemVO[]) {
  const item = items[0]
  formData.itemId = item?.id
  selectedItemName.value = item ? `${item.code || '-'} ${item.name || ''}`.trim() : ''
}

/** 构造搜索参数 */
function buildParams(): Partial<QcOqcPageParam> {
  const params: Partial<QcOqcPageParam> = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.clientId != null) {
    params.clientId = formData.clientId
  }
  if (formData.batchCode) {
    params.batchCode = formData.batchCode
  }
  if (formData.itemId != null) {
    params.itemId = formData.itemId
  }
  if (formData.checkResult != null) {
    params.checkResult = formData.checkResult
  }
  return params
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', buildParams())
}

/** 重置字段 */
function resetFields() {
  formData.code = ''
  formData.clientId = undefined
  formData.batchCode = ''
  formData.itemId = undefined
  formData.checkResult = undefined
  selectedClientName.value = ''
  selectedItemName.value = ''
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
