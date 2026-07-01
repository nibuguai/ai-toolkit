<template>
  <wd-popup
    v-model="visible"
    position="bottom"
    safe-area-inset-bottom
    custom-style="height: 86vh; border-radius: 24rpx 24rpx 0 0;"
    @close="handleClose"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <!-- 头部 -->
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="handleCancel">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          {{ title }}
        </view>
        <wd-button size="small" type="primary" :disabled="tempSelected.length === 0" @click="handleConfirm">
          确定{{ tempSelected.length ? `(${tempSelected.length})` : '' }}
        </wd-button>
      </view>

      <!-- 搜索 -->
      <view class="bg-white px-24rpx pb-20rpx">
        <wd-input v-model="searchCode" placeholder="物料编码" clearable />
        <wd-input v-model="searchName" placeholder="物料名称" clearable class="mt-12rpx" />
        <view class="mt-12rpx">
          <yd-tree-select
            v-model="searchItemTypeId"
            :data="itemTypeTree"
            placeholder="物料分类"
            :props="{ value: 'id', label: 'name', children: 'children' }"
          />
        </view>
        <view class="mt-16rpx flex gap-16rpx">
          <wd-button class="flex-1" variant="plain" @click="handleResetSearch">
            重置
          </wd-button>
          <wd-button class="flex-1" type="primary" @click="handleSearch">
            搜索
          </wd-button>
        </view>
      </view>

      <!-- 列表 -->
      <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation @scrolltolower="handleLoadMore">
        <view class="p-24rpx">
          <view
            v-for="item in itemList"
            :key="item.id"
            class="mb-20rpx rounded-12rpx bg-white p-24rpx shadow-sm"
            :class="isTempSelected(item.id) ? 'ring-2 ring-[#1677ff]' : isDisabled(item) ? 'opacity-40' : ''"
            @click="toggleItem(item)"
          >
            <view class="mb-12rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-30rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <dict-tag v-if="item.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="item.itemOrProduct" />
              <text v-if="isDisabled(item)" class="text-22rpx text-[#999]">
                不可选
              </text>
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">名称：</text>{{ item.name || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">规格：</text>{{ item.specification || '-' }}
            </view>
            <view class="mb-10rpx text-26rpx text-[#666]">
              <text class="text-[#999]">单位：</text>{{ item.unitMeasureName || '-' }}
            </view>
            <view class="text-26rpx text-[#666]">
              <text class="text-[#999]">分类：</text>{{ item.itemTypeName || '-' }}
            </view>
          </view>
          <view v-if="itemList.length === 0 && !loading" class="py-100rpx text-center">
            <wd-empty icon="content" tip="暂无可选物料" />
          </view>
          <view v-if="loading" class="flex justify-center py-24rpx">
            <wd-loading />
          </view>
        </view>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type { MdItemVO } from '@/api/mes/md/item'
import type { MdItemTypeVO } from '@/api/mes/md/item/type'
import { ref } from 'vue'
import { getItemPage } from '@/api/mes/md/item'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'

const props = withDefaults(defineProps<{
  /** 当前物料 ID（用于排除自身） */
  itemId?: number
  /** 已存在的 BOM 物料 ID 列表（用于排除已选） */
  existingIds?: number[]
  /** 物料/产品标识筛选 */
  itemOrProduct?: string
  /** 弹层标题 */
  title?: string
  /** 是否允许多选 */
  multiple?: boolean
}>(), {
  itemId: undefined,
  existingIds: () => [],
  itemOrProduct: undefined,
  title: '选择物料',
  multiple: true,
})

const emit = defineEmits<{
  confirm: [items: MdItemVO[]]
}>()

const visible = ref(false)
const loading = ref(false)
const itemList = ref<MdItemVO[]>([])
const tempSelected = ref<MdItemVO[]>([])
const pageNo = ref(1)
const total = ref(0)

// 搜索
const searchCode = ref('')
const searchName = ref('')
const searchItemTypeId = ref<number>()

const itemTypeTree = ref<MdItemTypeVO[]>([])

/** 加载分类树 */
async function loadTree() {
  const data = await getItemTypeList()
  itemTypeTree.value = handleTree(data || []) as MdItemTypeVO[]
}

/** 判断物料是否禁用 */
function isDisabled(item: MdItemVO): boolean {
  if (props.itemId && item.id === props.itemId)
    return true
  if (props.existingIds.includes(item.id))
    return true
  return false
}

/** 判断是否临时选中 */
function isTempSelected(id: number): boolean {
  return tempSelected.value.some(i => i.id === id)
}

/** 切换选中 */
function toggleItem(item: MdItemVO) {
  if (isDisabled(item))
    return
  const idx = tempSelected.value.findIndex(i => i.id === item.id)
  if (idx >= 0) {
    tempSelected.value.splice(idx, 1)
  } else if (!props.multiple) {
    tempSelected.value = [item]
  } else {
    tempSelected.value.push(item)
  }
}

/** 搜索 */
async function handleSearch() {
  pageNo.value = 1
  await loadItems()
}

/** 重置搜索 */
function handleResetSearch() {
  searchCode.value = ''
  searchName.value = ''
  searchItemTypeId.value = undefined
  pageNo.value = 1
  loadItems()
}

/** 加载更多 */
async function handleLoadMore() {
  if (loading.value || itemList.value.length >= total.value)
    return
  pageNo.value++
  await loadItems(true)
}

/** 加载物料列表 */
async function loadItems(append = false) {
  if (loading.value)
    return
  loading.value = true
  try {
    const data = await getItemPage({
      pageNo: pageNo.value,
      pageSize: 20,
      code: searchCode.value || undefined,
      name: searchName.value || undefined,
      itemTypeId: searchItemTypeId.value || undefined,
      itemOrProduct: props.itemOrProduct,
      status: CommonStatusEnum.ENABLE,
    })
    const rows = props.itemOrProduct
      ? data.list.filter(item => item.itemOrProduct === props.itemOrProduct)
      : data.list
    if (append) {
      itemList.value.push(...rows)
    } else {
      itemList.value = rows
    }
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 打开选择器 */
function open() {
  visible.value = true
  tempSelected.value = []
  searchCode.value = ''
  searchName.value = ''
  searchItemTypeId.value = undefined
  itemList.value = []
  total.value = 0
  pageNo.value = 1
  loadTree()
  loadItems()
}

/** 取消 */
function handleCancel() {
  visible.value = false
}

/** 关闭时清理 */
function handleClose() {
  tempSelected.value = []
  searchCode.value = ''
  searchName.value = ''
  searchItemTypeId.value = undefined
}

/** 确认选择 */
function handleConfirm() {
  emit('confirm', [...tempSelected.value])
  visible.value = false
}

defineExpose({ open })
</script>
