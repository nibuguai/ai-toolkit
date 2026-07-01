<template>
  <view class="mt-24rpx bg-white">
    <view class="flex items-center justify-between border-b border-b-[#f0f0f0] px-24rpx py-20rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        规则组成
      </view>
      <view
        class="border border-[#1677ff] rounded-8rpx px-20rpx py-8rpx text-24rpx text-[#1677ff]"
        @click.stop="openCreateForm"
      >
        新增分段
      </view>
    </view>
    <view v-if="loading" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      加载中...
    </view>
    <view v-else-if="list.length === 0" class="px-24rpx py-32rpx text-center text-26rpx text-[#999]">
      暂无规则组成
    </view>
    <view v-else class="px-24rpx py-8rpx">
      <view
        v-for="item in list"
        :key="item.id"
        class="border-b border-b-[#f5f5f5] py-20rpx last:border-b-0"
      >
        <view class="mb-12rpx flex items-start justify-between gap-16rpx">
          <view class="min-w-0 flex-1">
            <view class="text-28rpx text-[#333] font-medium">
              分段 {{ item.sort ?? '-' }}
            </view>
            <view class="mt-6rpx">
              <dict-tag v-if="item.type != null" :type="DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE" :value="item.type" />
              <text v-else class="text-26rpx text-[#999]">-</text>
            </view>
          </view>
          <view class="shrink-0 text-28rpx text-[#1677ff] font-semibold">
            长度 {{ item.length ?? '-' }}
          </view>
        </view>
        <view v-if="item.type === MesAutoCodePartTypeEnum.DATE" class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">日期格式：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.dateFormat || '-' }}</text>
        </view>
        <view v-if="item.type === MesAutoCodePartTypeEnum.FIXED_CHAR" class="mb-8rpx flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">固定字符：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.fixCharacter || '-' }}</text>
        </view>
        <template v-if="item.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER">
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">流水号起始：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.serialStartNo ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">流水号步长：</text>
            <text class="min-w-0 flex-1 truncate">{{ item.serialStep ?? '-' }}</text>
          </view>
          <view class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">是否循环：</text>
            <dict-tag
              v-if="item.cycleFlag !== undefined"
              :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
              :value="item.cycleFlag"
            />
            <text v-else>-</text>
          </view>
          <view v-if="item.cycleFlag" class="mb-8rpx flex items-center text-26rpx text-[#666]">
            <text class="mr-8rpx shrink-0 text-[#999]">循环方式：</text>
            <dict-tag
              v-if="item.cycleMethod != null"
              :type="DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD"
              :value="item.cycleMethod"
            />
            <text v-else>-</text>
          </view>
        </template>
        <view class="flex text-26rpx text-[#666]">
          <text class="mr-8rpx shrink-0 text-[#999]">备注：</text>
          <text class="min-w-0 flex-1 truncate">{{ item.remark || '-' }}</text>
        </view>
        <view class="mt-16rpx flex border-t border-t-[#f0f0f0] pt-16rpx text-center text-26rpx">
          <view class="flex-1 text-[#1677ff]" @click.stop="openUpdateForm(item)">
            编辑
          </view>
          <view class="flex-1 text-[#f56c6c]" @click.stop="handleDeletePart(item)">
            删除
          </view>
        </view>
      </view>
    </view>
  </view>

  <!-- 分段表单 -->
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
          {{ formTitle }}
        </view>
        <wd-button size="small" type="primary" :loading="formLoading" @click="handleSubmitForm">
          保存
        </wd-button>
      </view>
      <scroll-view class="min-h-0 flex-1" scroll-y>
        <wd-form ref="formRef" :model="formData" :schema="formSchema">
          <wd-cell-group border>
            <wd-form-item title="分段排序" title-width="220rpx" prop="sort" center>
              <wd-input-number v-model="formData.sort" :min="1" :precision="0" />
            </wd-form-item>
            <wd-form-item title="分段长度" title-width="220rpx" prop="length" center>
              <wd-input-number v-model="formData.length" :min="1" :max="50" :precision="0" />
            </wd-form-item>
            <wd-form-item title="分段类型" title-width="220rpx" prop="type">
              <wd-radio-group v-model="formData.type" type="button">
                <wd-radio
                  v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_PART_TYPE)"
                  :key="dict.value"
                  :value="dict.value"
                >
                  {{ dict.label }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item
              v-if="formData.type === MesAutoCodePartTypeEnum.DATE"
              title="日期格式"
              title-width="220rpx"
              prop="dateFormat"
            >
              <wd-radio-group v-model="formData.dateFormat" type="button">
                <wd-radio v-for="option in dateFormatOptions" :key="option" :value="option">
                  {{ option }}
                </wd-radio>
              </wd-radio-group>
            </wd-form-item>
            <wd-form-item
              v-if="formData.type === MesAutoCodePartTypeEnum.FIXED_CHAR"
              title="固定字符"
              title-width="220rpx"
              prop="fixCharacter"
            >
              <wd-input v-model="formData.fixCharacter" clearable placeholder="请输入固定字符" />
            </wd-form-item>
            <template v-if="formData.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER">
              <wd-form-item title="流水号起始" title-width="220rpx" prop="serialStartNo" center>
                <wd-input-number v-model="formData.serialStartNo" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="流水号步长" title-width="220rpx" prop="serialStep" center>
                <wd-input-number v-model="formData.serialStep" :min="1" :precision="0" />
              </wd-form-item>
              <wd-form-item title="是否循环" title-width="220rpx" prop="cycleFlag" center>
                <wd-radio-group v-model="formData.cycleFlag" type="button">
                  <wd-radio
                    v-for="dict in getBoolDictOptions(DICT_TYPE.INFRA_BOOLEAN_STRING)"
                    :key="String(dict.value)"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
              <wd-form-item
                v-if="formData.cycleFlag"
                title="循环方式"
                title-width="220rpx"
                prop="cycleMethod"
              >
                <wd-radio-group v-model="formData.cycleMethod" type="button">
                  <wd-radio
                    v-for="dict in getIntDictOptions(DICT_TYPE.MES_MD_AUTO_CODE_CYCLE_METHOD)"
                    :key="dict.value"
                    :value="dict.value"
                  >
                    {{ dict.label }}
                  </wd-radio>
                </wd-radio-group>
              </wd-form-item>
            </template>
            <wd-form-item title="备注" title-width="220rpx" prop="remark">
              <wd-textarea v-model="formData.remark" placeholder="请输入备注" :maxlength="200" show-word-limit clearable />
            </wd-form-item>
          </wd-cell-group>
        </wd-form>
      </scroll-view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import type {
  AutoCodePartCreateReqVO,
  AutoCodePartVO,
} from '@/api/mes/md/autocode/part'
import type { FormInstance } from '@wot-ui/ui/components/wd-form/types'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, onMounted, ref, watch } from 'vue'
import {
  createAutoCodePart,
  deleteAutoCodePart,
  getAutoCodePart,
  getAutoCodePartListByRuleId,
  updateAutoCodePart,
} from '@/api/mes/md/autocode/part'
import { getBoolDictOptions, getIntDictOptions } from '@/hooks/useDict'
import { getTopPopupModalStyle, getTopPopupStyle } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { MesAutoCodePartTypeEnum } from '@/utils/constants/biz-mes-enum'
import { createFormSchema } from '@/utils/wot'

interface PartFormData extends AutoCodePartCreateReqVO {
  id?: number
}

const props = defineProps<{
  ruleId: number
}>()

const toast = useToast()
const list = ref<AutoCodePartVO[]>([]) // 分段数据
const loading = ref(false) // 加载状态
const formVisible = ref(false) // 表单弹窗显示状态
const formLoading = ref(false) // 表单提交状态
const formType = ref<'create' | 'update'>('create') // 表单类型
const formRef = ref<FormInstance>() // 表单组件引用
const formData = ref<PartFormData>(getDefaultFormData()) // 表单数据
const dateFormatOptions = ['yyyy', 'yyyyMM', 'yyyyMMdd', 'yyyyMMddHH', 'yyyyMMddHHmm'] // 日期格式选项
const formTitle = computed(() => formType.value === 'create' ? '新增分段' : '编辑分段')
const formSchema = createFormSchema({
  sort: [
    { required: true, message: '分段排序不能为空' },
    { validator: value => Number(value) >= 1 || '分段排序不能小于 1' },
  ],
  type: [{ required: true, message: '分段类型不能为空' }],
  length: [
    { required: true, message: '分段长度不能为空' },
    { validator: value => (Number(value) >= 1 && Number(value) <= 50) || '分段长度必须在 1 到 50 之间' },
  ],
  dateFormat: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.DATE, message: '日期格式不能为空' },
  ],
  fixCharacter: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.FIXED_CHAR, message: '固定字符不能为空' },
  ],
  serialStartNo: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER, message: '流水号起始值不能为空' },
  ],
  serialStep: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER, message: '流水号步长不能为空' },
  ],
  cycleMethod: [
    { required: () => formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER && formData.value.cycleFlag === true, message: '循环方式不能为空' },
  ],
})

/** 默认表单数据 */
function getDefaultFormData(): PartFormData {
  return {
    id: undefined,
    ruleId: props.ruleId,
    sort: 1,
    type: undefined,
    length: undefined,
    dateFormat: undefined,
    fixCharacter: '',
    serialStartNo: undefined,
    serialStep: undefined,
    cycleFlag: false,
    cycleMethod: undefined,
    remark: '',
  }
}

/** 查询分段列表 */
async function queryList() {
  loading.value = true
  try {
    list.value = await getAutoCodePartListByRuleId(props.ruleId)
  } finally {
    loading.value = false
  }
}

/** 打开新增 */
function openCreateForm() {
  formType.value = 'create'
  const maxSort = list.value.length > 0 ? Math.max(...list.value.map(item => item.sort || 0)) : 0
  formData.value = {
    ...getDefaultFormData(),
    sort: maxSort + 1,
  }
  formVisible.value = true
}

/** 打开编辑 */
async function openUpdateForm(item: AutoCodePartVO) {
  if (!item.id) {
    return
  }
  formType.value = 'update'
  formVisible.value = true
  formLoading.value = true
  try {
    const detail = await getAutoCodePart(item.id)
    formData.value = {
      ...getDefaultFormData(),
      ...detail,
      ruleId: props.ruleId,
    }
  } finally {
    formLoading.value = false
  }
}

/** 删除分段 */
async function handleDeletePart(item: AutoCodePartVO) {
  if (!item.id) {
    return
  }
  const { confirm } = await uni.showModal({
    title: '提示',
    content: `确定要删除分段 ${item.sort ?? item.id} 吗？`,
  })
  if (!confirm) {
    return
  }
  await deleteAutoCodePart(item.id)
  toast.success('删除成功')
  queryList()
}

/** 提交表单 */
async function handleSubmitForm() {
  const result = await formRef.value?.validate()
  if (result && !result.valid) {
    return
  }
  formLoading.value = true
  try {
    const data = normalizeSubmitData()
    if (formType.value === 'update' && formData.value.id) {
      await updateAutoCodePart({ ...data, id: formData.value.id })
      toast.success('修改成功')
    } else {
      await createAutoCodePart(data)
      toast.success('新增成功')
    }
    formVisible.value = false
    queryList()
  } finally {
    formLoading.value = false
  }
}

/** 规范提交数据 */
function normalizeSubmitData(): AutoCodePartCreateReqVO {
  const data: AutoCodePartCreateReqVO = {
    ruleId: props.ruleId,
    sort: formData.value.sort,
    type: formData.value.type,
    length: formData.value.length,
    remark: formData.value.remark,
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.DATE) {
    data.dateFormat = formData.value.dateFormat
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.FIXED_CHAR) {
    data.fixCharacter = formData.value.fixCharacter
  }
  if (formData.value.type === MesAutoCodePartTypeEnum.SERIAL_NUMBER) {
    data.serialStartNo = formData.value.serialStartNo
    data.serialStep = formData.value.serialStep
    data.cycleFlag = formData.value.cycleFlag
    data.cycleMethod = formData.value.cycleFlag ? formData.value.cycleMethod : undefined
  }
  return data
}

/** 按分段类型清理无关字段 */
function resetTypeFields(type?: number) {
  if (type !== MesAutoCodePartTypeEnum.DATE) {
    formData.value.dateFormat = undefined
  }
  if (type !== MesAutoCodePartTypeEnum.FIXED_CHAR) {
    formData.value.fixCharacter = ''
  }
  if (type !== MesAutoCodePartTypeEnum.SERIAL_NUMBER) {
    formData.value.serialStartNo = undefined
    formData.value.serialStep = undefined
    formData.value.cycleFlag = false
    formData.value.cycleMethod = undefined
  }
}

watch(
  () => formData.value.type,
  (type) => {
    resetTypeFields(type)
  },
)

watch(
  () => formData.value.cycleFlag,
  (cycleFlag) => {
    if (!cycleFlag) {
      formData.value.cycleMethod = undefined
    }
  },
)

onMounted(() => {
  queryList()
})
</script>
