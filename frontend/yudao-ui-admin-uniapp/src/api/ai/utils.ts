import { useTokenStore } from '@/store/token'
import { getEnvBaseUrl } from '@/utils'

export interface AiSseOptions<T = Record<string, any>> {
  data: T
  ctrl: AbortController
  onMessage?: (res: { data: string }) => void | Promise<void>
  onError?: (...args: any[]) => void
  onClose?: (...args: any[]) => void
}

/** 获取 H5 流式请求基础地址 */
function getSseBaseUrl() {
  // #ifdef H5
  if (JSON.parse(import.meta.env.VITE_APP_PROXY_ENABLE)) {
    return import.meta.env.VITE_APP_PROXY_PREFIX
  }
  // #endif
  return getEnvBaseUrl()
}

/** 发送 SSE POST 请求 */
export async function sendSsePost<T = Record<string, any>>(url: string, options: AiSseOptions<T>) {
  // #ifndef H5
  const error = new Error('当前端暂不支持 AI 流式生成，请使用 H5 端访问')
  options.onError?.(error)
  throw error
  // #endif

  // #ifdef H5
  const token = await useTokenStore().tryGetValidToken()
  let closed = false
  try {
    const response = await fetch(`${getSseBaseUrl()}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(options.data),
      signal: options.ctrl.signal,
    })

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`)
    }
    if (!response.body) {
      throw new Error('浏览器不支持流式响应')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const chunks = buffer.split(/\r?\n\r?\n/)
      buffer = chunks.pop() || ''

      for (const chunk of chunks) {
        const data = chunk
          .split(/\r?\n/)
          .filter(line => line.startsWith('data:'))
          .map(line => line.replace(/^data:\s?/, ''))
          .join('\n')

        if (!data) {
          continue
        }
        if (data === '[DONE]') {
          closed = true
          options.onClose?.()
          return
        }
        await options.onMessage?.({ data })
      }
    }
    if (!closed) {
      options.onClose?.()
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      options.onClose?.()
      return
    }
    options.onError?.(error)
    throw error
  }
  // #endif
}
