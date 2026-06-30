<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="供应商编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="供应商名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入供应商名称" clearable />
          </wd-form-item>
          <wd-form-item title="供应商简称" title-width="220rpx" prop="nickname">
            <wd-input v-model="formData.nickname" placeholder="请输入供应商简称" clearable />
          </wd-form-item>
          <wd-form-item title="英文名称" title-width="220rpx" prop="englishName">
            <wd-input v-model="formData.englishName" placeholder="请输入英文名称" clearable />
          </wd-form-item>
          <wd-form-item title="供应商等级" title-width="220rpx" prop="level">
            <wd-radio-group v-model="formData.level" type="button">
              <wd-radio v-for="dict in getStrDictOptions(DICT_TYPE.MES_VENDOR_LEVEL)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="供应商简介" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入供应商简介" :maxlength="500" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="供应商 LOGO" title-width="220rpx" prop="logo">
            <yd-upload-img v-model="formData.logo" directory="mes/md/vendor" />
          </wd-form-item>
          <wd-form-item title="供应商地址" title-width="220rpx" prop="address">
            <wd-textarea v-model="formData.address" placeholder="请输入供应商地址" :maxlength="200" show-word-limit clearable />
          </wd-form-item>
          <wd-form-item title="官网地址" title-width="220rpx" prop="website">
            <wd-input v-model="formData.website" placeholder="请输入官网地址" clearable />
          </wd-form-item>
          <wd-form-item title="邮箱地址" title-width="220rpx" prop="email">
            <wd-input v-model="formData.email" placeholder="请输入邮箱地址" clearable />
          </wd-form-item>
          <wd-form-item title="供应商电话" title-width="220rpx" prop="telephone">
            <wd-input v-model="formData.telephone" placeholder="请输入供应商电话" clearable />
          </wd-form-item>
          <wd-form-item title="供应商评分" title-width="220rpx" prop="score" center>
            <wd-input-number v-model="formData.score" :min="0" :max="100" :precision="0" />
          </wd-form-item>
          <wd-form-item title="联系人1" title-width="220rpx" prop="contact1Name">
            <wd-input v-model="formData.contact1Name" placeholder="请输入联系人1" clearable />
          </wd-form-item>
          <wd-form-item title="联系人1-电话" title-width="220rpx" prop="contact1Telephone">
            <wd-input v-model="formData.contact1Telephone" placeholder="请输入联系人1电话" clearable />
          </wd-form-item>
          <wd-form-item title="联系人1-邮箱" title-width="220rpx" prop="contact1Email">
            <wd-input v-model="formData.contact1Email" placeholder="请输入联系人1邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2" title-width="220rpx" prop="contact2Name">
            <wd-input v-model="formData.contact2Name" placeholder="请输入联系人2" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2-电话" title-width="220rpx" prop="contact2Telephone">
            <wd-input v-model="formData.contact2Telephone" placeholder="请输入联系人2电话" clearable />
          </wd-form-item>
          <wd-form-item title="联系人2-邮箱" title-width="220rpx" prop="contact2Email">
            <wd-input v-model="formData.contact2Email" placeholder="请输入联系人2邮箱" clearable />
          </wd-form-item>
          <wd-form-item title="信用代码" title-width="220rpx" prop="creditCode">
            <wd-input v-model="formData.creditCode" placeholder="请输入统一社会信用代码" clearable />
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
import type { MdVendorCreateReqVO } from '@/api/mes/md/vendor'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createVendor, getVendor, updateVendor } from '@/api/mes/md/vendor'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

const props = defineProps<{ id?: number | string }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/vendor/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑供应商' : '新增供应商')
const formLoading = ref(false)
interface MdVendorFormData extends MdVendorCreateReqVO {
  id?: number
  nickname: string
  englishName: string
  description: string
  logo: string
  level: string
  score: number
  address: string
  website: string
  email: string
  telephone: string
  contact1Name: string
  contact1Telephone: string
  contact1Email: string
  contact2Name: string
  contact2Telephone: string
  contact2Email: string
  creditCode: string
  remark: string
}
const formData = ref<MdVendorFormData>(getDefaultFormData())
const formSchema = createFormSchema({
  code: [{ required: true, message: '供应商编码不能为空' }],
  name: [{ required: true, message: '供应商名称不能为空' }],
  email: [{ type: 'email', message: '请输入正确的邮箱地址' }],
  contact1Email: [{ type: 'email', message: '请输入正确的联系人邮箱' }],
  contact2Email: [{ type: 'email', message: '请输入正确的联系人邮箱' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>()

function handleBack() {
  navigateBackPlus('/pages-mes/md/vendor/index')
}

function getDefaultFormData(): MdVendorFormData {
  return {
    code: '',
    name: '',
    nickname: '',
    englishName: '',
    description: '',
    logo: '',
    level: '',
    score: 0,
    address: '',
    website: '',
    email: '',
    telephone: '',
    contact1Name: '',
    contact1Telephone: '',
    contact1Email: '',
    contact2Name: '',
    contact2Telephone: '',
    contact2Email: '',
    creditCode: '',
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getVendor(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    nickname: data.nickname || '',
    englishName: data.englishName || '',
    description: data.description || '',
    logo: data.logo || '',
    level: data.level || '',
    score: data.score ?? 0,
    address: data.address || '',
    website: data.website || '',
    email: data.email || '',
    telephone: data.telephone || '',
    contact1Name: data.contact1Name || '',
    contact1Telephone: data.contact1Telephone || '',
    contact1Email: data.contact1Email || '',
    contact2Name: data.contact2Name || '',
    contact2Telephone: data.contact2Telephone || '',
    contact2Email: data.contact2Email || '',
    creditCode: data.creditCode || '',
    status: data.status,
    remark: data.remark || '',
  }
}

async function loadPageData() {
  if (currentId.value) {
    await getDetail()
    return
  }
  formData.value = getDefaultFormData()
}
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode('MD_VENDOR_CODE')
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
    const data: MdVendorCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name,
      nickname: formData.value.nickname || undefined,
      englishName: formData.value.englishName || undefined,
      description: formData.value.description || undefined,
      logo: formData.value.logo || undefined,
      level: formData.value.level || undefined,
      score: formData.value.score,
      address: formData.value.address || undefined,
      website: formData.value.website || undefined,
      email: formData.value.email || undefined,
      telephone: formData.value.telephone || undefined,
      contact1Name: formData.value.contact1Name || undefined,
      contact1Telephone: formData.value.contact1Telephone || undefined,
      contact1Email: formData.value.contact1Email || undefined,
      contact2Name: formData.value.contact2Name || undefined,
      contact2Telephone: formData.value.contact2Telephone || undefined,
      contact2Email: formData.value.contact2Email || undefined,
      creditCode: formData.value.creditCode || undefined,
      status: formData.value.status,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      await updateVendor({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createVendor(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:vendor:reload')
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
