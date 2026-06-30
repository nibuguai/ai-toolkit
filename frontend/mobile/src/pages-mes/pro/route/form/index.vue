<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="路线编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="路线名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入路线名称" clearable />
          </wd-form-item>
          <wd-form-item title="路线说明" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入工艺路线说明" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
      <view v-if="currentId" class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        路线工序、关联产品和产品 BOM 已在详情页维护；保存主表后可返回详情页继续配置，启用前请确认配置完整。
      </view>
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
import type { ProRouteCreateReqVO, ProRouteUpdateReqVO, ProRouteVO } from '@/api/mes/pro/route'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createRoute, getRoute, updateRoute } from '@/api/mes/pro/route'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  PRO_ROUTE_CODE: 'PRO_ROUTE_CODE',
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/pro/route/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑工艺路线' : '新增工艺路线')
const formLoading = ref(false)
const formData = ref<Partial<ProRouteVO>>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '工艺路线编码不能为空' }],
  name: [{ required: true, message: '工艺路线名称不能为空' }],
})
const formRef = ref<FormInstance>()

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/pro/route/index')
}

/** 默认表单数据 */
function getDefaultFormData(): Partial<ProRouteVO> {
  return {
    code: '',
    name: '',
    description: '',
    remark: '',
  }
}

/** 加载工艺路线详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  formData.value = { ...getDefaultFormData(), ...await getRoute(currentId.value) }
}

/** 加载页面数据 */
async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 生成工艺路线编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.PRO_ROUTE_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): ProRouteCreateReqVO | ProRouteUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    description: formData.value.description || undefined,
    remark: formData.value.remark || undefined,
  }
  if (currentId.value) {
    return { ...data, id: currentId.value }
  }
  return data
}

/** 提交表单 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = buildSubmitData()
    if (currentId.value) {
      await updateRoute(data)
      toast.success('修改成功')
    } else {
      await createRoute(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:pro:route:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
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
