<template>
  <view class="mt-24rpx">
    <!-- 标题操作 -->
    <view class="mb-16rpx flex items-center justify-between">
      <view class="text-30rpx text-[#333] font-semibold">
        子箱
      </view>
      <wd-button v-if="editable" size="small" type="primary" @click="openPackageSelector">
        添加子箱
      </wd-button>
    </view>

    <!-- 子箱列表 -->
    <view v-if="list.length > 0">
      <view
        v-for="item in list"
        :key="item.id"
        class="mb-20rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
      >
        <view class="p-24rpx">
          <view class="mb-12rpx flex items-start justify-between gap-16rpx">
            <view class="min-w-0 flex-1">
              <view class="truncate text-30rpx text-[#333] font-semibold">
                {{ item.code || '-' }}
              </view>
              <view class="mt-4rpx text-24rpx text-[#999]">
                {{ formatDateTime(item.packageDate) || '-' }}
              </view>
            </view>
            <dict-tag v-if="item.status != null" :type="DICT_TYPE.MES_WM_PACKAGE_STATUS" :value="item.status" />
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">客户：</text>{{ getClientText(item) }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">尺寸：</text>{{ getSizeText(item) }}
          </view>
          <view class="mb-10rpx text-26rpx text-[#666]">
            <text class="text-[#999]">重量：</text>{{ getWeightText(item) }}
          </view>
          <view class="text-26rpx text-[#666]">
            <text class="text-[#999]">检查员：</text>{{ item.inspectorName || '-' }}
          </view>
        </view>
        <view v-if="editable" class="flex border-t border-t-[#f0f0f0] text-28rpx">
          <view class="flex-1 py-18rpx text-center text-[#f56c6c]" @click="handleRemoveChild(item)">
            移除
          </view>
        </view>
      </view>
    </view>
    <view v-else class="rounded-12rpx bg-white py-64rpx text-center text-26rpx text-[#999]">
      {{ loading ? '加载中...' : '暂无子箱' }}
    </view>

    <PackageSelector
      ref="packageSelectorRef"
      title="选择子箱"
      empty-tip="暂无可作为子箱的已完成装箱单"
      :exclude-id="packageId"
      childable-only
      @confirm="handlePackageConfirm"
    />
  </view>
</template>

<script lang="ts" setup>
import type { WmPackageVO } from '@/api/mes/wm/packages'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref, watch } from 'vue'
import { addChildPackage, getPackagePage, removeChildPackage } from '@/api/mes/wm/packages'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'
import PackageSelector from './package-selector.vue'

const props = withDefaults(defineProps<{
  packageId?: number
  editable?: boolean
}>(), {
  packageId: undefined,
  editable: false,
})

const dialog = useDialog()
const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<WmPackageVO[]>([]) // 子箱列表
const packageSelectorRef = ref<InstanceType<typeof PackageSelector>>() // 装箱单选择器

/** 客户展示 */
function getClientText(item: WmPackageVO) {
  const code = item.clientCode || ''
  const name = item.clientName || ''
  return [code, name].filter(Boolean).join(' / ') || '-'
}

/** 尺寸展示 */
function getSizeText(item: WmPackageVO) {
  const values = [item.length, item.width, item.height].map(value => value ?? '-').join(' x ')
  return `${values} ${item.sizeUnitName || ''}`.trim()
}

/** 重量展示 */
function getWeightText(item: WmPackageVO) {
  const net = item.netWeight ?? '-'
  const gross = item.grossWeight ?? '-'
  return `净重 ${net} / 毛重 ${gross} ${item.weightUnitName || ''}`.trim()
}

/** 查询子箱列表 */
async function getList() {
  if (!props.packageId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    const data = await getPackagePage({
      pageNo: 1,
      pageSize: 100,
      parentId: props.packageId,
    })
    list.value = data.list
  } finally {
    loading.value = false
  }
}

/** 打开子箱选择器 */
function openPackageSelector() {
  if (!props.packageId) {
    return
  }
  packageSelectorRef.value?.open()
}

/** 添加子箱 */
async function handlePackageConfirm(item: WmPackageVO) {
  if (!props.packageId) {
    return
  }
  await addChildPackage(props.packageId, item.id)
  toast.success('添加成功')
  await getList()
}

/** 移除子箱 */
async function handleRemoveChild(item: WmPackageVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认将装箱单「${item.code}」从子箱列表中移除？`,
    })
  } catch {
    return
  }
  await removeChildPackage(item.id)
  toast.success('移除成功')
  await getList()
}

onMounted(getList)

watch(() => props.packageId, getList)

defineExpose({ reload: getList })
</script>
