<template>
  <view class="yd-page-container pb-120rpx">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border title="单据信息">
          <wd-form-item title="出库单号" title-width="180rpx" prop="no">
            <wd-input v-model="formData.no" clearable placeholder="请输入出库单号" />
          </wd-form-item>
          <wd-form-item
            title="出库类型"
            title-width="180rpx"
            prop="type"
            is-link
            :value="getWotPickerFormValue(getIntDictOptions(DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE), formData.type)"
            placeholder="请选择出库类型"
            @click="pickerVisible.type = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.type"
            :model-value="formData.type"
            :columns="getIntDictOptions(DICT_TYPE.WMS_SHIPMENT_ORDER_TYPE)"
            @confirm="handleTypeConfirm"
          />
          <WarehousePicker v-model="formData.warehouseId" prop="warehouseId" @change="handleWarehouseChange" />
          <wd-form-item
            title="单据日期"
            title-width="180rpx"
            prop="orderTime"
            is-link
            :value="formatDate(formData.orderTime)"
            placeholder="请选择单据日期"
            @click="pickerVisible.orderTime = true"
          />
          <wd-datetime-picker
            v-model="formData.orderTime"
            v-model:visible="pickerVisible.orderTime"
            title="请选择单据日期"
            type="date"
          />
          <MerchantPicker
            v-model="formData.merchantId"
            label="客户"
            prop="merchantId"
            placeholder="请选择客户"
            customer
          />
          <wd-form-item title="业务单号" title-width="180rpx">
            <wd-input v-model="formData.bizOrderNo" clearable placeholder="请输入业务单号" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="180rpx">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="255" clearable />
          </wd-form-item>
        </wd-cell-group>

        <view class="mx-24rpx mb-16rpx mt-24rpx flex items-center justify-between">
          <text class="text-30rpx text-[#333] font-semibold">出库明细</text>
          <wd-button size="small" type="primary" @click="handleAddDetail">
            添加商品
          </wd-button>
        </view>
        <view
          v-for="(detail, index) in formData.details"
          :key="detail.skuId || index"
          class="mx-24rpx mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
        >
          <view class="flex items-center justify-between border-b border-b-[#f5f5f5] px-24rpx py-20rpx">
            <view>
              <view class="text-28rpx text-[#333] font-semibold">
                {{ detail.itemName || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ detail.skuName || '-' }}
              </view>
            </view>
            <wd-button size="small" type="error" @click="handleDeleteDetail(index)">
              删除
            </wd-button>
          </view>
          <wd-cell-group border>
            <wd-cell title="可用库存" :value="formatQuantity(detail.availableQuantity) || '-'" />
            <wd-form-item title="数量" title-width="160rpx">
              <wd-input v-model.number="detail.quantity" type="digit" placeholder="请输入数量" @blur="handleDetailQuantityChange(detail)" />
            </wd-form-item>
            <wd-form-item title="单价" title-width="160rpx">
              <wd-input v-model.number="detail.price" type="digit" placeholder="请输入单价" @blur="handleDetailPriceChange(detail)" />
            </wd-form-item>
            <wd-form-item title="金额" title-width="160rpx">
              <wd-input v-model.number="detail.totalPrice" type="digit" placeholder="请输入金额" @blur="handleDetailTotalPriceChange(detail)" />
            </wd-form-item>
            <wd-cell title="单位" :value="detail.unit || '-'" />
          </wd-cell-group>
        </view>
        <view v-if="!formData.details?.length" class="mx-24rpx rounded-12rpx bg-white py-48rpx text-center text-26rpx text-[#999]">
          暂无出库明细
        </view>
      </wd-form>
    </view>

    <!-- 库存选择器 -->
    <InventoryPicker ref="inventoryPickerRef" :warehouse-id="formData.warehouseId" @change="handleSelectInventory" />

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
import type { ShipmentOrder } from '@/api/wms/order/shipment'
import type { ShipmentOrderDetail } from '@/api/wms/order/shipment/detail'
import type { InventoryPickerRow } from '@/pages-wms/components/inventory-picker.vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { createShipmentOrder, getShipmentOrder, updateShipmentOrder } from '@/api/wms/order/shipment'
import { getIntDictOptions } from '@/hooks/useDict'
import InventoryPicker from '@/pages-wms/components/inventory-picker.vue'
import MerchantPicker from '@/pages-wms/components/merchant-picker.vue'
import WarehousePicker from '@/pages-wms/components/warehouse-picker.vue'
import { WmsOrderStatusEnum } from '@/pages-wms/utils/constants'
import { dividePrice, formatQuantity, multiplyPrice } from '@/pages-wms/utils/format'
import { generateOrderNo } from '@/pages-wms/utils/order'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDate } from '@/utils/date'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑出库单' : '新增出库单')
const formLoading = ref(false) // 表单提交状态
const pickerVisible = reactive({
  type: false,
  orderTime: false,
}) // 选择器显示状态
const formData = ref<ShipmentOrder>({
  id: undefined,
  no: generateOrderNo('CK'),
  type: undefined,
  orderTime: undefined,
  status: WmsOrderStatusEnum.PREPARE,
  bizOrderNo: '',
  merchantId: undefined,
  warehouseId: undefined,
  remark: '',
  details: [],
}) // 表单数据
const formSchema = createFormSchema({
  no: [{ required: true, message: '出库单号不能为空' }],
  type: [{ required: true, message: '出库类型不能为空' }],
  orderTime: [{ required: true, message: '单据日期不能为空' }],
  warehouseId: [{ required: true, message: '仓库不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const inventoryPickerRef = ref<InstanceType<typeof InventoryPicker>>() // 库存选择器引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-wms/order/shipment/index')
}

/** 选择出库类型 */
function handleTypeConfirm({ value }: { value: any[] }) {
  formData.value.type = value[0]
  pickerVisible.type = false
}

/** 加载出库单详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  const order = await getShipmentOrder(Number(props.id))
  formData.value = {
    ...order,
    details: normalizeDetails(order.details || []),
  }
}

/** 构建出库明细 */
function buildDetail(inventory: InventoryPickerRow): ShipmentOrderDetail {
  return {
    id: undefined,
    itemId: inventory.itemId,
    itemCode: inventory.itemCode,
    itemName: inventory.itemName,
    unit: inventory.unit,
    skuId: inventory.skuId,
    skuCode: inventory.skuCode,
    skuName: inventory.skuName,
    warehouseId: inventory.warehouseId,
    warehouseName: inventory.warehouseName,
    quantity: undefined,
    availableQuantity: inventory.availableQuantity,
    price: undefined,
    totalPrice: undefined,
  }
}

/** 规范明细金额 */
function normalizeDetails(details: ShipmentOrderDetail[]) {
  return details.map(detail => ({
    ...detail,
    totalPrice: detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  }))
}

/** 添加商品 */
function handleAddDetail() {
  inventoryPickerRef.value?.open(getSelectedInventoryKeys())
}

/** 选择库存 */
function handleSelectInventory(inventories: InventoryPickerRow[]) {
  formData.value.details = formData.value.details || []
  inventories.forEach((inventory) => {
    if (isInventorySelected(inventory)) {
      return
    }
    formData.value.details!.push(buildDetail(inventory))
  })
}

/** 判断库存是否已选择 */
function isInventorySelected(inventory: InventoryPickerRow) {
  return (formData.value.details || []).some((detail) => {
    return detail.skuId === inventory.skuId && detail.warehouseId === inventory.warehouseId
  })
}

/** 获取已选库存标识 */
function getSelectedInventoryKeys() {
  return (formData.value.details || [])
    .map(detail => detail.skuId && detail.warehouseId ? `${detail.skuId}-${detail.warehouseId}` : undefined)
    .filter((key): key is string => !!key)
}

/** 删除明细 */
function handleDeleteDetail(index: number) {
  formData.value.details?.splice(index, 1)
}

/** 仓库变化 */
function handleWarehouseChange() {
  formData.value.details = []
}

/** 明细数量变化 */
function handleDetailQuantityChange(detail: ShipmentOrderDetail) {
  if (detail.price !== undefined && detail.price !== null) {
    detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
    return
  }
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 明细单价变化 */
function handleDetailPriceChange(detail: ShipmentOrderDetail) {
  detail.totalPrice = multiplyPrice(detail.quantity, detail.price)
}

/** 明细金额变化 */
function handleDetailTotalPriceChange(detail: ShipmentOrderDetail) {
  detail.price = dividePrice(detail.totalPrice, detail.quantity)
}

/** 校验明细 */
function validateDetails() {
  const details = formData.value.details || []
  for (let i = 0; i < details.length; i++) {
    const detail = details[i]
    if (!detail.quantity || detail.quantity <= 0) {
      toast.error(`第 ${i + 1} 行明细出库数量必须大于 0`)
      return false
    }
    if (detail.availableQuantity !== undefined && detail.quantity > detail.availableQuantity) {
      toast.error(`第 ${i + 1} 行明细出库数量不能大于可用库存`)
      return false
    }
  }
  return true
}

/** 构建提交数据 */
function buildSubmitData(): ShipmentOrder {
  const { totalQuantity: _totalQuantity, totalPrice: _totalPrice, details, ...order } = formData.value
  return {
    ...order,
    details: details || [],
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid || !validateDetails()) {
    return
  }

  formLoading.value = true
  try {
    if (props.id) {
      await updateShipmentOrder(buildSubmitData())
      toast.success('修改成功')
    } else {
      await createShipmentOrder(buildSubmitData())
      toast.success('新增成功')
    }
    uni.$emit('wms:shipment-order:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
