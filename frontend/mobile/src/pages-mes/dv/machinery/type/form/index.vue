<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <yd-tree-select v-model="formData.parentId" :data="itemTypeTree" label="上级类型" prop="parentId" label-width="220rpx" placeholder="请选择上级类型" :props="{ value: 'id', label: 'name', children: 'children', disabled: 'disabled' }" />
          <wd-form-item title="类型编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="类型名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入类型名称" clearable />
          </wd-form-item>
          <wd-form-item title="显示排序" title-width="220rpx" prop="sort" center>
            <wd-input-number v-model="formData.sort" :min="0" :precision="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view class="h-160rpx" />
    </scroll-view>
    <MesFooterActions>
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </MesFooterActions>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { DvMachineryTypeCreateReqVO, DvMachineryTypeVO } from '@/api/mes/dv/machinery/type'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createMachineryType, getMachineryType, getMachineryTypeList, updateMachineryType } from '@/api/mes/dv/machinery/type'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

const props = defineProps<{ id?: number | string, parentId?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/dv/machinery/type/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const currentParentId = computed(() => getRouteQueryNumber('parentId') || 0)
const getTitle = computed(() => currentId.value ? '编辑设备类型' : '新增设备类型')
const formLoading = ref(false)
interface MachineryTypeTreeNode extends DvMachineryTypeVO {
  disabled?: boolean
  children?: MachineryTypeTreeNode[]
}
interface MachineryTypeFormData extends DvMachineryTypeCreateReqVO {
  id?: number
  remark: string
}
const formData = ref<MachineryTypeFormData>(getDefaultFormData())
const formSchema = createFormSchema({ code: [{ required: true, message: '类型编码不能为空' }], name: [{ required: true, message: '类型名称不能为空' }], status: [{ required: true, message: '状态不能为空' }] })
const formRef = ref<FormInstance>()
const itemTypeTree = ref<MachineryTypeTreeNode[]>([])

function getDefaultFormData(): MachineryTypeFormData {
  return {
    parentId: currentParentId.value,
    code: '',
    name: '',
    sort: 0,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

function handleBack() {
  navigateBackPlus('/pages-mes/dv/machinery/type/index')
}

async function loadTree() {
  const data = await getMachineryTypeList()
  const disabledIds = new Set<number>()
  if (currentId.value) {
    const collectChildren = (parentId: number) => {
      disabledIds.add(parentId)
      data.filter(item => item.parentId === parentId).forEach(item => collectChildren(item.id))
    }
    collectChildren(currentId.value)
  }
  const tree = handleTree(data).map(node => markDisabled(node as MachineryTypeTreeNode, disabledIds))
  itemTypeTree.value = [{ id: 0, parentId: 0, code: '', name: '顶级类型', sort: 0, status: CommonStatusEnum.ENABLE, remark: null, createTime: '', children: tree }]
}

function markDisabled(node: MachineryTypeTreeNode, disabledIds: Set<number>): MachineryTypeTreeNode {
  return { ...node, disabled: disabledIds.has(node.id), children: node.children?.map(child => markDisabled(child, disabledIds)) }
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getMachineryType(currentId.value)
  formData.value = { id: data.id, parentId: data.parentId, code: data.code, name: data.name, sort: data.sort, status: data.status, remark: data.remark || '' }
}

async function loadPageData() {
  await loadTree()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_MACHINERY_TYPE_CODE')
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

async function handleSubmit() {
  if (!formRef.value)
    return
  const result = await formRef.value.validate()
  if (!result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data: DvMachineryTypeCreateReqVO = { parentId: formData.value.parentId, code: formData.value.code, name: formData.value.name, sort: formData.value.sort, status: formData.value.status, remark: formData.value.remark || undefined }
    if (currentId.value) {
      await updateMachineryType({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createMachineryType(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:dv:machinery-type:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
