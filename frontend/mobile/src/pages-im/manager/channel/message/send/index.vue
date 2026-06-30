<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar
      title="推送频道消息"
      left-arrow placeholder safe-area-inset-top fixed
      @click-left="handleBack"
    />

    <!-- 表单区域 -->
    <view>
      <wd-form ref="formRef" :model="formData" :schema="formSchema">
        <wd-cell-group border>
          <wd-form-item
            title="所属频道"
            title-width="180rpx"
            prop="channelId"
            is-link
            :value="getWotPickerFormValue(channelOptions, formData.channelId)"
            placeholder="请选择频道"
            @click="pickerVisible.channel = true"
          />
          <wd-picker
            v-model:visible="pickerVisible.channel"
            :model-value="formData.channelId"
            :columns="channelOptions"
            @confirm="handleChannelConfirm"
          />
          <wd-form-item
            title="素材"
            title-width="180rpx"
            prop="materialId"
            is-link
            :value="getWotPickerFormValue(materialOptions, formData.materialId)"
            placeholder="请选择素材"
            @click="handleOpenMaterialPicker"
          />
          <wd-picker
            v-model:visible="pickerVisible.material"
            :model-value="formData.materialId"
            :columns="materialOptions"
            @confirm="({ value }) => formData.materialId = Number(value[0])"
          />
          <wd-form-item title="受众" title-width="180rpx" prop="receiverUserType" center>
            <wd-radio-group v-model="formData.receiverUserType" type="button">
              <wd-radio value="all">
                全员
              </wd-radio>
              <wd-radio value="users">
                指定用户
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
          <UserPicker
            v-if="formData.receiverUserType === 'users'"
            v-model="formData.receiverUserIds"
            label="接收用户"
            prop="receiverUserIds"
            type="checkbox"
            placeholder="请选择接收用户"
          />
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        确认推送
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { onMounted, ref } from 'vue'
import { getSimpleChannelList } from '@/api/im/manager/channel'
import { getSimpleManagerChannelMaterialList } from '@/api/im/manager/channel/material'
import { sendManagerChannelMessage } from '@/api/im/manager/channel/message'
import { UserPicker } from '@/components/system-select'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const pickerVisible = ref<Record<string, boolean>>({}) // 选择器状态
const channelOptions = ref<{ label: string, value: number }[]>([]) // 频道选项
const materialOptions = ref<{ label: string, value: number }[]>([]) // 素材选项
const formData = ref({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined,
  receiverUserType: 'all' as 'all' | 'users',
  receiverUserIds: [] as number[],
}) // 表单数据
const formSchema = createFormSchema(() => ({
  channelId: [{ required: true, message: '所属频道不能为空' }],
  materialId: [{ required: true, message: '素材不能为空' }],
  receiverUserIds: [{
    required: () => formData.value.receiverUserType === 'users',
    message: '接收用户不能为空',
  }],
}))

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/channel/message/index')
}

/** 加载频道选项 */
async function loadChannelOptions() {
  const list = await getSimpleChannelList()
  channelOptions.value = list.map(item => ({
    label: item.name,
    value: item.id,
  }))
}

/** 加载素材选项 */
async function loadMaterialOptions(channelId: number) {
  const list = await getSimpleManagerChannelMaterialList(channelId)
  materialOptions.value = list.map(item => ({
    label: item.title,
    value: item.id,
  }))
}

/** 选择频道 */
async function handleChannelConfirm({ value }: { value: Array<number | string> }) {
  const channelId = Number(value[0])
  formData.value.channelId = channelId
  formData.value.materialId = undefined
  materialOptions.value = []
  if (channelId) {
    await loadMaterialOptions(channelId)
  }
}

/** 打开素材选择器 */
async function handleOpenMaterialPicker() {
  if (!formData.value.channelId) {
    toast.show('请先选择频道')
    return
  }
  if (materialOptions.value.length === 0) {
    await loadMaterialOptions(formData.value.channelId)
  }
  pickerVisible.value.material = true
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid || !formData.value.materialId) {
    return
  }
  formLoading.value = true
  try {
    await sendManagerChannelMessage({
      materialId: formData.value.materialId,
      receiverUserIds: formData.value.receiverUserType === 'users'
        ? formData.value.receiverUserIds
        : undefined,
    })
    toast.success('推送成功')
    uni.$emit('im:manager:channel-message:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  loadChannelOptions()
})
</script>
