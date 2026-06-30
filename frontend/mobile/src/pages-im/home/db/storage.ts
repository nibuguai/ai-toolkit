// IM 本地数据库：小程序 / App storage 适配层
// 用 uni storage 兜底；messages 表按会话分片，避免小程序单 key 1MB 上限

import type { ImDbClient } from './client'
import type { DbStoreName, MessageDO, SettingDO } from './types'
import { STORE_SCHEMA } from './types'

type AnyRecord = Record<string, any>

export class StorageDbClient implements ImDbClient {
  private prefix = ''

  async open(userId: number): Promise<void> {
    this.prefix = `im:${userId}:`
  }

  close(): void {
    this.prefix = ''
  }

  /** 普通表的存储 key */
  private storeKey(store: DbStoreName): string {
    return `${this.prefix}${store}`
  }

  /** messages 表按会话分片的存储 key */
  private messageKeyOf(clientConversationId: string): string {
    return `${this.prefix}messages:${clientConversationId}`
  }

  /** 列出 messages 表全部分片 key */
  private messagePartitionKeys(): string[] {
    const prefix = `${this.prefix}messages:`
    try {
      const info = uni.getStorageInfoSync()
      return (info.keys || []).filter(key => key.startsWith(prefix))
    } catch {
      return []
    }
  }

  /** 读取一个 map（不存在返回空对象） */
  private readMap(key: string): Record<string, AnyRecord> {
    const value = uni.getStorageSync(key)
    return value && typeof value === 'object' ? value : {}
  }

  /** 写入一个 map */
  private writeMap(key: string, map: Record<string, AnyRecord>): void {
    uni.setStorageSync(key, map)
  }

  async get<T>(store: DbStoreName, key: string | number): Promise<T | undefined> {
    if (store === 'messages') {
      for (const partition of this.messagePartitionKeys()) {
        const hit = this.readMap(partition)[String(key)]
        if (hit) {
          return hit as T
        }
      }
      return undefined
    }
    return this.readMap(this.storeKey(store))[String(key)] as T | undefined
  }

  async getAll<T>(store: DbStoreName): Promise<T[]> {
    if (store === 'messages') {
      const out: T[] = []
      this.messagePartitionKeys().forEach((partition) => {
        out.push(...(Object.values(this.readMap(partition)) as T[]))
      })
      return out
    }
    return Object.values(this.readMap(this.storeKey(store))) as T[]
  }

  async put<T>(store: DbStoreName, value: T): Promise<void> {
    const keyPath = STORE_SCHEMA[store].keyPath
    const record = value as AnyRecord
    if (store === 'messages') {
      const partition = this.messageKeyOf(record.clientConversationId)
      const map = this.readMap(partition)
      map[record[keyPath]] = record
      this.writeMap(partition, map)
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    map[record[keyPath]] = record
    this.writeMap(mapKey, map)
  }

  async bulkPut<T>(store: DbStoreName, values: T[]): Promise<void> {
    if (!values.length) {
      return
    }
    const keyPath = STORE_SCHEMA[store].keyPath
    if (store === 'messages') {
      // 按会话分组后逐分片写入
      const groups = new Map<string, AnyRecord[]>()
      ;(values as AnyRecord[]).forEach((record) => {
        const partition = this.messageKeyOf(record.clientConversationId)
        const list = groups.get(partition) || []
        list.push(record)
        groups.set(partition, list)
      })
      groups.forEach((list, partition) => {
        const map = this.readMap(partition)
        list.forEach((record) => {
          map[record[keyPath]] = record
        })
        this.writeMap(partition, map)
      })
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    ;(values as AnyRecord[]).forEach((record) => {
      map[record[keyPath]] = record
    })
    this.writeMap(mapKey, map)
  }

  async delete(store: DbStoreName, key: string | number): Promise<void> {
    if (store === 'messages') {
      for (const partition of this.messagePartitionKeys()) {
        const map = this.readMap(partition)
        if (map[String(key)]) {
          delete map[String(key)]
          this.writeMap(partition, map)
          return
        }
      }
      return
    }
    const mapKey = this.storeKey(store)
    const map = this.readMap(mapKey)
    delete map[String(key)]
    this.writeMap(mapKey, map)
  }

  async clearStore(store: DbStoreName): Promise<void> {
    if (store === 'messages') {
      this.messagePartitionKeys().forEach(partition => uni.removeStorageSync(partition))
      return
    }
    uni.setStorageSync(this.storeKey(store), {})
  }

  async filter<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<T[]> {
    const all = await this.getAll<T>(store)
    return all.filter(predicate)
  }

  async removeWhere<T>(store: DbStoreName, predicate: (record: T) => boolean): Promise<void> {
    const partitions = store === 'messages' ? this.messagePartitionKeys() : [this.storeKey(store)]
    partitions.forEach((partition) => {
      const map = this.readMap(partition)
      let changed = false
      Object.keys(map).forEach((mapKey) => {
        if (predicate(map[mapKey] as T)) {
          delete map[mapKey]
          changed = true
        }
      })
      if (changed) {
        this.writeMap(partition, map)
      }
    })
  }

  async getMessageListByConversation(
    clientConversationId: string,
    options?: { beforeSendTime?: number, limit?: number },
  ): Promise<MessageDO[]> {
    const limit = options?.limit ?? 50
    const upper = options?.beforeSendTime ?? Number.MAX_SAFE_INTEGER
    const map = this.readMap(this.messageKeyOf(clientConversationId))
    const list = (Object.values(map) as MessageDO[])
      .filter(message => message.sendTime < upper)
      .sort((a, b) => b.sendTime - a.sendTime)
      .slice(0, limit)
    return list.reverse()
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const item = this.readMap(this.storeKey('settings'))[key] as SettingDO<T> | undefined
    return item?.value
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    const mapKey = this.storeKey('settings')
    const map = this.readMap(mapKey)
    map[key] = { key, value, updateTime: Date.now() }
    this.writeMap(mapKey, map)
  }
}
