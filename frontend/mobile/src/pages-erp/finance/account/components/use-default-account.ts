import { getAccountSimpleList } from '@/api/erp/finance/account'

/** 为空账户字段设置默认结算账户 */
export async function applyDefaultAccount(formData: { accountId?: number | string }) {
  if (formData.accountId) {
    return
  }
  const accounts = await getAccountSimpleList()
  const defaultAccount = accounts?.find(item => item.defaultStatus)
  if (defaultAccount?.id) {
    formData.accountId = defaultAccount.id
  }
}
