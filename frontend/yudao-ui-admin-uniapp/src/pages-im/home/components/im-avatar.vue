<template>
  <view
    class="flex flex-shrink-0 items-center justify-center overflow-hidden bg-[#e6f4ff] text-[#1677ff] font-semibold"
    :class="round ? 'rounded-full' : 'rounded-12rpx'"
    :style="{ width: size, height: size, fontSize }"
  >
    <image v-if="src" :src="src" class="h-full w-full" mode="aspectFill" />
    <text v-else>{{ letter }}</text>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name?: string
  round?: boolean
  size?: string
  src?: string
}>(), {
  name: '',
  round: true,
  size: '80rpx',
  src: '',
})

const letter = computed(() => (props.name || '?').charAt(0))
const fontSize = computed(() => {
  const value = Number.parseInt(props.size)
  return Number.isNaN(value) ? '32rpx' : `${Math.max(22, Math.floor(value * 0.42))}rpx`
})
</script>
