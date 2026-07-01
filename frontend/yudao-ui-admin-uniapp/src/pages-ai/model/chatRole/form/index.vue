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
          <wd-form-item
            title="绑定模型"
            title-width="210rpx"
            prop="modelId"
            is-link
            :value="getWotPickerFormValue(chatModelOptions, formData.modelId, { labelKey: 'name', valueKey: 'id' })"
            placeholder="请选择模型"
            @click="pickerVisible.chatModel = true"
          />
          <wd-form-item title="角色名称" title-width="210rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入角色名称" />
          </wd-form-item>
          <wd-form-item title="头像" title-width="210rpx">
            <wd-input v-model="formData.avatar" clearable placeholder="请输入头像 URL" />
          </wd-form-item>
          <wd-form-item title="角色类别" title-width="210rpx">
            <wd-input v-model="formData.category" clearable placeholder="请输入角色类别" />
          </wd-form-item>
          <wd-form-item title="角色描述" title-width="210rpx">
            <wd-textarea v-model="formData.description" placeholder="请输入角色描述" clearable />
          </wd-form-item>
          <wd-form-item title="角色设定" title-width="210rpx" prop="systemMessage">
            <wd-textarea v-model="formData.systemMessage" placeholder="请输入角色设定" clearable />
          </wd-form-item>
          <wd-form-item
            title="引用知识库"
            title-width="210rpx"
            is-link
            :value="getSelectedNames(knowledgeOptions, formData.knowledgeIds, { labelKey: 'name', valueKey: 'id' })"
            placeholder="请选择知识库"
            @click="pickerVisible.knowledge = true"
          />
          <wd-form-item
            title="引用工具"
            title-width="210rpx"
            is-link
            :value="getSelectedNames(toolOptions, formData.toolIds, { labelKey: 'name', valueKey: 'id' })"
            placeholder="请选择工具"
            @click="pickerVisible.tool = true"
          />
          <wd-form-item
            title="引用 MCP"
            title-width="210rpx"
            is-link
            :value="getSelectedNames(mcpOptions, formData.mcpClientNames)"
            placeholder="请选择 MCP"
            @click="pickerVisible.mcp = true"
          />
          <wd-form-item title="是否公开" title-width="210rpx" center>
            <wd-switch v-model="formData.publicStatus" />
          </wd-form-item>
          <wd-form-item title="排序" title-width="210rpx">
            <wd-input-number v-model="formData.sort" :min="0" />
          </wd-form-item>
          <wd-form-item title="状态" title-width="210rpx" prop="status" center>
            <wd-radio-group v-model="formData.status" type="button">
              <wd-radio
                v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
                :key="dict.value"
                :value="dict.value"
              >
                {{ dict.label }}
              </wd-radio>
            </wd-radio-group>
          </wd-form-item>
        </wd-cell-group>
      </wd-form>
    </view>

    <!-- 绑定模型选择器 -->
    <wd-picker
      v-model:visible="pickerVisible.chatModel"
      :model-value="[formData.modelId]"
      :columns="chatModelOptions"
      label-key="name"
      value-key="id"
      @confirm="({ value }) => formData.modelId = Number(value[0])"
    />

    <!-- 引用知识库选择器 -->
    <wd-select-picker
      v-model="formData.knowledgeIds"
      v-model:visible="pickerVisible.knowledge"
      title="请选择知识库"
      :columns="knowledgeOptions"
      value-key="id"
      label-key="name"
      type="checkbox"
      filterable
      @update:model-value="value => formData.knowledgeIds = value.map(Number)"
    />

    <!-- 引用工具选择器 -->
    <wd-select-picker
      v-model="formData.toolIds"
      v-model:visible="pickerVisible.tool"
      title="请选择工具"
      :columns="toolOptions"
      value-key="id"
      label-key="name"
      type="checkbox"
      filterable
      @update:model-value="value => formData.toolIds = value.map(Number)"
    />

    <!-- 引用 MCP 选择器 -->
    <wd-select-picker
      v-model="formData.mcpClientNames"
      v-model:visible="pickerVisible.mcp"
      title="请选择 MCP"
      :columns="mcpOptions"
      type="checkbox"
      filterable
    />

    <!-- 底部保存按钮 -->
    <view class="yd-detail-footer">
      <wd-button
        type="primary"
        block
        :loading="formLoading"
        @click="handleSubmit"
      >
        保存
      </wd-button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import type { ChatRoleVO } from '@/api/ai/model/chatRole'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, reactive, ref } from 'vue'
import { getSimpleKnowledgeList } from '@/api/ai/knowledge/knowledge'
import { createChatRole, getChatRole, updateChatRole } from '@/api/ai/model/chatRole'
import { getModelSimpleList } from '@/api/ai/model/model'
import { getToolSimpleList } from '@/api/ai/model/tool'
import { getIntDictOptions, getStrDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema, getWotPickerFormValue } from '@/utils/wot'
import { AiModelTypeEnum } from '@/pages-ai/utils/constants'

const props = defineProps<{
  id?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑聊天角色' : '新增聊天角色')
const formLoading = ref(false) // 表单提交状态
const chatModelOptions = ref<any[]>([]) // 聊天模型选项
const knowledgeOptions = ref<any[]>([]) // 知识库选项
const toolOptions = ref<any[]>([]) // 工具选项
const mcpOptions = computed(() => getStrDictOptions(DICT_TYPE.AI_MCP_CLIENT_NAME)) // MCP 选项
const pickerVisible = reactive({
  chatModel: false,
  knowledge: false,
  tool: false,
  mcp: false,
}) // 选择弹窗显示状态
const formData = ref<ChatRoleVO>({
  modelId: undefined,
  name: '',
  avatar: '',
  category: '',
  sort: 0,
  description: '',
  systemMessage: '',
  publicStatus: true,
  status: CommonStatusEnum.ENABLE,
  knowledgeIds: [],
  toolIds: [],
  mcpClientNames: [],
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '角色名称不能为空' }],
  systemMessage: [{ required: true, message: '角色设定不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/model/chatRole/index')
}

/** 加载下拉选项 */
async function loadOptions() {
  const [models, knowledgeList, toolList] = await Promise.all([
    getModelSimpleList(AiModelTypeEnum.CHAT).catch(() => []),
    getSimpleKnowledgeList().catch(() => []),
    getToolSimpleList().catch(() => []),
  ])
  chatModelOptions.value = models
  knowledgeOptions.value = knowledgeList
  toolOptions.value = toolList
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getChatRole(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateChatRole(data)
      toast.success('修改成功')
    } else {
      await createChatRole(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:chat-role:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 获取多选展示文案 */
function getSelectedNames(
  options: Record<string, any>[],
  values?: Array<number | string>,
  keys: { labelKey?: string, valueKey?: string } = {},
) {
  if (!values || values.length === 0) {
    return ''
  }
  const { labelKey = 'label', valueKey = 'value' } = keys
  return values
    .map(value => options.find(item => String(item[valueKey]) === String(value))?.[labelKey])
    .filter(Boolean)
    .join('、')
}

/** 初始化 */
onMounted(async () => {
  await loadOptions()
  await getDetail()
})
</script>
