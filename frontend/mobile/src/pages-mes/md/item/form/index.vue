<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="物料编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入物料编码或点击自动生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="物料名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入物料名称" clearable />
          </wd-form-item>
          <wd-form-item title="规格型号" title-width="220rpx" prop="specification">
            <wd-input v-model="formData.specification" placeholder="请输入规格型号" clearable />
          </wd-form-item>
          <wd-form-item title="计量单位" title-width="220rpx" prop="unitMeasureId" is-link :value="unitDisplayValue" placeholder="请选择计量单位" @click="unitPickerVisible = true" />
          <wd-picker v-model:visible="unitPickerVisible" :model-value="unitPickerValue" :columns="unitMeasureOptions" label-key="name" value-key="id" @confirm="({ value }) => formData.unitMeasureId = value[0]" />
          <yd-tree-select
            v-model="formData.itemTypeId"
            :data="itemTypeTree"
            label="物料分类"
            prop="itemTypeId"
            label-width="220rpx"
            placeholder="请选择物料分类"
            :props="{
              value: 'id',
              label: 'name',
              children: 'children',
            }"
            @confirm="handleItemTypeConfirm"
            @change="handleItemTypeChange"
          />
          <wd-cell title="物料/产品标识">
            <dict-tag v-if="formData.itemOrProduct" :type="DICT_TYPE.MES_MD_ITEM_OR_PRODUCT" :value="formData.itemOrProduct" />
            <text v-else>-</text>
          </wd-cell>
          <wd-cell title="状态">
            <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="formData.status" />
          </wd-cell>
          <wd-cell title="高值物料">
            <view class="flex justify-end">
              <wd-switch v-model="formData.highValue" />
            </view>
          </wd-cell>
          <wd-cell title="批次管理">
            <view class="flex justify-end">
              <wd-switch v-model="formData.batchFlag" />
            </view>
          </wd-cell>
          <wd-cell title="安全库存">
            <view class="flex justify-end">
              <wd-switch v-model="formData.safeStockFlag" />
            </view>
          </wd-cell>
          <wd-form-item v-if="formData.safeStockFlag" title="最低库存量" title-width="220rpx" prop="minStock" center>
            <wd-input-number v-model="formData.minStock" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item v-if="formData.safeStockFlag" title="最高库存量" title-width="220rpx" prop="maxStock" center>
            <wd-input-number v-model="formData.maxStock" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <!-- BOM 组成入口（编辑模式） -->
      <view v-if="currentId" class="px-24rpx pb-24rpx">
        <wd-cell-group border>
          <wd-cell title="BOM 组成" is-link @click="handleBom" />
          <wd-cell v-if="formData.batchFlag" title="批次属性" is-link @click="handleBatchConfig" />
          <wd-cell title="产品 SIP" is-link @click="handleSip" />
          <wd-cell title="产品 SOP" is-link @click="handleSop" />
        </wd-cell-group>
      </view>

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
import type { MdItemCreateReqVO, MdItemVO } from '@/api/mes/md/item'
import type { MdItemTypeVO } from '@/api/mes/md/item/type'
import type { MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createItem, getItem, updateItem } from '@/api/mes/md/item'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getItemTypeList } from '@/api/mes/md/item/type'
import { getUnitMeasureSimpleList } from '@/api/mes/md/unitmeasure'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { handleTree } from '@/utils/tree'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

/** 表单本地状态（包含仅用于展示的字段） */
interface MdItemFormData extends Omit<MdItemCreateReqVO, 'unitMeasureId' | 'itemTypeId'> {
  unitMeasureId?: number // 初始 undefined，选择后才赋值
  itemTypeId?: number // 初始 undefined，选择后才赋值
  itemOrProduct: string // 分类派生展示
  status: number // 只读展示
}

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/item/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id')) // 当前物料编号
const getTitle = computed(() => currentId.value ? '编辑物料产品' : '新增物料产品')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MdItemFormData>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '物料编码不能为空' }],
  name: [{ required: true, message: '物料名称不能为空' }],
  unitMeasureId: [{ required: true, message: '计量单位不能为空' }],
  itemTypeId: [{ required: true, message: '物料分类不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用
const unitMeasureOptions = ref<MdUnitMeasureVO[]>([]) // 计量单位选项
const unitPickerVisible = ref(false) // 单位选择器状态
const itemTypeTree = ref<MdItemTypeVO[]>([]) // 分类树数据
const itemTypeFlat = ref<MdItemTypeVO[]>([]) // 分类扁平列表

/** 计量单位展示值 */
const unitDisplayValue = computed(() => getWotPickerFormValue(unitMeasureOptions.value, formData.value.unitMeasureId, { valueKey: 'id', labelKey: 'name' }))
const unitPickerValue = computed(() => formData.value.unitMeasureId === undefined ? [] : [formData.value.unitMeasureId])

/** 进入 BOM 组成 */
function handleBom() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/bom/index?itemId=${currentId.value}&mode=edit` })
}

/** 进入批次属性配置 */
function handleBatchConfig() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/batch-config/index?itemId=${currentId.value}&mode=edit` })
}

/** 进入产品 SIP */
function handleSip() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sip/index?itemId=${currentId.value}&mode=edit` })
}

/** 进入产品 SOP */
function handleSop() {
  if (!currentId.value)
    return
  uni.navigateTo({ url: `/pages-mes/md/item/sop/index?itemId=${currentId.value}&mode=edit` })
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/item/index')
}

/** 默认表单数据 */
function getDefaultFormData(): MdItemFormData {
  return {
    code: '',
    name: '',
    specification: '',
    unitMeasureId: undefined,
    itemTypeId: undefined,
    itemOrProduct: '',
    status: CommonStatusEnum.DISABLE,
    highValue: false,
    batchFlag: true,
    safeStockFlag: false,
    minStock: 0,
    maxStock: 0,
    remark: '',
  }
}

/** 加载选项数据 */
async function loadOptions() {
  const [units, types] = await Promise.all([
    getUnitMeasureSimpleList(),
    getItemTypeList(),
  ])
  unitMeasureOptions.value = units || []
  itemTypeFlat.value = types || []
  itemTypeTree.value = handleTree(types || []) as MdItemTypeVO[]
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data: MdItemVO = await getItem(currentId.value)
  formData.value = {
    code: data.code,
    name: data.name,
    specification: data.specification || '',
    unitMeasureId: data.unitMeasureId,
    itemTypeId: data.itemTypeId,
    itemOrProduct: data.itemOrProduct || '',
    status: data.status,
    highValue: data.highValue,
    batchFlag: data.batchFlag,
    safeStockFlag: data.safeStockFlag,
    minStock: data.minStock,
    maxStock: data.maxStock,
    remark: data.remark || '',
  }
}

/** 加载页面数据 */
async function loadPageData() {
  await loadOptions()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 分类选择确认：从 selectedNode 同步 itemOrProduct */
function handleItemTypeConfirm(payload: { selectedNode?: MdItemTypeVO }) {
  const node = payload?.selectedNode
  if (node?.itemOrProduct) {
    formData.value.itemOrProduct = node.itemOrProduct
  } else if (node) {
    const found = itemTypeFlat.value.find(t => t.id === node.id)
    formData.value.itemOrProduct = found?.itemOrProduct || ''
  }
}

/** 分类变更（清空时同步清空标识） */
function handleItemTypeChange(value: number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    formData.value.itemOrProduct = ''
  }
}

/** 自动生成物料编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_ITEM_CODE')
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
  // 类型守卫：校验通过后 unitMeasureId 和 itemTypeId 一定非空
  if (formData.value.unitMeasureId === undefined || formData.value.itemTypeId === undefined) {
    return
  }

  formLoading.value = true
  try {
    const req: MdItemCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name,
      specification: formData.value.specification || undefined,
      unitMeasureId: formData.value.unitMeasureId,
      itemTypeId: formData.value.itemTypeId,
      highValue: formData.value.highValue,
      batchFlag: formData.value.batchFlag,
      safeStockFlag: formData.value.safeStockFlag,
      minStock: formData.value.safeStockFlag ? formData.value.minStock : undefined,
      maxStock: formData.value.safeStockFlag ? formData.value.maxStock : undefined,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      const updateReq = { ...req, id: currentId.value }
      await updateItem(updateReq)
      toast.success('修改成功')
      uni.$emit('mes:md:item:reload')
      // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 2 处 setTimeout(() => handleBack())）
      setTimeout(() => handleBack(), 500)
    } else {
      const id = await createItem(req)
      toast.success('新增成功')
      uni.$emit('mes:md:item:reload')
      setTimeout(() => {
        uni.redirectTo({ url: `/pages-mes/md/item/form/index?id=${id}` })
      }, 500)
    }
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(async () => {
  await loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
