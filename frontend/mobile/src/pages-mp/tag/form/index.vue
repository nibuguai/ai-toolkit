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
          <wd-form-item title="标签名称" title-width="180rpx" prop="name">
            <wd-input v-model="formData.name" clearable placeholder="请输入标签名称" />
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
import type { Tag } from '@/api/mp/tag'
import { onLoad } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { createTag, getTag, updateTag } from '@/api/mp/tag'
import { delay, navigateBackPlus } from '@/utils'
import { createFormSchema } from '@/utils/wot'
import { getMpRouteNumber, useMpRouteParams } from '../../utils/route'

const props = defineProps<{
  id?: number | any
  accountId?: number | any
}>()
const { routeParams, syncRouteParams } = useMpRouteParams(props)

definePage({
  style: {
    navigationBarTitleText: '',
    navigationStyle: 'custom',
  },
})

const toast = useToast()
const id = computed(() => getMpRouteNumber(routeParams.id))
const accountId = computed(() => getMpRouteNumber(routeParams.accountId))
const getTitle = computed(() => id.value ? '编辑公众号标签' : '新增公众号标签')
const formLoading = ref(false) // 表单提交状态
const formData = ref<Tag>({
  id: undefined,
  accountId: accountId.value,
  name: '',
}) // 表单数据
const formSchema = createFormSchema({
  name: [{ required: true, message: '标签名称不能为空' }],
})
const formRef = ref<FormInstance>() // 表单组件引用

/** 返回上一页 */
function handleBack() {
  navigateBackPlus('/pages-mp/tag/index')
}

/** 加载详情 */
async function getDetail() {
  if (!id.value) {
    return
  }
  try {
    formData.value = await getTag(id.value)
  } catch {
    // 请求层已提示错误，保留默认表单
  }
}

/** 提交表单 */
async function handleSubmit() {
  const { valid } = await formRef.value.validate()
  if (!valid) {
    return
  }

  formLoading.value = true
  try {
    if (id.value) {
      await updateTag({ ...formData.value, id: id.value, accountId: accountId.value })
      toast.success('修改成功')
    } else {
      await createTag({ ...formData.value, accountId: accountId.value })
      toast.success('新增成功')
    }
    uni.$emit('mp:tag:reload')
    delay(handleBack)
  } finally {
    formLoading.value = false
  }
}

/** 初始化 */
onLoad((query) => {
  syncRouteParams(query)
  if (!id.value) {
    formData.value.accountId = accountId.value
  }
  getDetail()
})
</script>
