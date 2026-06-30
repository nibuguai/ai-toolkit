import { onBeforeUnmount, reactive } from 'vue'

export type MpRouteQuery = Record<string, any>

/** 获取当前 H5 地址参数 */
function getCurrentRouteQuery() {
  const query: MpRouteQuery = {}
  const location = (globalThis as any).location
  if (!location) {
    return query
  }

  const hash = location.hash || ''
  const queryString = hash.includes('?')
    ? hash.slice(hash.indexOf('?') + 1)
    : (location.search || '').replace(/^\?/, '')
  if (!queryString) {
    return query
  }

  new URLSearchParams(queryString).forEach((value, key) => {
    query[key] = value
  })
  return query
}

/** 合并页面参数 */
export function useMpRouteParams<T extends MpRouteQuery>(props: T) {
  const routeParams = reactive({
    ...props,
    ...getCurrentRouteQuery(),
  }) as T

  function syncRouteParams(query?: MpRouteQuery) {
    const nextQuery = {
      ...props,
      ...getCurrentRouteQuery(),
      ...(query || {}),
    } as T
    Object.keys(routeParams).forEach((key) => {
      if (!(key in nextQuery)) {
        delete routeParams[key]
      }
    })
    Object.assign(routeParams, nextQuery)
  }

  const globalTarget = globalThis as any
  if (globalTarget.addEventListener) {
    const handleHashChange = () => syncRouteParams()
    globalTarget.addEventListener('hashchange', handleHashChange)
    onBeforeUnmount(() => {
      globalTarget.removeEventListener?.('hashchange', handleHashChange)
    })
  }

  return {
    routeParams,
    syncRouteParams,
  }
}

/** 转换路由数字参数 */
export function getMpRouteNumber(value: unknown) {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return undefined
  }
  const numberValue = Number(rawValue)
  return Number.isNaN(numberValue) ? undefined : numberValue
}

/** 转换路由文本参数 */
export function getMpRouteString(value: unknown) {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === undefined || rawValue === null) {
    return ''
  }
  return String(rawValue)
}
