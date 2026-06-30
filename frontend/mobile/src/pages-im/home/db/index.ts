// IM 本地数据库：统一入口 + 按平台分发
// - H5：IndexedDB
// - 小程序 / App：uni storage 兜底（App 后续可换 SQLite 插件）
// 业务侧只用 initImDb / getImDb / closeImDb + ./client、./types 的工具与类型

import type { ImDbClient } from './client'
import { useUserStore } from '@/store/user'
// #ifdef H5
import { IndexedDbClient } from './indexeddb'
// #endif
// #ifndef H5
import { StorageDbClient } from './storage'
// #endif

let client: ImDbClient | null = null
let currentUserId = 0

/** 初始化当前用户的 IM 本地库（重复调用同一用户为幂等） */
export async function initImDb(): Promise<void> {
  const userId = useUserStore().userInfo.userId
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('当前用户不存在，无法初始化 IM 本地库')
  }
  if (client && currentUserId === userId) {
    return
  }
  client?.close()
  // #ifdef H5
  client = new IndexedDbClient()
  // #endif
  // #ifndef H5
  client = new StorageDbClient()
  // #endif
  await client.open(userId)
  currentUserId = userId
}

/** 获取当前 IM 本地库客户端 */
export function getImDb(): ImDbClient {
  if (!client) {
    throw new Error('IM 本地库未初始化，请先调用 initImDb()')
  }
  return client
}

/** 关闭并重置 IM 本地库（退出登录 / 切换账号时调用） */
export function closeImDb(): void {
  client?.close()
  client = null
  currentUserId = 0
}

export * from './client'
export * from './types'
