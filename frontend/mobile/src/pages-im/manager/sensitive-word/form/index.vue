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
          <wd-form-item title="敏感词" prop="word">
            <wd-input v-model="formData.word" placeholder="请输入敏感词" clearable />
          </wd-form-item>
          <wd-form-item title="状态" prop="status">
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
import type { ImManagerSensitiveWordVO } from '@/api/im/manager/sensitiveword'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref } from 'vue'
import {
  createManagerSensitiveWord,
  getManagerSensitiveWord,
  updateManagerSensitiveWord,
} from '@/api/im/manager/sensitiveword'
import { getIntDictOptions } from '@/hooks/useDict'
import { delay, navigateBackPlus } from '@/utils'
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
const formRef = ref<FormInstance>() // 表单组件引用
const formLoading = ref(false) // 表单提交状态
const formData = ref<ImManagerSensitiveWordVO>({
  word: '',
  status: 0,
}) // 表单数据
const formSchema = createFormSchema({
  word: [{ required: true, message: '敏感词不能为空' }],
  status: [{ required: true, message: '状态不能为空' }],
})

/** 表单标题 */
const getTitle = computed(() => props.id ? '编辑敏感词' : '新增敏感词')

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-im/manager/sensitive-word/index')
}

/** 加载详情 */
async function getDetail() {
  if (!props.id) {
    return
  }
  formData.value = await getManagerSensitiveWord(Number(props.id))
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) {
    return
  }
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (props.id) {
      await updateManagerSensitiveWord(data)
    } else {
      await createManagerSensitiveWord(data)
    }
    toast.success('保存成功')
    uni.$emit('im:manager:sensitive-word:reload')
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
