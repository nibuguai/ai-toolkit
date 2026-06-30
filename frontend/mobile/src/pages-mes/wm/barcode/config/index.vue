<template>
  <view class="yd-page-container yd-page-container-paging">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="MES 条码配置管理"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 搜索组件 -->
    <SearchForm @search="handleQuery" @reset="handleReset" />

    <!-- 新增入口 -->
    <view v-if="hasAccessByCodes(['mes:wm-barcode-config:create'])" class="bg-white px-24rpx py-16rpx">
      <wd-button block variant="plain" @click="handleAdd">
        新增条码配置
      </wd-button>
    </view>

    <!-- 列表 -->
    <z-paging
      ref="pagingRef"
      v-model="list"
      :fixed="false"
      class="min-h-0 flex-1"
      :default-page-size="10"
      :refresher-enabled="true"
      :inside-more="true"
      :loading-more-default-as-loading="true"
      empty-view-text="暂无条码配置数据"
      @query="queryList"
    >
      <view class="p-24rpx">
        <view
          v-for="item in list"
          :key="item.id"
          class="mb-24rpx overflow-hidden rounded-12rpx bg-white shadow-sm"
          @click="handleDetail(item)"
        >
          <view class="p-24rpx">
            <view class="mb-16rpx flex items-center justify-between gap-16rpx">
              <view class="min-w-0 flex-1 truncate text-32rpx text-[#333] font-semibold">
                {{ item.contentFormat || '-' }}
              </view>
              <dict-tag v-if="item.status != null" :type="DICT_TYPE.COMMON_STATUS" :value="item.status" />
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">条码格式：</text>
              <dict-tag v-if="item.format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="item.format" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">业务类型：</text>
              <dict-tag v-if="item.bizType != null" :type="DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE" :value="item.bizType" />
              <text v-else>-</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">内容格式：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.contentFormat || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">内容样例：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.contentExample || '-' }}</text>
            </view>
            <view class="mb-12rpx flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">默认打印模板：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.defaultTemplate || '报表/打印专项维护' }}</text>
            </view>
            <view class="flex items-center text-28rpx text-[#666]">
              <text class="mr-8rpx shrink-0 text-[#999]">自动生成：</text>
              <text class="min-w-0 flex-1 truncate">{{ item.autoGenerateFlag ? '是' : '否' }}</text>
            </view>
          </view>
          <view v-if="hasRowActions" class="flex border-t border-t-[#f0f0f0] text-28rpx" @click.stop>
            <view
              v-if="hasAccessByCodes(['mes:wm-barcode-config:update'])"
              class="flex-1 py-18rpx text-center text-[#1677ff]"
              @click="handleEdit(item)"
            >
              编辑
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-barcode-config:update'])"
              class="flex-1 py-18rpx text-center"
              :class="item.autoGenerateFlag ? 'text-[#faad14]' : 'text-[#52c41a]'"
              @click="handleAutoGenerateChange(item)"
            >
              {{ item.autoGenerateFlag ? '停用自动生成' : '启用自动生成' }}
            </view>
            <view
              v-if="hasAccessByCodes(['mes:wm-barcode-config:delete'])"
              class="flex-1 py-18rpx text-center text-[#f56c6c]"
              @click="handleDelete(item)"
            >
              删除
            </view>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import type { WmBarcodeConfigQueryParams, WmBarcodeConfigUpdateReqVO, WmBarcodeConfigVO } from '@/api/mes/wm/barcode/config'
import { onUnload } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { deleteBarcodeConfig, getBarcodeConfigPage, updateBarcodeConfig } from '@/api/mes/wm/barcode/config'
import { useAccess } from '@/hooks/useAccess'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import SearchForm from './components/search-form.vue'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const { hasAccessByCodes } = useAccess()
const dialog = useDialog()
const toast = useToast()
const list = ref<WmBarcodeConfigVO[]>([]) // 列表数据
const pagingRef = ref<ZPagingRef<WmBarcodeConfigVO>>() // 分页组件引用
const queryParams = ref<WmBarcodeConfigQueryParams>({}) // 查询参数
const hasRowActions = computed(() => {
  return hasAccessByCodes(['mes:wm-barcode-config:update']) || hasAccessByCodes(['mes:wm-barcode-config:delete'])
})

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/index')
}

/** 查询列表 */
async function queryList(pageNo: number, pageSize: number) {
  try {
    const params = {
      ...queryParams.value,
      pageNo,
      pageSize,
    }
    const data = await getBarcodeConfigPage(params)
    pagingRef.value?.completeByTotal(data.list, data.total)
  } catch {
    pagingRef.value?.complete(false)
  }
}

/** 搜索按钮操作 */
function handleQuery(data?: WmBarcodeConfigQueryParams) {
  queryParams.value = { ...data }
  reload()
}

/** 重置按钮操作 */
function handleReset() {
  handleQuery()
}

/** 重新加载 */
function reload() {
  pagingRef.value?.reload()
}

/** 新增 */
function handleAdd() {
  uni.navigateTo({
    url: '/pages-mes/wm/barcode/config/form/index',
  })
}

/** 查看详情 */
function handleDetail(item: WmBarcodeConfigVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/barcode/config/detail/index?id=${item.id}`,
  })
}

/** 编辑 */
function handleEdit(item: WmBarcodeConfigVO) {
  uni.navigateTo({
    url: `/pages-mes/wm/barcode/config/form/index?id=${item.id}`,
  })
}

/** 自动生成开关变更 */
async function handleAutoGenerateChange(item: WmBarcodeConfigVO) {
  const targetFlag = !item.autoGenerateFlag
  const actionText = targetFlag ? '启用' : '停用'
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确认要${actionText}自动生成吗？`,
    })
  } catch {
    return
  }
  const data: WmBarcodeConfigUpdateReqVO = {
    id: item.id,
    format: item.format,
    bizType: item.bizType,
    contentFormat: item.contentFormat,
    contentExample: item.contentExample || undefined,
    autoGenerateFlag: targetFlag,
    defaultTemplate: item.defaultTemplate || undefined,
    status: item.status,
    remark: item.remark || undefined,
  }
  await updateBarcodeConfig(data)
  toast.success(`${actionText}成功`)
  reload()
}

/** 删除 */
async function handleDelete(item: WmBarcodeConfigVO) {
  try {
    await dialog.confirm({
      title: '提示',
      msg: `确定要删除「${item.contentFormat || item.id}」吗？`,
    })
  } catch {
    return
  }
  await deleteBarcodeConfig(item.id)
  toast.success('删除成功')
  reload()
}

/** 初始化 */
onMounted(() => {
  uni.$on('mes:wm:barcode:config:reload', reload)
})

/** 卸载 */
onUnload(() => {
  uni.$off('mes:wm:barcode:config:reload', reload)
})
</script>
