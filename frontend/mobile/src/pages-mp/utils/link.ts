/** 打开外部链接：H5 新窗口 / App 系统浏览器 / 小程序复制链接兜底 */
export function openExternalUrl(url?: string) {
  if (!url) {
    return
  }
  // #ifdef H5
  window.open(url, '_blank')
  // #endif
  // #ifdef APP-PLUS
  plus.runtime.openURL(url)
  // #endif
  // #ifndef H5 || APP-PLUS
  uni.setClipboardData({
    data: url,
    success: () => uni.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }),
  })
  // #endif
}
