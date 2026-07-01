<template>
  <!-- 数值型：取值范围 / 步长 / 单位 -->
  <template v-if="isNumber">
    <wd-form-item title="最小值" :title-width="titleWidth"><wd-input v-model="target.dataSpecs.min" placeholder="请输入最小值" /></wd-form-item>
    <wd-form-item title="最大值" :title-width="titleWidth"><wd-input v-model="target.dataSpecs.max" placeholder="请输入最大值" /></wd-form-item>
    <wd-form-item title="步长" :title-width="titleWidth"><wd-input v-model="target.dataSpecs.step" placeholder="请输入步长" /></wd-form-item>
    <EntityPicker v-model="target.dataSpecs.unit" label="单位" :columns="unitOptions" label-key="label" value-key="value" placeholder="请选择单位" :label-width="titleWidth" />
  </template>
  <!-- 文本型：数据长度 -->
  <wd-form-item v-else-if="isText" title="数据长度" :title-width="titleWidth"><wd-input v-model="target.dataSpecs.length" placeholder="请输入文本字节长度" /></wd-form-item>
  <!-- 布尔型：0 / 1 文案 -->
  <template v-else-if="isBool">
    <wd-form-item v-for="item in target.dataSpecsList" :key="item.value" :title="`布尔值 ${item.value}`" :title-width="titleWidth"><wd-input v-model="item.name" :placeholder="item.value === 0 ? '如：关' : '如：开'" /></wd-form-item>
  </template>
  <!-- 枚举型：枚举项列表 -->
  <view v-else-if="isEnum" class="bg-white px-32rpx py-20rpx">
    <view class="mb-12rpx text-26rpx text-[#999]">枚举项（参数值 + 描述）</view>
    <view v-for="(item, index) in target.dataSpecsList" :key="index" class="mb-16rpx flex items-center gap-12rpx">
      <wd-input v-model="item.value" class="flex-1" placeholder="枚举值，如 0" />
      <wd-input v-model="item.name" class="flex-1" placeholder="枚举描述" />
      <wd-icon name="delete" size="40rpx" color="#fa4350" @click="removeEnum(index)" />
    </view>
    <wd-button size="small" type="primary" variant="plain" @click="addEnum">+ 添加枚举项</wd-button>
  </view>
  <!-- 时间型：提示 -->
  <wd-form-item v-else-if="isDate" title="时间格式" :title-width="titleWidth"><text class="text-26rpx text-[#999]">String 类型 UTC 毫秒时间戳</text></wd-form-item>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { getStrDictOptions } from '@/hooks/useDict'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { IoTDataSpecsDataTypeEnum } from '@/pages-iot/utils/constants'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{ target: Record<string, any>, titleWidth?: string }>(), { titleWidth: '200rpx' })

const unitOptions = getStrDictOptions(DICT_TYPE.IOT_THING_MODEL_UNIT) // 单位字典选项
const isNumber = computed(() => [IoTDataSpecsDataTypeEnum.INT, IoTDataSpecsDataTypeEnum.FLOAT, IoTDataSpecsDataTypeEnum.DOUBLE].includes(props.target.dataType))
const isText = computed(() => props.target.dataType === IoTDataSpecsDataTypeEnum.TEXT)
const isBool = computed(() => props.target.dataType === IoTDataSpecsDataTypeEnum.BOOL)
const isEnum = computed(() => props.target.dataType === IoTDataSpecsDataTypeEnum.ENUM)
const isDate = computed(() => props.target.dataType === IoTDataSpecsDataTypeEnum.DATE)

// 单位选定时同步单位名称（后端 dataSpecs 需要 unit + unitName）
watch(() => props.target.dataSpecs?.unit, (unit) => {
  if (!isNumber.value || !props.target.dataSpecs) return
  props.target.dataSpecs.unitName = unitOptions.find(item => String(item.value) === String(unit))?.label || ''
})

/** 添加枚举项 */
function addEnum() {
  props.target.dataSpecsList.push({ dataType: IoTDataSpecsDataTypeEnum.ENUM, name: '', value: undefined })
}

/** 删除枚举项 */
function removeEnum(index: number) {
  if (props.target.dataSpecsList.length > 1) props.target.dataSpecsList.splice(index, 1)
}
</script>
