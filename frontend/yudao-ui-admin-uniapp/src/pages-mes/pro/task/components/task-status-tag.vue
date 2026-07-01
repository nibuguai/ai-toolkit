<script lang="ts" setup>
import type { TagType } from '@wot-ui/ui/components/wd-tag/types'
import { computed } from 'vue'
import { getDictObj } from '@/hooks/useDict'
import { DICT_TYPE } from '@/utils/constants'

const props = defineProps<{
  value?: number
}>()

const FALLBACK_LABEL_MAP: Record<number, string> = {
  0: '草稿',
  4: '已完成',
  5: '已取消',
}
const FALLBACK_TYPE_MAP: Record<number, TagType> = {
  0: 'default',
  4: 'success',
  5: 'warning',
}

const label = computed(() => {
  if (props.value === undefined || props.value === null) {
    return ''
  }
  const dict = getDictObj(DICT_TYPE.MES_PRO_TASK_STATUS, props.value)
  if (dict?.label && !isMojibake(dict.label)) {
    return dict.label
  }
  return FALLBACK_LABEL_MAP[props.value] || String(props.value)
})
const tagType = computed<TagType>(() => {
  if (props.value === undefined || props.value === null) {
    return 'default'
  }
  const dict = getDictObj(DICT_TYPE.MES_PRO_TASK_STATUS, props.value)
  if (dict?.colorType && !isMojibake(dict.label)) {
    return mapColorType(dict.colorType)
  }
  return FALLBACK_TYPE_MAP[props.value] || 'default'
})

/** 判断后端初始化字典是否存在中文编码错乱 */
function isMojibake(text?: string) {
  return !!text && /[ÃÂåæçè]/.test(text)
}

/** 后端颜色类型映射到 Wot 标签类型 */
function mapColorType(colorType: string): TagType {
  if (['default', 'primary', 'success', 'warning', 'danger'].includes(colorType)) {
    return colorType as TagType
  }
  return 'default'
}
</script>

<template>
  <wd-tag v-if="label" :type="tagType" variant="plain">
    {{ label }}
  </wd-tag>
</template>
