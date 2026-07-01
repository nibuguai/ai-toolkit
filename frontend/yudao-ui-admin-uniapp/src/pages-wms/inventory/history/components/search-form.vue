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
          商品名称
        </view>
        <wd-input v-model="formData.itemName" placeholder="请输入商品名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          规格名称
        </view>
        <wd-input v-model="formData.skuName" placeholder="请输入规格名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据编号
        </view>
        <wd-input v-model="formData.orderNo" placeholder="请输入单据编号" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          单据类型
        </view>
        <wd-radio-group v-model="formData.orderType" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.WMS_ORDER_TYPE)"
            :key="dict.value"
            :value="dict.value"
          >
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
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{
  search: [data: Record<string, any>]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  itemName: undefined as string | undefined,
  skuName: undefined as string | undefined,
  orderNo: undefined as string | undefined,
  orderType: -1, // -1 表示全部
}) // 搜索表单数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.itemName) {
    conditions.push(`商品:${formData.itemName}`)
  }
  if (formData.skuName) {
    conditions.push(`规格:${formData.skuName}`)
  }
  if (formData.orderNo) {
    conditions.push(`单据:${formData.orderNo}`)
  }
  if (formData.orderType !== -1) {
    conditions.push(`类型:${getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, formData.orderType)}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索库存流水'
})

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  emit('search', {
    ...formData,
    orderType: formData.orderType === -1 ? undefined : formData.orderType,
  })
}

/** 重置按钮操作 */
function handleReset() {
  formData.itemName = undefined
  formData.skuName = undefined
  formData.orderNo = undefined
  formData.orderType = -1
  visible.value = false
  emit('reset')
}
</script>
