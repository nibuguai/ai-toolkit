<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-tree-select
            v-model="formData.parentId"
            :data="itemTypeTree"
            label="上级分类"
            prop="parentId"
            label-width="220rpx"
            placeholder="请选择上级分类"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
              disabled: 'disabled',
            }"
          />
          <wd-form-item title="分类编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入分类编码或点击自动生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  自动生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="分类名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入分类名称" clearable />
          </wd-form-item>
          <wd-form-item title="物料/产品标识" title-width="220rpx" prop="itemOrProduct">
            <wd-radio-group v-model="formData.itemOrProduct" type="button">
              <wd-radio
                v-for="dict in getStrDictOptions(DICT_TYPE.MES_MD_ITEM_OR_PRODUCT)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="显示排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- 底部安全区域 -->
      <view class="h-160rpx" />
    </scroll-view>

    <!-- 底部保存按钮 -->
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { MdItemTypeVO } from '@/api/mes/md/item/type'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createItemType, getItemType, getItemTypeList, updateItemType } from '@/api/mes/md/item/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string, parentId?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/item/type/form/index')
const routeId = computed(() => getRouteQueryNumber('id')) // 当前路由编号
const routeParentId = computed(() => getRouteQueryNumber('parentId')) // 当前父分类编号
const isEdit = computed(() => routeId.value !== undefined)
const getTitle = computed(() => isEdit.value ? '编辑物料产品分类' : '新增物料产品分类')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MdItemTypeVO>(createDefaultFormData()) // 表单数据

/** 创建默认表单数据 */
function createDefaultFormData(): MdItemTypeVO {
  return {
    id: undefined,
    parentId: Number(routeParentId.value) || 0,
    code: '',
    name: '',
    itemOrProduct: 'ITEM',
    sort: 0,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}
const formSchema = createFormSchema({
  parentId: [{ required: true, message: '上级分类不能为空' }],
  code: [{ required: true, message: '分类编码不能为空' }],
  name: [{ required: true, message: '分类名称不能为空' }],
  itemOrProduct: [{ required: true, message: '物料/产品标识不能为空' }],
  sort: [{ required: true, message: '显示排序不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
type ItemTypeTreeNode = Omit<MdItemTypeVO, 'children'> & {
  children?: ItemTypeTreeNode[]
  disabled?: boolean
}
const itemTypeTree = ref<ItemTypeTreeNode[]>([]) // 分类树数据

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/type/index')
}

/** 标记树中指定 ID 集合的节点为禁用 */
function markDisabled(nodes: ItemTypeTreeNode[], disabledIds: Set<number>) {
  for (const node of nodes) {
    if (node.id !== undefined && disabledIds.has(node.id)) {
      node.disabled = true
    }
    if (node.children) {
      markDisabled(node.children, disabledIds)
    }
  }
}

/** 收集自身及所有子孙节点 ID */
function collectDescendantIds(nodes: ItemTypeTreeNode[], targetId: number): number[] {
  for (const node of nodes) {
    if (node.id === undefined) {
      continue
    }
    if (node.id === targetId) {
      return [node.id, ...collectAllChildrenIds(node.children || [])]
    }
    if (node.children) {
      const result = collectDescendantIds(node.children, targetId)
      if (result.length > 0)
        return result
    }
  }
  return []
}

function collectAllChildrenIds(children: ItemTypeTreeNode[]): number[] {
  return children.flatMap((child) => {
    const childIds = collectAllChildrenIds(child.children || [])
    return child.id === undefined ? childIds : [child.id, ...childIds]
  })
}

/** 转换为页面树节点，保留禁用标识扩展位 */
function toTreeNodes(data: MdItemTypeVO[]): ItemTypeTreeNode[] {
  return data.map(item => ({
    ...item,
    children: item.children ? toTreeNodes(item.children) : undefined,
  }))
}

/** 加载分类树 */
async function loadTree() {
  const data = await getItemTypeList()
  const tree = handleTree(toTreeNodes(data || []))
  // 编辑时标记自身及子孙为禁用
  if (isEdit.value) {
    const excludeIds = collectDescendantIds(tree, Number(routeId.value))
    markDisabled(tree, new Set(excludeIds))
  }
  // 增加"顶级分类"根节点
  itemTypeTree.value = [{ id: 0, name: '顶级分类', children: tree }]
}

/** 加载详情 */
async function getDetail() {
  if (!isEdit.value) {
    formData.value = createDefaultFormData()
    return
  }
  const data = await getItemType(Number(routeId.value))
  formData.value = {
    ...createDefaultFormData(),
    ...data,
  }
}

/** 自动生成分类编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_ITEM_TYPE_CODE')
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }

  formLoading.value = true
  try {
    // 构造数据副本，避免污染 formData
    const data = { ...formData.value }
    if (isEdit.value) {
      await updateItemType(data)
      toast.success('修改成功')
    } else {
      await createItemType(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:item:type:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadTree()
  await getDetail()
})

onShow(async () => {
  await loadTree()
  await getDetail()
})

watch([routeId, routeParentId], async () => {
  await loadTree()
  await getDetail()
})
</script>
