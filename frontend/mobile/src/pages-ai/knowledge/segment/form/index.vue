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
          <wd-cell
            v-if="formData.documentId"
            title="所属文档编号"
            :value="String(formData.documentId)"
          />
          <wd-form-item title="分段内容" title-width="200rpx" prop="content">
            <wd-textarea
              v-model="formData.content"
              placeholder="请输入分段内容"
              :maxlength="4000"
              show-word-limit
              clearable
            />
          </wd-form-item>
          <wd-form-item title="状态" title-width="200rpx" prop="status" center>
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
import type { KnowledgeSegmentVO } from '@/api/ai/knowledge/segment'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createKnowledgeSegment,
  getKnowledgeSegment,
  updateKnowledgeSegment,
} from '@/api/ai/knowledge/segment'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
import { CommonStatusEnum, DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'

const props = defineProps<{
  id?: number | any
  documentId?: number | any
  knowledgeId?: number | any
}>()

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const getTitle = computed(() => props.id ? '编辑分段' : '新增分段')
const formLoading = ref(false) // 表单提交状态
const formData = ref<KnowledgeSegmentVO>({
  knowledgeId: undefined,
  documentId: undefined,
  content: '',
  status: CommonStatusEnum.ENABLE,
}) // 表单数据
const formSchema = createFormSchema({
  content: [{ required: true, message: '分段内容不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-ai/knowledge/segment/index')
}

/** 加载详情 */
async function getDetail() {
  // 新增时，预填来自 query 的知识库/文档编号
  if (!props.id) {
    formData.value.knowledgeId = props.knowledgeId ? Number(props.knowledgeId) : undefined
    formData.value.documentId = props.documentId ? Number(props.documentId) : undefined
    return
  }
  formData.value = await getKnowledgeSegment(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }
  // 新增时必须携带知识库与文档编号
  if (!formData.value.knowledgeId || !formData.value.documentId) {
    toast.warning('缺少所属知识库或文档编号')
    return
  }

  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateKnowledgeSegment(data)
      toast.success('修改成功')
    } else {
      await createKnowledgeSegment(data)
      toast.success('新增成功')
    }
    uni.$emit('ai:knowledge-segment:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getDetail()
})
</script>
