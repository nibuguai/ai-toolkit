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
          物料编码
        </view>
        <wd-input v-model="formData.code" placeholder="请输入物料编码" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料名称
        </view>
        <wd-input v-model="formData.name" placeholder="请输入物料名称" clearable />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          物料分类
        </view>
        <yd-tree-select
          v-model="formData.itemTypeId"
          :data="itemTypeTree"
          placeholder="请选择物料分类"
          :props="{
            value: 'id',
            label: 'name',
            children: 'children',
          }"
        />
      </view>
      <view class="yd-search-form-item">
        <view class="yd-search-form-label">
          状态
        </view>
        <wd-radio-group v-model="formData.status" type="button">
          <wd-radio :value="-1">
            全部
          </wd-radio>
          <wd-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
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
// TODO @YunaiV：搜索风格对齐 system/infra——wd-radio-group 状态/类型筛选改 yd-search-picker（配 dict-kind + all-option）
import type { MdItemQueryParams } from '@/api/mes/md/item'
import type { MdItemTypeVO } from '@/api/mes/md/item/type'
import { computed, reactive, ref } from 'vue'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { getIntDictOptions } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'

const emit = defineEmits<{
  search: [data: MdItemQueryParams]
  reset: []
}>()

const visible = ref(false) // 搜索弹窗显示状态
const formData = reactive({
  code: '',
  name: '',
  itemTypeId: undefined as number | undefined,
  status: -1,
}) // 搜索表单数据
type ItemTypeTreeNode = Omit<MdItemTypeVO, 'children'> & {
  children?: ItemTypeTreeNode[]
}
const itemTypeTree = ref<ItemTypeTreeNode[]>([]) // 分类树数据

/** 搜索条件 placeholder 拼接 */
const placeholder = computed(() => {
  const conditions: string[] = []
  if (formData.code)
    conditions.push(`编码:${formData.code}`)
  if (formData.name)
    conditions.push(`名称:${formData.name}`)
  if (formData.status !== -1) {
    const label = getIntDictOptions(DICT_TYPE.COMMON_STATUS).find(d => d.value === formData.status)?.label
    conditions.push(`状态:${label || formData.status}`)
  }
  return conditions.length > 0 ? conditions.join(' | ') : '搜索物料产品'
})

/** 加载分类树 */
async function loadTree() {
  const data = await getItemTypeList()
  itemTypeTree.value = handleTree(toTreeNodes(data || []))
}

/** 转换为页面树节点 */
function toTreeNodes(data: MdItemTypeVO[]): ItemTypeTreeNode[] {
  return data.map(item => ({
    ...item,
    children: item.children ? toTreeNodes(item.children) : undefined,
  }))
}

/** 搜索按钮操作 */
function handleSearch() {
  visible.value = false
  const params: MdItemQueryParams = {}
  if (formData.code)
    params.code = formData.code
  if (formData.name)
    params.name = formData.name
  if (formData.itemTypeId)
    params.itemTypeId = formData.itemTypeId
  if (formData.status !== -1)
    params.status = formData.status
  emit('search', params)
}

/** 重置按钮操作 */
function handleReset() {
  formData.code = ''
  formData.name = ''
  formData.itemTypeId = undefined
  formData.status = -1
  visible.value = false
  emit('reset')
}

/** 供外部调用重置 */
function resetFields() {
  formData.code = ''
  formData.name = ''
  formData.itemTypeId = undefined
  formData.status = -1
}

loadTree()

defineExpose({ resetFields })
</script>
