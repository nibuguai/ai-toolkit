<template>
  <view class="yd-page-container">
    <!-- 顶部导航栏 -->
    <wd-navbar title="物模型详情" left-arrow placeholder safe-area-inset-top fixed @click-left="handleBack" />

    <!-- 详情内容 -->
    <view>
      <wd-cell-group border>
        <wd-cell title="功能编号" :value="String(formData?.id || '-')" />
        <wd-cell title="产品编号" :value="String(formData?.productId || '-')" />
        <wd-cell title="功能类型">
          <dict-tag :type="DICT_TYPE.IOT_THING_MODEL_TYPE" :value="formData?.type" />
        </wd-cell>
        <wd-cell title="功能名称" :value="formData?.name || '-'" />
        <wd-cell title="标识符" :value="formData?.identifier || '-'" />
        <wd-cell title="功能描述" :value="formData?.description || '-'" />
        <wd-cell title="创建时间" :value="formatDateTime(formData?.createTime) || '-'" />
      </wd-cell-group>

      <!-- 功能定义 -->
      <view class="mt-20rpx">
        <wd-cell-group border>
          <!-- 属性 -->
          <template v-if="isProperty">
            <wd-cell title="数据类型" :value="getDataTypeOptionsLabel(property?.dataType) || '-'" />
            <wd-cell title="读写类型" :value="optionLabel(accessModeOptions, property?.accessMode)" />
            <template v-if="isNumberType">
              <wd-cell title="取值范围" :value="`${property?.dataSpecs?.min ?? '-'} ~ ${property?.dataSpecs?.max ?? '-'}`" />
              <wd-cell title="步长" :value="String(property?.dataSpecs?.step ?? '-')" />
              <wd-cell title="单位" :value="property?.dataSpecs?.unitName || '-'" />
            </template>
            <wd-cell v-else-if="isTextType" title="数据长度" :value="String(property?.dataSpecs?.length ?? '-')" />
            <template v-else-if="isEnumOrBool">
              <wd-cell v-for="item in property?.dataSpecsList" :key="item.value" :title="`${isBoolType ? '布尔值' : '枚举值'} ${item.value}`" :value="item.name || '-'" />
            </template>
          </template>
          <!-- 服务 -->
          <template v-else-if="isService">
            <wd-cell title="调用方式" :value="optionLabel(callTypeOptions, service?.callType)" />
            <wd-cell title="输入参数" :value="paramsText(service?.inputParams)" />
            <wd-cell title="输出参数" :value="paramsText(service?.outputParams)" />
          </template>
          <!-- 事件 -->
          <template v-else-if="isEvent">
            <wd-cell title="事件类型" :value="optionLabel(eventTypeOptions, event?.type)" />
            <wd-cell title="输出参数" :value="paramsText(event?.outputParams)" />
          </template>
        </wd-cell-group>
      </view>
    </view>

    <!-- 底部操作按钮 -->
    <view class="yd-detail-footer">
      <view class="yd-detail-footer-actions">
        <wd-button v-if="hasAccessByCodes(['iot:thing-model:update'])" class="flex-1" type="warning" @click="handleEdit">
          编辑
        </wd-button><wd-button v-if="hasAccessByCodes(['iot:thing-model:delete'])" class="flex-1" type="danger" :loading="deleting" @click="handleDelete">
          删除
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import type { ThingModelData } from '@/api/iot/thingmodel'
import { onShow } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { computed, ref } from 'vue'
import { deleteThingModel, getThingModel } from '@/api/iot/thingmodel'
import { useAccess } from '@/hooks/useAccess'
import { getDataTypeOptionsLabel, IoTDataSpecsDataTypeEnum, IoTThingModelAccessModeEnum, IoTThingModelEventTypeEnum, IoTThingModelServiceCallTypeEnum, IoTThingModelTypeEnum } from '@/pages-iot/utils/constants'
import { delay, navigateBackPlus } from '@/utils'
import { DICT_TYPE } from '@/utils/constants'
import { formatDateTime } from '@/utils/date'

const props = defineProps<{ id?: number | any }>()
definePage({ style: { navigationBarTitleText: '', navigationStyle: 'custom' } })
const { hasAccessByCodes } = useAccess()
const toast = useToast()
const dialog = useDialog()
const formData = ref<ThingModelData>() // 详情数据
const deleting = ref(false) // 删除状态

const accessModeOptions = Object.values(IoTThingModelAccessModeEnum) // 读写类型选项
const callTypeOptions = Object.values(IoTThingModelServiceCallTypeEnum) // 调用方式选项
const eventTypeOptions = Object.values(IoTThingModelEventTypeEnum) // 事件类型选项
const property = computed(() => formData.value?.property) // 属性定义
const service = computed(() => formData.value?.service) // 服务定义
const event = computed(() => formData.value?.event) // 事件定义
const isProperty = computed(() => formData.value?.type === IoTThingModelTypeEnum.PROPERTY)
const isService = computed(() => formData.value?.type === IoTThingModelTypeEnum.SERVICE)
const isEvent = computed(() => formData.value?.type === IoTThingModelTypeEnum.EVENT)
const isNumberType = computed(() => [IoTDataSpecsDataTypeEnum.INT, IoTDataSpecsDataTypeEnum.FLOAT, IoTDataSpecsDataTypeEnum.DOUBLE].includes(property.value?.dataType as any))
const isTextType = computed(() => property.value?.dataType === IoTDataSpecsDataTypeEnum.TEXT)
const isBoolType = computed(() => property.value?.dataType === IoTDataSpecsDataTypeEnum.BOOL)
const isEnumOrBool = computed(() => [IoTDataSpecsDataTypeEnum.ENUM, IoTDataSpecsDataTypeEnum.BOOL].includes(property.value?.dataType as any))

/** 选项 label 反查 */
function optionLabel(options: { label: string, value: string }[], value?: string) {
  return options.find(item => item.value === value)?.label || value || '-'
}

/** 参数列表文案 */
function paramsText(list?: any[]) {
  return list?.length ? list.map(item => `${item.name || item.identifier}(${item.dataType})`).join('、') : '-'
}

/** 返回上一页 */
function handleBack() {
  navigateBackPlus(`/pages-iot/thingmodel/index${formData.value?.productId ? `?productId=${formData.value.productId}` : ''}`)
}

/** 加载物模型详情 */
async function getDetail() {
  if (props.id && !deleting.value)
    formData.value = await getThingModel(Number(props.id))
}

/** 编辑物模型 */
function handleEdit() {
  uni.navigateTo({ url: `/pages-iot/thingmodel/form/index?id=${props.id}` })
}

/** 删除物模型 */
async function handleDelete() {
  if (!props.id)
    return
  try { await dialog.confirm({ title: '提示', msg: '确定要删除该物模型吗？' }) } catch { return }
  deleting.value = true
  try {
    await deleteThingModel(Number(props.id))
    toast.success('删除成功')
    uni.$emit('iot:thingmodel:reload')
    delay(handleBack)
  } finally {
    deleting.value = false
  }
}

/** 初始化 */
onShow(() => { getDetail() })
</script>
