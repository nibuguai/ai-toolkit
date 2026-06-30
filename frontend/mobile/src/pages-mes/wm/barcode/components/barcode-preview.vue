<template>
  <view class="rounded-12rpx bg-white p-24rpx shadow-sm">
    <view class="mb-16rpx flex items-center justify-between gap-16rpx">
      <view class="text-30rpx text-[#333] font-semibold">
        条码预览
      </view>
      <dict-tag v-if="format != null" :type="DICT_TYPE.MES_WM_BARCODE_FORMAT" :value="format" />
    </view>

    <view class="flex flex-col items-center rounded-12rpx bg-[#f7faff] p-24rpx">
      <view
        v-if="content"
        class="flex items-center justify-center border-2rpx border-[#dbeafe] rounded-12rpx bg-white p-24rpx"
        :class="isQrCode ? 'h-280rpx w-280rpx' : 'h-180rpx w-full'"
      >
        <view v-if="isQrCode" class="qr-preview-grid">
          <view
            v-for="(dot, index) in qrDots"
            :key="index"
            class="qr-preview-dot"
            :class="dot ? 'bg-[#111827]' : 'bg-white'"
          />
        </view>
        <view v-else class="barcode-preview-lines">
          <view
            v-for="(bar, index) in barcodeBars"
            :key="index"
            class="h-full bg-[#111827]"
            :style="{ width: `${bar.width}rpx`, opacity: bar.active ? 1 : 0.12 }"
          />
        </view>
      </view>
      <wd-empty v-else icon="content" tip="暂无条码内容" />

      <view v-if="content" class="mt-20rpx w-full break-all rounded-8rpx bg-white px-20rpx py-16rpx text-center text-24rpx text-[#666]">
        {{ content }}
      </view>
      <view class="mt-16rpx text-center text-22rpx text-[#999] leading-34rpx">
        {{ previewTip }}
      </view>
      <view v-if="content && showActions" class="mt-20rpx flex flex-wrap justify-center gap-16rpx">
        <wd-button size="small" variant="plain" @click.stop="handleCopy">
          复制条码内容
        </wd-button>
        <wd-button size="small" type="primary" plain @click.stop="handleDownloadPreview">
          下载预览 SVG
        </wd-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { DICT_TYPE } from '@/utils/constants'

const props = withDefaults(defineProps<{
  content?: string
  format?: number
  showActions?: boolean
}>(), {
  showActions: true,
})

const BarcodeFormatEnum = {
  QR_CODE: 1,
} as const

const toast = useToast()
const showActions = computed(() => props.showActions)
const isQrCode = computed(() => props.format === BarcodeFormatEnum.QR_CODE)
const previewTip = computed(() => {
  if (!showActions.value) {
    return '移动端当前提供只读标签预览；点击卡片进入详情后可复制内容或下载 H5 预览 SVG。'
  }
  return '移动端当前提供只读标签预览、内容复制和 H5 预览下载；正式打印和真实条码图像归入报表/打印专项。'
})
const qrDots = computed(() => buildPreviewBits(props.content || '', 121))
const barcodeBars = computed(() => {
  return buildPreviewBits(props.content || '', 32).map((active, index) => ({
    active,
    width: active ? (index % 3 === 0 ? 8 : 4) : 3,
  }))
})

/** 根据条码内容生成稳定的只读预览点阵 */
function buildPreviewBits(content: string, count: number) {
  let seed = 0
  for (const char of content) {
    seed = (seed * 31 + char.charCodeAt(0)) % 9973
  }
  return Array.from({ length: count }, (_, index) => {
    seed = (seed * 37 + index * 17 + 11) % 9973
    return seed % 5 !== 0
  })
}

/** 复制条码内容 */
async function handleCopy() {
  if (!props.content) {
    return
  }
  await uni.setClipboardData({ data: props.content })
  toast.success('已复制条码内容')
}

/** 下载当前预览 SVG */
function handleDownloadPreview() {
  if (!props.content) {
    return
  }

  // #ifdef H5
  try {
    const svg = isQrCode.value ? buildQrSvg(props.content, qrDots.value) : buildBarcodeSvg(props.content, barcodeBars.value)
    triggerSvgDownload(svg, props.content)
    toast.success('预览 SVG 已下载')
  } catch {
    toast.warning('下载失败，请先复制条码内容')
  }
  // #endif

  // #ifndef H5
  toast.warning('当前平台暂仅支持复制条码内容')
  // #endif
}

/** 触发 H5 SVG 下载 */
function triggerSvgDownload(svg: string, content: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = url
    link.download = `barcode-preview-${sanitizeFileName(content)}.svg`
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

/** 生成二维码预览 SVG */
function buildQrSvg(content: string, dots: boolean[]) {
  const cell = 14
  const size = 11 * cell
  const rects = dots
    .map((dot, index) => {
      if (!dot) {
        return ''
      }
      const x = (index % 11) * cell
      const y = Math.floor(index / 11) * cell
      return `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" />`
    })
    .join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 42}" viewBox="0 0 ${size} ${size + 42}">
  <rect width="100%" height="100%" fill="#ffffff" />
  <g fill="#111827">${rects}</g>
  <text x="${size / 2}" y="${size + 28}" text-anchor="middle" font-size="12" fill="#4b5563">${escapeXml(content)}</text>
</svg>`
}

/** 生成一维码预览 SVG */
function buildBarcodeSvg(content: string, bars: Array<{ active: boolean, width: number }>) {
  const scale = 2
  const height = 96
  let x = 12
  const rects = bars.map((bar) => {
    const width = bar.width * scale
    const rect = `<rect x="${x}" y="12" width="${width}" height="${height}" fill="#111827" opacity="${bar.active ? 1 : 0.12}" />`
    x += width + 4
    return rect
  }).join('')
  const totalWidth = Math.max(x + 12, 240)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="154" viewBox="0 0 ${totalWidth} 154">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${rects}
  <text x="${totalWidth / 2}" y="136" text-anchor="middle" font-size="14" fill="#4b5563">${escapeXml(content)}</text>
</svg>`
}

/** 转义 SVG 文本 */
function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;')
}

/** 清理下载文件名 */
function sanitizeFileName(value: string) {
  return value.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'content'
}
</script>

<style lang="scss" scoped>
.qr-preview-grid {
  display: grid;
  grid-template-columns: repeat(11, 1fr);
  grid-template-rows: repeat(11, 1fr);
  gap: 4rpx;
  width: 220rpx;
  height: 220rpx;
}

.qr-preview-dot {
  border-radius: 3rpx;
}

.barcode-preview-lines {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 4rpx;
  width: 100%;
  height: 120rpx;
}
</style>
