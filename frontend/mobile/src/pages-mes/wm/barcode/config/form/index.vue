<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      :title="getTitle"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="条码格式" title-width="220rpx" prop="format">
            <wd-radio-group v-model="formData.format" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_FORMAT)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="业务类型" title-width="220rpx" prop="bizType">
            <wd-radio-group v-if="!currentId" v-model="formData.bizType" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
            <view v-else class="py-8rpx text-28rpx text-[#666]">
              {{ getDictLabel(DICT_TYPE.MES_WM_BARCODE_BIZ_TYPE, formData.bizType) || '-' }}
            </view>
          </wd-form-item>
          <wd-form-item title="内容格式模板" title-width="220rpx" prop="contentFormat">
            <wd-input
              v-model="formData.contentFormat"
              placeholder="支持 {BUSINESSCODE} 占位符，如 WH-{BUSINESSCODE}"
              :maxlength="100"
              clearable
            />
          </wd-form-item>
          <wd-form-item title="内容样例" title-width="220rpx" prop="contentExample">
            <wd-input
              v-model="formData.contentExample"
              placeholder="如 WH-WH001"
              :maxlength="100"
              clearable
            />
          </wd-form-item>
          <wd-form-item title="自动生成" title-width="220rpx" prop="autoGenerateFlag" center>
            <wd-switch v-model="formData.autoGenerateFlag" />
          </wd-form-item>
          <wd-form-item title="默认打印模板" title-width="220rpx" prop="defaultTemplate">
            <wd-input
              v-model="formData.defaultTemplate"
              readonly
              placeholder="报表/打印专项维护"
            />
          </wd-form-item>
          <view class="px-24rpx pb-20rpx text-24rpx text-[#999] leading-36rpx">
            默认打印模板暂不在移动端选择；正式打印和模板维护归入报表/打印专项。
          </view>
          <wd-form-item title="状态" title-width="220rpx" prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
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
import type { WmBarcodeConfigCreateReqVO, WmBarcodeConfigUpdateReqVO } from '@/api/mes/wm/barcode/config'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createBarcodeConfig, getBarcodeConfig, updateBarcodeConfig } from '@/api/mes/wm/barcode/config'
import { getDictLabel, getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | string
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/wm/barcode/config/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑条码配置' : '新增条码配置')
const formLoading = ref(false) // 表单提交状态
interface BarcodeConfigFormData {
  id?: number
  format?: number
  bizType?: number
  contentFormat: string
  contentExample: string
  autoGenerateFlag: boolean
  defaultTemplate: string
  status: number
  remark: string
}
const formData = ref<BarcodeConfigFormData>(getDefaultFormData()) // 表单数据

function getDefaultFormData(): BarcodeConfigFormData {
  return {
    id: undefined,
    format: undefined,
    bizType: undefined,
    contentFormat: '',
    contentExample: '',
    autoGenerateFlag: true,
    defaultTemplate: '',
    status: 0,
    remark: '',
  }
}
const formSchema = createFormSchema({
  format: [{ required: true, message: '条码格式不能为空' }],
  bizType: [{ required: true, message: '业务类型不能为空' }],
  contentFormat: [
    { required: true, message: '内容格式模板不能为空' },
    { max: 100, message: '内容格式模板长度不能超过 100 个字符' },
  ],
  contentExample: [{ max: 100, message: '内容样例长度不能超过 100 个字符' }],
  autoGenerateFlag: [{ required: true, message: '是否自动生成不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
  remark: [{ max: 200, message: '备注长度不能超过 200 个字符' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/wm/barcode/config/index')
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getBarcodeConfig(currentId.value)
  formData.value = {
    id: data.id,
    format: data.format,
    bizType: data.bizType,
    contentFormat: data.contentFormat || '',
    contentExample: data.contentExample || '',
    autoGenerateFlag: data.autoGenerateFlag,
    defaultTemplate: data.defaultTemplate || '',
    status: data.status,
    remark: data.remark || '',
  }
}

/** 加载页面数据 */
async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}

/** 构造提交数据 */
function buildSubmitData(): WmBarcodeConfigCreateReqVO | WmBarcodeConfigUpdateReqVO {
  const data: WmBarcodeConfigCreateReqVO = {
    format: Number(formData.value.format),
    bizType: Number(formData.value.bizType),
    contentFormat: formData.value.contentFormat,
    contentExample: formData.value.contentExample || undefined,
    autoGenerateFlag: formData.value.autoGenerateFlag,
    defaultTemplate: formData.value.defaultTemplate || undefined,
    status: formData.value.status,
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
      await updateBarcodeConfig(data as WmBarcodeConfigUpdateReqVO)
      toast.success('修改成功')
    } else {
      await createBarcodeConfig(data as WmBarcodeConfigCreateReqVO)
      toast.success('新增成功')
    }
    uni.$emit('mes:wm:barcode:config:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => {
      handleBack()
    }, 500)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
