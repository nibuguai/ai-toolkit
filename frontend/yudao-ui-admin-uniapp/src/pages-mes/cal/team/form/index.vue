<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <scroll-view class="min-h-0 flex-1" scroll-y scroll-with-animation>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="班组编码" title-width="220rpx" prop="code">
            <wd-input v-model="formData.code" placeholder="请输入或点击生成" clearable>
              <template #suffix>
                <wd-button size="small" type="primary" variant="plain" @click="handleGenerateCode">
                  生成
                </wd-button>
              </template>
            </wd-input>
          </wd-form-item>
          <wd-form-item title="班组名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入班组名称" clearable />
          </wd-form-item>
          <wd-form-item title="班组类型" title-width="220rpx" prop="calendarType">
            <wd-radio-group v-model="formData.calendarType" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.MES_CAL_CALENDAR_TYPE)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="备注" title-width="220rpx" prop="remark">
            <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="250" show-word-limit clearable />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>

      <TeamMemberList v-if="currentId" :team-id="currentId" editable />
      <view v-else class="mx-24rpx mt-24rpx rounded-12rpx bg-[#fff7e6] p-20rpx text-26rpx text-[#8a5a00]">
        新增班组保存后，可在编辑页维护班组成员。
      </view>
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
import type { CalTeamCreateReqVO, CalTeamUpdateReqVO, CalTeamVO } from '@/api/mes/cal/team'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import { createTeam, getTeam, updateTeam } from '@/api/mes/cal/team'
import { generateAutoCode } from '@/api/mes/md/autocode/record'
import { getIntDictOptions } from '@/hooks/useDict'
import { useRouteQuery } from '@/hooks/useRouteQuery'
import MesFooterActions from '@/pages-mes/components/mes-footer-actions.vue'
import { navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import TeamMemberList from '../components/team-member-list.vue'

const props = defineProps<{ id?: number | string }>()
const MesAutoCodeRuleCode = {
  CAL_TEAM_CODE: 'CAL_TEAM_CODE',
} as const

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const { getRouteQueryNumber } = useRouteQuery(props, '/pages-mes/cal/team/form/index')
// TODO @YunaiV：简单 id 参数优先直接用 props.id 接收，不需要 useRouteQuery/getRouteQueryNumber 包一层；多参数页面只保留其它 query 的 helper。
const currentId = computed(() => getRouteQueryNumber('id'))
const getTitle = computed(() => currentId.value ? '编辑班组' : '新增班组')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Partial<CalTeamVO>>(getDefaultFormData()) // 表单数据
const formSchema = createFormSchema({
  code: [{ required: true, message: '班组编码不能为空' }],
  name: [{ required: true, message: '班组名称不能为空' }],
  calendarType: [{ required: true, message: '班组类型不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mes/cal/team/index')
}

/** 默认表单数据 */
function getDefaultFormData(): Partial<CalTeamVO> {
  return {
    code: '',
    name: '',
    calendarType: undefined,
    remark: '',
  }
}

/** 加载详情 */
async function getDetail() {
  if (!currentId.value) {
    formData.value = getDefaultFormData()
    return
  }
  formData.value = { ...getDefaultFormData(), ...await getTeam(currentId.value) }
}

/** 生成班组编码 */
async function handleGenerateCode() {
  try {
    toast.loading('生成中...')
    formData.value.code = await generateAutoCode(MesAutoCodeRuleCode.CAL_TEAM_CODE)
    toast.close()
    toast.success('生成成功')
  } catch {
    toast.close()
  }
}

/** 构造提交数据 */
function buildSubmitData(): CalTeamCreateReqVO | CalTeamUpdateReqVO {
  const data = {
    code: formData.value.code || '',
    name: formData.value.name || '',
    calendarType: Number(formData.value.calendarType),
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
      await updateTeam(data)
      toast.success('修改成功')
    } else {
      await createTeam(data)
      toast.success('新增成功')
    }
    uni.$emit('mes:cal:team:reload')
    // TODO @YunaiV：成功后延迟返回统一改 delay(handleBack)，对齐 system/infra（本文件共 1 处 setTimeout(() => handleBack())）
    setTimeout(() => handleBack(), 500)
  } finally {
    formLoading.value = false
  }
}

onMounted(() => {
  getDetail()
})

watch(currentId, () => {
  getDetail()
})
</script>
