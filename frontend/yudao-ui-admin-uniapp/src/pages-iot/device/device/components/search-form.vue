<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true"><wd-search :placeholder="placeholder" hide-cancel disabled /></view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">DeviceName</view>
        <wd-input v-model="formData.deviceName" placeholder="请输入 DeviceName" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">备注名称</view>
        <wd-input v-model="formData.nickname" placeholder="请输入备注名称" clearable />
      </view>
      <EntityPicker v-model="formData.productId" label="所属产品" :columns="productOptions" placeholder="请选择产品" label-width="160rpx" />
      <EntityPicker v-model="formData.groupId" label="设备分组" :columns="groupOptions" placeholder="请选择设备分组" label-width="160rpx" />
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">设备状态</view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">全部</wd-radio>
          <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_DEVICE_STATE)" :key="dict.value" :value="dict.value">{{ dict.label }}</wd-radio>
        </wd-radio-group>
      </view>
      <view class="yd-search-form-actions">
        <wd-button class="flex-1" variant="plain" @click="handleReset">重置</wd-button>
        <wd-button class="flex-1" type="primary" @click="handleSearch">搜索</wd-button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { DeviceGroup } from '@/api/iot/device/group'
import type { Product } from '@/api/iot/product/product'
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleDeviceGroupList } from '@/api/iot/device/group'
import { getSimpleProductList } from '@/api/iot/product/product'
import { getIntDictOptions } from '@/hooks/useDict'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{ defaultProductId?: number | any }>()
const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const productOptions = ref<Product[]>([]) // 产品选项
const groupOptions = ref<DeviceGroup[]>([]) // 设备分组选项
const defaultProductId = props.defaultProductId ? Number(props.defaultProductId) : undefined // 入口预置产品
const formData = reactive({ deviceName: undefined as string | undefined, nickname: undefined as string | undefined, productId: defaultProductId as number | undefined, groupId: undefined as number | undefined, status: -1 }) // 搜索表单数据
const placeholder = computed(() => formData.deviceName || formData.nickname || formData.productId || formData.groupId || formData.status !== -1 ? '搜索条件已设置' : '搜索设备')

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    deviceName: formData.deviceName,
    nickname: formData.nickname,
    productId: formData.productId,
    groupId: formData.groupId,
    status: formData.status === -1 ? undefined : formData.status,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.deviceName = undefined
  formData.nickname = undefined
  formData.productId = defaultProductId
  formData.groupId = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getSimpleProductList()
  groupOptions.value = await getSimpleDeviceGroupList()
})
</script>
