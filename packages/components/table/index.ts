import { withInstall, withNoopInstall } from '@element-plus/utils'
import Table from './src/table.vue'
import TableColumn from './src/tableColumn'
import TableNormal from './src/table-normal.vue'
import TableColumnSetting from './src/table-column-setting/index.vue'

export const ElTable = withInstall(Table, {
  TableColumn,
  TableColumnSetting,
})

export const ElTableNormal = withInstall(TableNormal, {
  TableColumn,
})
export default ElTable
export const ElTableColumn = withNoopInstall(TableColumn)

export type TableInstance = InstanceType<typeof Table>

// @ts-ignore
export type TableColumnInstance = InstanceType<typeof TableColumn>

export type {
  SummaryMethod,
  Table,
  TableProps,
  TableRefs,
  ColumnCls,
  ColumnStyle,
  CellCls,
  CellStyle,
  TreeNode,
  RenderRowData,
  Sort,
  Filter,
  TableColumnCtx,
} from './src/table/defaults'
