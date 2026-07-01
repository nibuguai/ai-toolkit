import { computed, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { useToast } from '@wot-ui/ui/components/wd-toast'
import { useAccess } from '@/hooks/useAccess'

interface BatchSelectOptions {
  /** 权限标识，如 'mes:md-item:delete' */
  permission: string
  /** 删除 API，兼容 deleteXxx(id: number) 和 deleteXxx(ids: number[]) */
  deleteApi: (ids: number[]) => Promise<any>
  /** 刷新事件名 */
  reloadEvent: string
  /** 列表主键字段名，默认 'id' */
  idKey?: string
}

/**
 * MES 列表批量选择与左滑删除 composable
 *
 * A. 左滑删除：列表卡片左滑露出删除按钮，二次确认后单条删除
 * B. 长按多选：长按进入选择模式，复选框选多条后底部批量删除
 */
export function useMesBatchSelect(options: BatchSelectOptions) {
  const dialog = useDialog()
  const toast = useToast()
  const { hasAccessByCodes } = useAccess()
  const idKey = options.idKey || 'id'

  const selecting = ref(false) // 选择模式
  const selectedIds = ref<Set<number | string>>(new Set()) // 已选 ID 集合
  const batchDeleting = ref(false) // 批量删除提交状态

  /** 是否有删除权限 */
  const canDelete = computed(() => hasAccessByCodes([options.permission]))

  /** 判断某条记录是否已选中 */
  function isSelected(id: number | string) {
    return selectedIds.value.has(id)
  }

  /** 切换选中状态 */
  function toggleSelect(id: number | string) {
    const newSet = new Set(selectedIds.value)
    if (newSet.has(id)) {
      newSet.delete(id)
      if (newSet.size === 0) {
        selecting.value = false
      }
    } else {
      newSet.add(id)
    }
    selectedIds.value = newSet
  }

  /** 长按进入选择模式并选中当前项 */
  function enterSelectMode(id: number | string) {
    selecting.value = true
    toggleSelect(id)
  }

  /** 退出选择模式 */
  function exitSelectMode() {
    selecting.value = false
    selectedIds.value = new Set()
  }

  /** 获取记录的主键值 */
  function getItemId(item: Record<string, any>) {
    return item[idKey]
  }

  /** 获取记录名称（用于确认提示） */
  function getItemName(item: Record<string, any>) {
    return item.name || item.no || ''
  }

  /**
   * A. 左滑删除 —— 单条删除
   * @param item 记录对象
   */
  async function handleSwipeDelete(item: Record<string, any>) {
    if (!canDelete.value) {
      return
    }
    const id = getItemId(item)
    const name = getItemName(item)
    try {
      await dialog.confirm({
        title: '提示',
        msg: `确定要删除${name ? `「${name}」` : '该记录'}吗？`,
      })
    } catch {
      return
    }
    try {
      toast.loading('删除中...')
      await options.deleteApi([Number(id)])
      toast.success('删除成功')
      uni.$emit(options.reloadEvent)
    } finally {
      toast.close()
    }
  }

  /**
   * B. 批量删除 —— 删除已选中的所有记录
   */
  async function handleBatchDelete() {
    if (selectedIds.value.size === 0 || !canDelete.value) {
      return
    }
    try {
      await dialog.confirm({
        title: '提示',
        msg: `确定要删除选中的 ${selectedIds.value.size} 条记录吗？`,
      })
    } catch {
      return
    }
    batchDeleting.value = true
    try {
      toast.loading('删除中...')
      await options.deleteApi(Array.from(selectedIds.value).map(Number))
      toast.success('删除成功')
      uni.$emit(options.reloadEvent)
      exitSelectMode()
    } finally {
      toast.close()
      batchDeleting.value = false
    }
  }

  return {
    /** 状态 */
    selecting,
    selectedIds,
    batchDeleting,
    canDelete,
    /** 方法 */
    isSelected,
    toggleSelect,
    enterSelectMode,
    exitSelectMode,
    getItemId,
    handleSwipeDelete,
    handleBatchDelete,
  }
}
