import * as PurchaseStatisticsApi from '@/api/erp/statistics/purchase'
import * as SaleStatisticsApi from '@/api/erp/statistics/sale'

export interface ErpModule {
  key: string // 模块唯一标识
  group: string // 所属分组
  title: string // 模块名称
  icon: string // 工作台图标
  iconColor: string // 图标颜色
  permission: string // 权限前缀
  route?: string // 精迁页面路径
}

export const erpStatistics = {
  getPurchaseSummary: PurchaseStatisticsApi.getPurchaseSummary,
  getPurchaseTimeSummary: PurchaseStatisticsApi.getPurchaseTimeSummary,
  getSaleSummary: SaleStatisticsApi.getSaleSummary,
  getSaleTimeSummary: SaleStatisticsApi.getSaleTimeSummary,
}

export const erpGroups = [
  { key: 'product', name: '产品管理' },
  { key: 'purchase', name: '采购管理' },
  { key: 'sale', name: '销售管理' },
  { key: 'stock', name: '库存管理' },
  { key: 'finance', name: '财务管理' },
] as const

export const erpModules: ErpModule[] = [
  {
    key: 'product-category',
    group: 'product',
    title: '产品分类',
    icon: 'folder',
    iconColor: '#13c2c2',
    permission: 'erp:product-category',
    route: '/pages-erp/product/category/index',
  },
  {
    key: 'product',
    group: 'product',
    title: '产品管理',
    icon: 'goods',
    iconColor: '#1890ff',
    permission: 'erp:product',
    route: '/pages-erp/product/product/index',
  },
  {
    key: 'product-unit',
    group: 'product',
    title: '产品单位',
    icon: 'app',
    iconColor: '#2f54eb',
    permission: 'erp:product-unit',
    route: '/pages-erp/product/unit/index',
  },
  {
    key: 'supplier',
    group: 'purchase',
    title: '供应商',
    icon: 'usergroup',
    iconColor: '#fa8c16',
    permission: 'erp:supplier',
    route: '/pages-erp/purchase/supplier/index',
  },
  {
    key: 'purchase-order',
    group: 'purchase',
    title: '采购订单',
    icon: 'order',
    iconColor: '#faad14',
    permission: 'erp:purchase-order',
    route: '/pages-erp/purchase/order/index',
  },
  {
    key: 'purchase-in',
    group: 'purchase',
    title: '采购入库',
    icon: 'download',
    iconColor: '#ffc53d',
    permission: 'erp:purchase-in',
    route: '/pages-erp/purchase/in/index',
  },
  {
    key: 'purchase-return',
    group: 'purchase',
    title: '采购退货',
    icon: 'undo',
    iconColor: '#ff7a45',
    permission: 'erp:purchase-return',
    route: '/pages-erp/purchase/return/index',
  },
  {
    key: 'customer',
    group: 'sale',
    title: '客户',
    icon: 'user',
    iconColor: '#52c41a',
    permission: 'erp:customer',
    route: '/pages-erp/sale/customer/index',
  },
  {
    key: 'sale-order',
    group: 'sale',
    title: '销售订单',
    icon: 'cart',
    iconColor: '#73d13d',
    permission: 'erp:sale-order',
    route: '/pages-erp/sale/order/index',
  },
  {
    key: 'sale-out',
    group: 'sale',
    title: '销售出库',
    icon: 'upload',
    iconColor: '#95de64',
    permission: 'erp:sale-out',
    route: '/pages-erp/sale/out/index',
  },
  {
    key: 'sale-return',
    group: 'sale',
    title: '销售退货',
    icon: 'rollback',
    iconColor: '#389e0d',
    permission: 'erp:sale-return',
    route: '/pages-erp/sale/return/index',
  },
  {
    key: 'warehouse',
    group: 'stock',
    title: '仓库管理',
    icon: 'home',
    iconColor: '#722ed1',
    permission: 'erp:warehouse',
    route: '/pages-erp/stock/warehouse/index',
  },
  {
    key: 'stock',
    group: 'stock',
    title: '产品库存',
    icon: 'chart-pie',
    iconColor: '#9254de',
    permission: 'erp:stock',
    route: '/pages-erp/stock/stock/index',
  },
  {
    key: 'stock-record',
    group: 'stock',
    title: '库存明细',
    icon: 'list',
    iconColor: '#597ef7',
    permission: 'erp:stock-record',
    route: '/pages-erp/stock/record/index',
  },
  {
    key: 'stock-in',
    group: 'stock',
    title: '其它入库',
    icon: 'download',
    iconColor: '#36cfc9',
    permission: 'erp:stock-in',
    route: '/pages-erp/stock/in/index',
  },
  {
    key: 'stock-out',
    group: 'stock',
    title: '其它出库',
    icon: 'upload',
    iconColor: '#13c2c2',
    permission: 'erp:stock-out',
    route: '/pages-erp/stock/out/index',
  },
  {
    key: 'stock-move',
    group: 'stock',
    title: '库存调拨',
    icon: 'swap',
    iconColor: '#5cdbd3',
    permission: 'erp:stock-move',
    route: '/pages-erp/stock/move/index',
  },
  {
    key: 'stock-check',
    group: 'stock',
    title: '库存盘点',
    icon: 'check-circle',
    iconColor: '#87e8de',
    permission: 'erp:stock-check',
    route: '/pages-erp/stock/check/index',
  },
  {
    key: 'account',
    group: 'finance',
    title: '结算账户',
    icon: 'wallet',
    iconColor: '#eb2f96',
    permission: 'erp:account',
    route: '/pages-erp/finance/account/index',
  },
  {
    key: 'finance-payment',
    group: 'finance',
    title: '付款单',
    icon: 'money-circle',
    iconColor: '#f759ab',
    permission: 'erp:finance-payment',
    route: '/pages-erp/finance/payment/index',
  },
  {
    key: 'finance-receipt',
    group: 'finance',
    title: '收款单',
    icon: 'money-circle',
    iconColor: '#ff85c0',
    permission: 'erp:finance-receipt',
    route: '/pages-erp/finance/receipt/index',
  },
]

export function getErpModule(key?: string) {
  return erpModules.find(item => item.key === key)
}

export function getErpGroupModules(group: string) {
  return erpModules.filter(item => item.group === group)
}
