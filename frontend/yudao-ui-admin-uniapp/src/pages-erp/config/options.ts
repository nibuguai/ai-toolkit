import { getSimpleUserList } from '@/api/system/user'
import * as AccountApi from '@/api/erp/finance/account'
import * as ProductCategoryApi from '@/api/erp/product/category'
import * as ProductApi from '@/api/erp/product/product'
import * as ProductUnitApi from '@/api/erp/product/unit'
import * as SupplierApi from '@/api/erp/purchase/supplier'
import * as CustomerApi from '@/api/erp/sale/customer'
import * as WarehouseApi from '@/api/erp/stock/warehouse'

export type ErpOptionKey = 'account' | 'category' | 'customer' | 'product' | 'supplier' | 'unit' | 'user' | 'warehouse'

export const erpOptionLoaders: Record<ErpOptionKey, () => Promise<any[]>> = {
  account: AccountApi.getAccountSimpleList,
  category: ProductCategoryApi.getProductCategorySimpleList,
  customer: CustomerApi.getCustomerSimpleList,
  product: ProductApi.getProductSimpleList,
  supplier: SupplierApi.getSupplierSimpleList,
  unit: ProductUnitApi.getProductUnitSimpleList,
  user: getSimpleUserList,
  warehouse: WarehouseApi.getWarehouseSimpleList,
}
