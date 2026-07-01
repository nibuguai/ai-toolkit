/** WMS 盘库单明细 */
export interface CheckOrderDetail {
  id?: number
  orderId?: number
  itemId?: number
  itemCode?: string
  itemName?: string
  unit?: string
  skuId?: number
  skuCode?: string
  skuName?: string
  inventoryId?: number
  warehouseId?: number
  warehouseName?: string
  receiptTime?: Date | string
  quantity?: number
  checkQuantity?: number
  availableQuantity?: number
  price?: number
  createTime?: Date | string
}
