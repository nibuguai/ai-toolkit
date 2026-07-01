/** 单据状态枚举 */
export const WmsOrderStatusEnum = {
  PREPARE: 0, // 草稿
  FINISHED: 4, // 已完成
  CANCELED: 5, // 已作废
} as const

/** 单据类型枚举 */
export const WmsOrderTypeEnum = {
  RECEIPT: 1, // 入库
  SHIPMENT: 2, // 出库
  MOVEMENT: 3, // 移库
  CHECK: 4, // 盘库
} as const

/** 可修改的单据状态 */
export const WmsOrderUpdateStatusList: number[] = [WmsOrderStatusEnum.PREPARE]

/** 可删除的单据状态 */
export const WmsOrderDeleteStatusList: number[] = [
  WmsOrderStatusEnum.PREPARE,
  WmsOrderStatusEnum.CANCELED,
]

/** 往来企业类型枚举 */
export const WmsMerchantTypeEnum = {
  CUSTOMER: 1, // 客户
  SUPPLIER: 2, // 供应商
  CUSTOMER_SUPPLIER: 3, // 客户/供应商
} as const

/** 供应商类型的往来企业 */
export const WmsSupplierMerchantTypeList = [
  WmsMerchantTypeEnum.SUPPLIER,
  WmsMerchantTypeEnum.CUSTOMER_SUPPLIER,
]

/** 客户类型的往来企业 */
export const WmsCustomerMerchantTypeList = [
  WmsMerchantTypeEnum.CUSTOMER,
  WmsMerchantTypeEnum.CUSTOMER_SUPPLIER,
]

/** 生成 WMS 编号 / 条码 */
export function generateWmsCode(prefix: string = ''): string {
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return prefix + result
}
