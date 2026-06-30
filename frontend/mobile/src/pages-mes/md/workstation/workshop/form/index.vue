<template>
  <view class="yd-page-container">
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="车间编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" :disabled="!!currentId.value" clearable>
              <template v-if="!currentId.value" #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="车间名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入车间名称" clearable />
          </wd-form-item>
          <wd-form-item title="面积(㎡)" title-width="220rpx" prop="area" center>
            <wd-input-number v-model="formData.area" :min="0" :precision="2" />
          </wd-form-item>
          <wd-form-item title="负责人" title-width="220rpx">
            <view class="min-w-0 flex flex-1 items-center justify-end gap-12rpx">
              <view class="min-w-0 flex-1 truncate text-right text-28rpx" :class="chargeUserDisplayValue ? 'text-[#333]' : 'text-[#999]'" @click="userPickerVisible = true">
                {{ chargeUserDisplayValue || '请选择负责人' }}
              </view>
              <wd-button v-if="formData.chargeUserId !== undefined" size="small" variant="plain" @click.stop="formData.chargeUserId = undefined">
                清空
              </wd-button>
            </view>
          </wd-form-item>
          <wd-picker v-model:visible="userPickerVisible" :model-value="chargeUserPickerValue" :columns="userOptions" label-key="nickname" value-key="id" @confirm="handleUserConfirm" />
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
import type { User } from '@/api/system/user'
import type { MdWorkshopCreateReqVO } from '@/api/mes/md/workstation/workshop'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createWorkshop, getWorkshop, updateWorkshop } from '@/api/mes/md/workstation/workshop'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getSimpleUserList } from '@/api/system/user'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'

const props = defineProps<{ id?: number | string }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/md/workstation/workshop/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑车间' : '新增车间')
const formLoading = ref(false)
interface MdWorkshopFormData extends MdWorkshopCreateReqVO {
  id?: number
  area: number
  chargeUserId?: number
  remark: string
}
const formData = ref<MdWorkshopFormData>(getDefaultFormData())

function getDefaultFormData(): MdWorkshopFormData {
  return {
    code: '',
    name: '',
    area: 0,
    chargeUserId: undefined,
    status: CommonStatusEnum.ENABLE,
    remark: '',
  }
}
const formSchema = createFormSchema({
  code: [{ required: true, message: '车间编码不能为空' }],
  name: [{ required: true, message: '车间名称不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>()
const userOptions = ref<User[]>([])
const userPickerVisible = ref(false)
const chargeUserPickerValue = computed(() => formData.value.chargeUserId === undefined ? [] : [formData.value.chargeUserId])

const chargeUserDisplayValue = computed(() => {
  if (formData.value.chargeUserId === undefined) {
    return ''
  }
  const user = userOptions.value.find(u => u.id === formData.value.chargeUserId)
  return user?.nickname || user?.name || String(formData.value.chargeUserId)
})

function handleBack() {
  navigateBackPlus('/pages-mes/md/workstation/workshop/index')
}

async function loadOptions() {
  userOptions.value = await getSimpleUserList() || []
}

/** 负责人选择确认 */
function handleUserConfirm({ value }: { value: Array<number | string> }) {
  const userId = Number(value[0])
  formData.value.chargeUserId = Number.isFinite(userId) ? userId : undefined
}

async function getDetail() {
  if (!currentId.value) {
    return
  }
  const data = await getWorkshop(currentId.value)
  formData.value = {
    id: data.id,
    code: data.code,
    name: data.name,
    area: Number(data.area ?? 0),
    chargeUserId: data.chargeUserId ?? undefined,
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
    formData.value.code = await generateAutoCode('MD_WORKSHOP_CODE')
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
    const data: MdWorkshopCreateReqVO = {
      code: formData.value.code,
      name: formData.value.name,
      area: formData.value.area,
      chargeUserId: formData.value.chargeUserId,
      status: formData.value.status,
      remark: formData.value.remark || undefined,
    }
    if (currentId.value) {
      await updateWorkshop({ ...data, id: currentId.value })
      toast.success('修改成功')
    } else {
      await createWorkshop(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:md:workshop:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

onMounted(async () => {
  await loadOptions()
  await loadPageData()
})

watch(currentId, () => {
  loadPageData()
})
</script>
