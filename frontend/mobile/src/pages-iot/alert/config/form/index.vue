<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar :title="getTitle" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item title="配置名称" title-width="220rpx" prop="name">
            <wd-input v-model="formData.name" placeholder="请输入配置名称" clearable />
          </wd-form-item>
          <wd-form-item title="告警级别" title-width="220rpx" center prop="level">
            <wd-radio-group v-model="formData.level" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.IOT_ALERT_LEVEL)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <wd-form-item title="配置状态" title-width="220rpx" center prop="status">
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)" :key="dict.value" :value="dict.value">
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <EntityPicker v-model="formData.sceneRuleIds" label="场景规则" prop="sceneRuleIds" :columns="sceneRuleOptions" type="checkbox" placeholder="请选择场景规则" label-width="220rpx" />
          <UserPicker v-model="formData.receiveUserIds" label="接收用户" prop="receiveUserIds" label-width="220rpx" />
          <EntityPicker v-model="formData.receiveTypes" label="接收类型" prop="receiveTypes" :columns="getIntDictOptions(DICT_TYPE.IOT_ALERT_RECEIVE_TYPE)" type="checkbox" placeholder="请选择接收类型" label-key="label" value-key="value" label-width="220rpx" />
          <wd-form-item v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.SMS)" title="短信模板" title-width="220rpx" prop="smsTemplateCode">
            <wd-input v-model="formData.smsTemplateCode" placeholder="请输入短信模板编码" clearable />
          </wd-form-item>
          <wd-form-item v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.MAIL)" title="邮件模板" title-width="220rpx" prop="mailTemplateCode">
            <wd-input v-model="formData.mailTemplateCode" placeholder="请输入邮件模板编码" clearable />
          </wd-form-item>
          <wd-form-item v-if="formData.receiveTypes?.includes(IotAlertReceiveTypeEnum.NOTIFY)" title="站内信模板" title-width="220rpx" prop="notifyTemplateCode">
            <wd-input v-model="formData.notifyTemplateCode" placeholder="请输入站内信模板编码" clearable />
          </wd-form-item>
          <wd-form-item title="配置描述" title-width="220rpx" prop="description">
            <wd-textarea v-model="formData.description" placeholder="请输入配置描述" :maxlength="300" show-word-limit />
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button type="primary" block :loading="formLoading" @click="handleSubmit">
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { AlertConfig } from '@/api/iot/alert/config'
import type { IotSceneRule } from '@/api/iot/rule/scene'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import { createAlertConfig, getAlertConfig, updateAlertConfig } from '@/api/iot/alert/config'
import { getSimpleRuleSceneList } from '@/api/iot/rule/scene'
import { getIntDictOptions } from '@/hooks/useDict'
import EntityPicker from '@/pages-iot/components/entity-picker.vue'
import { IotAlertReceiveTypeEnum } from '@/pages-iot/utils/constants'
import { UserPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{ id?: number | any }>()

definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑告警配置' : '新增告警配置')
const formLoading = ref(false) // 表单提交状态
const sceneRuleOptions = ref<IotSceneRule[]>([]) // 场景规则选项
const formData = ref<AlertConfig>({ id: undefined, name: '', description: '', level: undefined, status: CommonStatusEnum.ENABLE, sceneRuleIds: [], receiveUserIds: [], receiveTypes: [] }) // 表单数据
const formSchema = createFormSchema(() => ({
  name: [{ required: true, message: '配置名称不能为空' }],
  level: [{ required: true, message: '告警级别不能为空' }],
  status: [{ required: true, message: '配置状态不能为空' }],
  sceneRuleIds: [{ required: true, message: '场景规则不能为空' }],
  receiveUserIds: [{ required: true, message: '接收用户不能为空' }],
  receiveTypes: [{ required: true, message: '接收类型不能为空' }],
  smsTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.SMS), message: '短信模板不能为空' }],
  mailTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.MAIL), message: '邮件模板不能为空' }],
  notifyTemplateCode: [{ required: () => !!formData.value.receiveTypes?.includes(IotAlertReceiveTypeEnum.NOTIFY), message: '站内信模板不能为空' }],
}))
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() { navigateBackPlus('/pages-iot/alert/config/index') }

/** 加载告警配置详情 */
async function getDetail() {
  if (props.id)
    formData.value = await getAlertConfig(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid)
    return
  formLoading.value = true
  try {
    if (props.id) { await updateAlertConfig(formData.value); toast.success('修改成功') } else { await createAlertConfig(formData.value); toast.success('新增成功') }
    uni.$emit('iot:alert-config:reload')
    delay(handleBack)
  } finally { formLoading.value = false }
}

/** 初始化 */
onMounted(async () => { sceneRuleOptions.value = await getSimpleRuleSceneList(); getDetail() })
</script>
