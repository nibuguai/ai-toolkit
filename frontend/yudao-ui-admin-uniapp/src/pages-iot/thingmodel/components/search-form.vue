<template>
  <!-- 搜索框入口 -->
  <view @click="visible = true"><wd-search :placeholder="placeholder" hide-cancel disabled /></view>

  <!-- 搜索弹窗 -->
  <wd-popup v-model="visible" position="top" :custom-style="getTopPopupStyle()" :modal-style="getTopPopupModalStyle()" @close="visible = false">
    <view class="yd-search-form-container">
      <view class="yd-search-form-item"><view class="yd-search-form-label">产品编号</view><wd-input v-model="formData.productId" placeholder="请输入产品编号" clearable /></view>
      <view class="yd-search-form-item"><view class="yd-search-form-label">功能类型</view><wd-radio-group v-model="formData.type" type="button"><wd-radio :value="-1">全部</wd-radio><wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_THING_MODEL_TYPE)" :key="dict.value" :value="dict.value">{{ dict.label }}</wd-radio></wd-radio-group></view>
      <view class="yd-search-form-actions"><wd-button class="flex-1" variant="plain" @click="handleReset">重置</wd-button><wd-button class="flex-1" type="primary" @click="handleSearch">搜索</wd-button></view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'

const emit = defineEmits<{ search: [data: Record<string, any>], reset: [] }>()
const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({ productId: undefined as string | undefined, type: -1 }) // 搜索表单数据
const placeholder = computed(() => formData.productId ? '产品编号:' + formData.productId : '搜索物模型')

/** 搜索按钮操作 */
function handleSearch() { visible.value = false; emit('search', { productId: formData.productId ? Number(formData.productId) : undefined, type: formData.type === -1 ? undefined : formData.type }) }

/** 重置按钮操作 */
function handleReset() { formData.productId = undefined; formData.type = -1; visible.value = false; emit('reset') }
</script>
