<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <EntityPicker v-model="formData.productId" label="所属产品" prop="productId" :columns="productOptions" placeholder="请选择产品" label-width="220rpx" :disabled="!!props.id" />
          <wd-form-item title="DeviceName" title-width="220rpx" prop="deviceName">
            <wd-input v-model="formData.deviceName" placeholder="请输入 DeviceName" :disabled="!!props.id" clearable />
          </wd-form-item>
          <wd-form-item title="备注名称" title-width="220rpx" prop="nickname">
            <wd-input v-model="formData.nickname" placeholder="请输入备注名称" clearable />
          </wd-form-item>
          <EntityPicker v-model="formData.groupIds" label="设备分组" :columns="groupOptions" type="checkbox" placeholder="请选择设备分组" label-width="220rpx" />
          <wd-form-item title="设备序列号" title-width="220rpx" prop="serialNumber">
            <wd-input v-model="formData.serialNumber" placeholder="请输入设备序列号" clearable />
          </wd-form-item>
          <wd-form-item title="经度" title-width="220rpx" prop="longitude">
            <wd-input v-model="formData.longitude" placeholder="请输入经度" clearable />
          </wd-form-item>
          <wd-form-item title="纬度" title-width="220rpx" prop="latitude">
            <wd-input v-model="formData.latitude" placeholder="请输入纬度" clearable />
          </wd-form-item>
          <wd-form-item title="设备地址" title-width="220rpx" prop="address">
            <wd-textarea v-model="formData.address" placeholder="请输入设备地址" :maxlength="200" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { Device } from '@/api/iot/device/device'
import type { DeviceGroup } from '@/api/iot/device/group'
import type { Product } from '@/api/iot/product/product'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createDevice, getDevice, updateDevice } from '@/api/iot/device/device'
import { getSimpleDeviceGroupList } from '@/api/iot/device/group'
import { getSimpleProductList } from '@/api/iot/product/product'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑设备' : '新增设备')
const formLoading = ref(false) // 表单提交状态
const productOptions = ref<Product[]>([]) // 产品选项
const groupOptions = ref<DeviceGroup[]>([]) // 设备分组选项
const formData = ref<Device>({
  id: undefined,
  productId: undefined,
  deviceName: '',
  nickname: '',
  deviceType: undefined,
  serialNumber: '',
  longitude: undefined,
  latitude: undefined,
  address: '',
  config: '',
  groupIds: [],
}) // 表单数据
const formSchema = createFormSchema({
  productId: [{ required: true, message: '所属产品不能为空' }],
  deviceName: [
    { required: true, message: 'DeviceName 不能为空' },
    { pattern: /^[\w.\-:@]{4,32}$/, message: 'DeviceName 长度 4~32，支持字母、数字和 _-.:@' },
  ],
  nickname: [{ pattern: /^.{2,64}$/, message: '备注名称长度为 2~64 个字符' }],
  longitude: [{ validator: value => Number(value) >= -180 && Number(value) <= 180, message: '经度需在 -180 ~ 180 之间' }],
  latitude: [{ validator: value => Number(value) >= -90 && Number(value) <= 90, message: '纬度需在 -90 ~ 90 之间' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

watch(
  () => formData.value.productId,
  (productId) => {
    const product = productOptions.value.find(item => String(item.id) === String(productId))
    if (product?.deviceType !== undefined) {
      formData.value.deviceType = product.deviceType
    }
  },
)

/** 返回上一页 */
function handleBack() { navigateBackPlus('/pages-iot/device/device/index') }

/** 加载设备详情 */
async function getDetail() {
  if (!props.id)
    return
  formData.value = await getDevice(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (data.longitude !== undefined && data.longitude !== '')
      data.longitude = Number(data.longitude)
    if (data.latitude !== undefined && data.latitude !== '')
      data.latitude = Number(data.latitude)
    if (props.id) {
      await updateDevice(data)
      toast.success('修改成功')
    } else {
      await createDevice(data)
      toast.success('新增成功')
    }
    uni.$emit('iot:device:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  productOptions.value = await getSimpleProductList()
  groupOptions.value = await getSimpleDeviceGroupList()
  getDetail()
})
</script>
