<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="单位编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入单位编码" clearable />
          </wd-form-item>
          <wd-form-item title="单位名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入单位名称" clearable />
          </wd-form-item>
          <wd-form-item title="主单位" title-width="220rpx" prop="primaryFlag" center>
            <wd-switch v-model="formData.primaryFlag" />
          </wd-form-item>
          <template v-if="!formData.primaryFlag">
            <wd-form-item
              title="所属主单位"
              title-width="220rpx"
              prop="primaryId"
              is-link
              :value="primaryUnitDisplayValue"
              placeholder="请选择主单位"
              @click="primaryUnitVisible = true"
            />
            <wd-picker
              v-model:visible="primaryUnitVisible"
              :model-value="formData.primaryId"
              :columns="primaryUnitOptions"
              label-key="name"
              value-key="id"
              @confirm="handlePrimaryUnitConfirm"
            />
            <wd-form-item title="换算比例" title-width="220rpx" prop="changeRate" center>
              <wd-input-number v-model="formData.changeRate" :min="0.0001" :precision="4" />
            </wd-form-item>
          </template>
          <wd-form-item title="状态" title-width="220rpx" prop="status" center>
            <wd-switch
              v-model="formData.status"
              :active-value="CommonStatusEnum.ENABLE"
              :inactive-value="CommonStatusEnum.DISABLE"
            />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea
              v-model="formData.remark"
              placeholder="请输入备注"
              :maxlength="200"
              show-word-limit
              clearable
            />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

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
import type { MdUnitMeasureVO } from '@/api/mes/md/unitmeasure'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createUnitMeasure,
  getUnitMeasure,
  getUnitMeasureSimpleList,
  updateUnitMeasure,
} from '@/api/mes/md/unitmeasure'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

const props = defineProps<{ id?: number | string }>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/unitmeasure/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑计量单位' : '新增计量单位')
const formLoading = ref(false) // 表单提交状态
const formData = ref<MdUnitMeasureVO>(getDefaultFormData()) // 表单数据
const formRef = ref<FormInstance>() // 表单组件引用
const primaryUnitOptions = ref<MdUnitMeasureVO[]>([]) // 主单位选项
const primaryUnitVisible = ref(false) // 主单位选择器状态
const primaryUnitDisplayValue = computed(() => getWotPickerFormValue(
  primaryUnitOptions.value,
  formData.value.primaryId,
  { valueKey: 'id', labelKey: 'name' },
))
const formSchema = createFormSchema(() => ({
  code: [{ required: true, message: '单位编码不能为空' }],
  name: [{ required: true, message: '单位名称不能为空' }],
  primaryFlag: [{ required: true, message: '是否主单位不能为空' }],
  primaryId: [{ required: () => !formData.value.primaryFlag, message: '主单位不能为空' }],
  changeRate: [
    { required: () => !formData.value.primaryFlag, message: '换算比例不能为空' },
    { validator: value => formData.value.primaryFlag || Number(value) > 0 || '换算比例必须大于 0' },
  ],
  status: [{ required: true, message: '状态不能为空' }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/md/unitmeasure/index')
}

function getDefaultFormData(): MdUnitMeasureVO {
  return {
    id: undefined,
    code: '',
    name: '',
    primaryFlag: true,
    primaryId: undefined,
    changeRate: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

/** 加载主单位选项 */
async function loadPrimaryUnitOptions() {
  const list = await getUnitMeasureSimpleList()
  primaryUnitOptions.value = list.filter(item => item.primaryFlag && item.id !== currentId.value)
}

/** 加载计量单位详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = await getUnitMeasure(currentId.value)
}

async function loadPageData() {
  await loadPrimaryUnitOptions()
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 选择主单位 */
function handlePrimaryUnitConfirm({ value }: { value: Array<number | string> }) {
  formData.value.primaryId = value[0] === undefined ? undefined : Number(value[0])
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  const data: MdUnitMeasureVO = {
    ...formData.value,
    primaryId: formData.value.primaryFlag ? undefined : formData.value.primaryId,
    changeRate: formData.value.primaryFlag ? undefined : formData.value.changeRate,
  }
  formLoading.value = true
  try {
    if (currentId.value) {
      data.id = currentId.value
      await updateUnitMeasure(data)
      toast.success('修改成功')
    } else {
      await createUnitMeasure(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:unitmeasure:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

watch(() => formData.value.primaryFlag, (primaryFlag) => {
  if (primaryFlag) {
    formData.value.primaryId = undefined
    formData.value.changeRate = undefined
  }
})

/** 初始化 */
onMounted(async () => {
  await loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
