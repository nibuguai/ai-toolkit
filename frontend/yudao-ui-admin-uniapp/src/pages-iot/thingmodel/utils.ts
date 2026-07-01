import { IoTDataSpecsDataTypeEnum } from '@/pages-iot/utils/constants'

/** 切换数据类型时初始化 dataSpecs / dataSpecsList（对齐 PC ThingModelProperty.handleChange） */
export function seedDataSpecs(target: Record<string, any>, dataType: string) {
  target.dataType = dataType
  target.dataSpecs = {}
  target.dataSpecsList = []
  // 非列表型（枚举/布尔/结构体除外）才写入 dataSpecs.dataType
  if (![IoTDataSpecsDataTypeEnum.ENUM, IoTDataSpecsDataTypeEnum.BOOL, IoTDataSpecsDataTypeEnum.STRUCT].includes(dataType as any)) {
    target.dataSpecs.dataType = dataType
  }
  if (dataType === IoTDataSpecsDataTypeEnum.ENUM) {
    target.dataSpecsList.push({ dataType: IoTDataSpecsDataTypeEnum.ENUM, name: '', value: undefined })
  } else if (dataType === IoTDataSpecsDataTypeEnum.BOOL) {
    target.dataSpecsList.push(
      { dataType: IoTDataSpecsDataTypeEnum.BOOL, name: '', value: 0 },
      { dataType: IoTDataSpecsDataTypeEnum.BOOL, name: '', value: 1 },
    )
  }
}
