<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        保养项目
      </view>
      <view v-if="readonly" class="text-24rpx text-[#999]">
        只读
      </view>
      <wd-button v-else size="small" type="primary" variant="plain" @click="openCreateForm">
        添加项目
      </wd-button>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无关联项目
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-center justify-between gap-16rpx">
          <view class="min-w-0 flex-1 truncate text-28rpx text-[#333] font-medium">
            {{ item.subjectName || item.subjectCode || '-' }}
          </view>
          <view class="shrink-0 text-24rpx text-[#999]">
            {{ item.subjectCode || '-' }}
          </view>
        </view>
        <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目类型：</text>
          <dict-tag v-if="item.subjectType != null" :type="DICT_TYPE.MES_DV_SUBJECT_TYPE" :value="item.subjectType" />
          <text v-else>-</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">项目内容：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectContent || '-' }}</text>
        </view>
        <view class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">标准：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.subjectStandard || '-' }}</text>
        </view>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 添加项目弹窗 -->
  <!-- TODO @YunaiV：本 wd-popup 去掉 transition="fade" :duration="0"，对齐 system/infra（基线不带这俩属性） -->
  <wd-popup
    v-model="formVisible"
    position="top"
    transition="fade"
    :duration="0"
    :custom-style="getTopPopupStyle()"
    :modal-style="getTopPopupModalStyle()"
  >
    <view class="h-full flex flex-col bg-[#f5f5f5]">
      <view class="flex items-center justify-between bg-white px-24rpx py-20rpx">
        <wd-button variant="plain" size="small" @click="formVisible = false">
          取消
        </wd-button>
        <view class="text-32rpx text-[#333] font-semibold">
          添加项目
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmit">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="项目" title-width="200rpx" prop="subjectId">
              <view class="min-h-56rpx flex items-center justify-between rounded-8rpx px-4rpx" @click.stop="openSubjectSelector">
                <text :class="selectedSubjectText ? 'text-[#333]' : 'text-[#999]'">
                  {{ selectedSubjectText || '请选择项目' }}
                </text>
                <wd-icon name="arrow-right" size="28rpx" color="#999" />
              </view>
            </wd-form-item>
            <wd-form-item title="备注" title-width="200rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
  <SubjectSelector ref="subjectSelectorRef" :existing-ids="existingSubjectIds" @confirm="handleSubjectConfirm" />
</template>

<script lang="ts" setup>
import type { DvCheckPlanSubjectVO } from '@/api/mes/dv/checkplan/subject'
import type { DvSubjectVO } from '@/api/mes/dv/subject'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref, watch } from 'vue'
import { create, getListByPlan } from '@/api/mes/dv/checkplan/subject'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { createFormSchema } from '@/utils/wot'
import SubjectSelector from '../../subject/components/subject-selector.vue'

const props = defineProps<{
  planId?: number
  readonly?: boolean
}>()

const toast = useToast()
const loading = ref(false) // 列表加载状态
const list = ref<DvCheckPlanSubjectVO[]>([]) // 项目清单
const formVisible = ref(false) // 添加弹窗显示状态
const formLoading = ref(false) // 添加提交状态
const formRef = ref<FormInstance>() // 表单引用
const formData = ref({
  subjectId: undefined as number | undefined,
  remark: '',
}) // 添加表单数据
const selectedSubject = ref<DvSubjectVO>() // 当前选择项目
const subjectSelectorRef = ref<InstanceType<typeof SubjectSelector>>() // 项目选择器引用
const formSchema = createFormSchema({
  subjectId: [{ required: true, message: '项目不能为空' }],
})
const existingSubjectIds = computed(() => list.value.map(item => item.subjectId))
const selectedSubjectText = computed(() => {
  if (!selectedSubject.value) {
    return ''
  }
  return `${selectedSubject.value.code || '-'} ${selectedSubject.value.name || ''}`.trim()
})

/** 查询项目清单 */
async function getList() {
  if (!props.planId) {
    list.value = []
    return
  }
  loading.value = true
  try {
    list.value = await getListByPlan(props.planId)
  } finally {
    loading.value = false
  }
}

/** 打开添加弹窗 */
function openCreateForm() {
  formData.value = {
    subjectId: undefined,
    remark: '',
  }
  selectedSubject.value = undefined
  formVisible.value = true
}

/** 打开项目选择器 */
function openSubjectSelector() {
  subjectSelectorRef.value?.open()
}

/** 确认选择项目 */
function handleSubjectConfirm(item: DvSubjectVO) {
  selectedSubject.value = item
  formData.value.subjectId = item.id
}

/** 提交添加项目 */
async function handleSubmit() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  if (!props.planId || !formData.value.subjectId) {
    return
  }
  formLoading.value = true
  try {
    await create({
      planId: props.planId,
      subjectId: formData.value.subjectId,
      remark: formData.value.remark || undefined,
    })
    toast.success('添加成功')
    formVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

watch(
  () => props.planId,
  () => {
    getList()
  },
  { immediate: true },
)
</script>
