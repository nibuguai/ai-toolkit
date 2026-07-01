<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true">
    <wd-search :placeholder="placeholder" hide-cancel disabled />
  </view>

  <!-- 搜索弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="visible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
    @close="visible = false"
  >
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          维修单编号
        </view>
        <wd-input
          v-model="formData.code"
          placeholder="请输入维修单编号"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          维修单名称
        </view>
        <wd-input
          v-model="formData.name"
          placeholder="请输入维修单名称"
          clearable
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          设备
        </view>
        <MesSearchSelectorField
          :model-value="selectedMachineryText"
          placeholder="请选择设备"
          clearable
          @click="openMachinerySelector"
          @clear="clearMachinery"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          维修结果
        </view>
        <wd-radio-group v-model="formData.result" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_RESULT)" :key="dict.value" :value="dict.value">
            {{ dict.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_DV_REPAIR_STATUS)" :key="dict.value" :value="dict.value">
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

  <MachinerySelector ref="machinerySelectorRef" @confirm="handleMachineryConfirm" />
</template>

<script lang="ts" setup>
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）；业务选择器（Selector/MesSearchSelectorField）后续评估收敛为 yd-search-picker
import type { DvMachineryVO } from '@/api/mes/dv/machinery'
import type { DvRepairQueryParams } from '@/api/mes/dv/repair'
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import MesSearchSelectorField from '@/pages-mes/components/mes-search-selector-field.vue'
import MachinerySelector from '../../machinery/components/machinery-selector.vue'

const emit = defineEmits<{
  search: [data: DvRepairQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const machinerySelectorRef = ref<InstanceType<typeof MachinerySelector>>() // 设备选择器
const selectedMachinery = ref<DvMachineryVO>() // 已选设备
const formData = reactive({
  code: '',
  name: '',
  machineryId: undefined as number | undefined,
  result: undefined as number | undefined,
  status: undefined as number | undefined,
}) // 搜索表单数据
const selectedMachineryText = computed(() => {
  return selectedMachinery.value
    ? `${selectedMachinery.value.code || '-'} / ${selectedMachinery.value.name || '-'}`
    : ''
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
  if (selectedMachinery.value) {
    conditions.push(`设备:${selectedMachinery.value.code || selectedMachinery.value.name}`)
  }
  if (formData.result != null) {
    conditions.push(`结果:${getDictLabel(DICT_TYPE.MES_DV_REPAIR_RESULT, formData.result)}`)
  }
  if (formData.status != null) {
    conditions.push(`状态:${getDictLabel(DICT_TYPE.MES_DV_REPAIR_STATUS, formData.status)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索维修工单'
})

/** 打开设备选择器 */
function openMachinerySelector() {
  machinerySelectorRef.value?.open()
}

/** 选择设备 */
function handleMachineryConfirm(item: DvMachineryVO) {
  selectedMachinery.value = item
  formData.machineryId = item.id
}

/** 清空设备 */
function clearMachinery() {
  selectedMachinery.value = undefined
  formData.machineryId = undefined
}

/** 构造搜索参数 */
function buildParams() {
  const params: DvRepairQueryParams = {}
  if (formData.code) {
    params.code = formData.code
  }
  if (formData.name) {
    params.name = formData.name
  }
  if (formData.machineryId != null) {
    params.machineryId = formData.machineryId
  }
  if (formData.result != null) {
    params.result = formData.result
  }
  if (formData.status != null) {
    params.status = formData.status
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
  formData.name = ''
  formData.machineryId = undefined
  formData.result = undefined
  formData.status = undefined
  selectedMachinery.value = undefined
}

/** 重置按钮操作 */
function handleReset() {
  resetFields()
  visible.value = false
  emit('reset')
}

defineExpose({ resetFields })
</script>
