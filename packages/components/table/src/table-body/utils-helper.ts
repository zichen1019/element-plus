import { inject } from 'vue'
import { TABLE_INJECTION_KEY } from '../tokens'

type MergeCol<T> =
  | string
  | {
      property: string
      getValue: (row: T) => any
    }

type MergeSpan<T> = {
  property: string
  getValue: (row: T) => any
  rowspan: number
  colspan: number
  rowIndex: number
  rootRowIndex: number
}

function useUtils<T>() {
  const parent = inject(TABLE_INJECTION_KEY)
  const data = (parent?.store.states.data.value || []) as any[]
  const mergeCols = parent?.props.mergeCols as MergeCol<T>[]
  const mergeRows = parent?.props.mergeRows as MergeCol<T>[]

  /**
   * 合并行与列
   * @return Map<string, MergeSpan<T>>
   */
  const buildSpans = () => {
    const spans = new Map<string, MergeSpan<T>>()
    const cols = initMergeCols(mergeCols)
    const rows = initMergeRows(mergeRows)
    for (const [i, row] of data.entries()) {
      buildMergeRowsSpan(data, i, row, rows, spans)
      buildMergeColsSpan(i, row, cols, spans)
    }
    return spans
  }

  /**
   * 默认获取value的方法
   * @param property  列的prop属性值
   */
  const defaultGetValue = (property: string) => {
    return (row: T) => row[property as keyof T]
  }

  /**
   * 初始化合并列配置
   * @param mergeCols  合并列配置
   * @return MergeSpan<T>[]
   */
  const initMergeCols = (mergeCols: MergeCol<T>[]) =>
    mergeCols
      ?.filter(
        (col: MergeCol<T>) =>
          typeof col === 'string' || typeof col.property === 'string'
      )
      .map((col: MergeCol<T>) => {
        const isOnlyHasProperty = typeof col === 'string'
        const property = isOnlyHasProperty ? col : col.property
        return {
          rowspan: 1,
          rowIndex: 0,
          property,
          getValue:
            isOnlyHasProperty || !col.getValue
              ? defaultGetValue(property)
              : col.getValue,
        }
      }) as MergeSpan<T>[]

  /**
   * 初始化合并行配置
   * @param mergeRows 合并行配置
   * @return MergeSpan<T>[]
   */
  const initMergeRows = (mergeRows: MergeCol<T>[]) =>
    mergeRows
      ?.filter(
        (row: MergeCol<T>) =>
          typeof row === 'string' || typeof row.property === 'string'
      )
      .map((row: MergeCol<T>) => {
        const isOnlyHasProperty = typeof row === 'string'
        const property = isOnlyHasProperty ? row : row.property
        return {
          colspan: 1,
          rowIndex: 0,
          property,
          getValue:
            isOnlyHasProperty || !row.getValue
              ? defaultGetValue(property)
              : row.getValue,
          // 关联的根行的索引值, 从0开始
          rootRowIndex: -1,
        }
      }) as MergeSpan<T>[]

  /**
   * 构建合并行数据
   * @param data      表格数据
   * @param rowIndex  当前行索引
   * @param row       当前行数据
   * @param mergeRows 合并行配置
   * @param spans     合并单元格数据
   */
  const buildMergeRowsSpan = (
    data: any[],
    rowIndex: number,
    row: T,
    mergeRows: MergeSpan<T>[],
    spans: Map<string, MergeSpan<T>>
  ) => {
    for (const column of mergeRows) {
      const rowValue = column.getValue(row)

      // 当前单元格合并数据
      const span = Object.assign({}, column) as MergeSpan<T>
      span.rowIndex = rowIndex
      span.rowspan = 1

      // 如果是第一行或者当前值与上一行当前列的值不同时，合并行数默认为1
      if (rowIndex === 0 || rowValue !== span.getValue(data[rowIndex - 1])) {
        spans.set(rowIndex + span.property, span)
        continue
      }

      // 如果当前值与上一行的值相同时，合并行数默认为0
      span.rowspan = 0

      // 获取上一行当前列的合并行数
      const preRowspan = spans.get(rowIndex - 1 + span.property) as MergeSpan<T>
      // 当前行关联的根行的索引值为：如果上一行是被合并的单元格，则取上一行当前列的关联的根行的索引值；否则取上一行索引值
      span.rootRowIndex =
        preRowspan.rowspan === 0 ? preRowspan.rootRowIndex : rowIndex - 1

      // 根据关联的根行的索引值更新对应的行合并数
      const rootSpan = spans.get(
        span.rootRowIndex + span.property
      ) as MergeSpan<T>
      rootSpan.rowspan += 1

      spans.set(rowIndex + span.property, span)
    }
  }

  /**
   * 构建合并列数据
   * @param rowIndex  当前行索引
   * @param row       当前行数据
   * @param mergeCols 合并列配置
   * @param spans     合并单元格数据
   */
  const buildMergeColsSpan = (
    rowIndex: number,
    row: T,
    mergeCols: MergeSpan<T>[],
    spans: Map<string, MergeSpan<T>>
  ) => {
    for (let i = 0; i < mergeCols.length; i++) {
      // 单元格
      const col = mergeCols[i]
      // 当前单元格的数据
      const colValue = col?.getValue(row)

      // 当前单元格合并数据
      const span = Object.assign({}, col) as MergeSpan<T>
      span.rowIndex = rowIndex
      span.colspan = 1

      setSpanOrUpdateColspan(spans, rowIndex, span)

      i = updateSpanAndGetNextColumnIndex(
        row,
        spans,
        rowIndex,
        mergeCols,
        i,
        colValue
      )
    }
  }

  /**
   * 更新当前列的span数，并获取下一个待处理的列的索引
   * @param row             当前行数据
   * @param spans           合并单元格数据
   * @param rowIndex        当前行索引
   * @param mergeCols       合并列配置
   * @param rootColIndex    当前单元格索引
   * @param rootColValue    当前单元格数据
   * @return number
   */
  const updateSpanAndGetNextColumnIndex = (
    row: T,
    spans: Map<string, MergeSpan<T>>,
    rowIndex: number,
    mergeCols: MergeSpan<T>[],
    rootColIndex: number,
    rootColValue: any
  ) => {
    // 下一个待处理的列的索引
    let nextColumnIndex
    // 合并列长度
    const mergeColsLength = mergeCols.length
    for (let i = rootColIndex + 1; i < mergeColsLength; i++) {
      // 获取当前单元格
      const column = mergeCols[i]

      // 初始化合并数据
      const span = Object.assign({}, column) as MergeSpan<T>
      span.rowIndex = rowIndex
      span.colspan = 0

      const rootSpan = spans.get(
        rowIndex + mergeCols[rootColIndex].property
      ) as MergeSpan<T>

      // 如果指定单元格与当前单元格数据不匹配，则直接返回
      if (rootColValue !== column.getValue(row)) {
        // 更新指定单元格合并列数
        rootSpan.colspan = i - rootColIndex
        // 重置下一个待处理的列的索引为上一个列的索引，这样才能重新以当前单元格为开始进行匹配
        nextColumnIndex = i - 1
        break
      }

      // 如果直到最后一个单元格，其值也都一样
      if (i === mergeColsLength - 1) {
        // 更新指定单元格合并列数
        rootSpan.colspan = i - rootColIndex + 1
        // 重置下一个待处理的列的索引为合并列的最后一个索引值，这样才能结束下一个单元格匹配
        nextColumnIndex = mergeColsLength - 1
      }

      setSpanOrUpdateColspan(spans, rowIndex, span)
    }
    return nextColumnIndex || rootColIndex
  }

  /**
   * 设置或更新span
   * @param spans
   * @param rowIndex
   * @param span
   */
  const setSpanOrUpdateColspan = (
    spans: Map<string, MergeSpan<T>>,
    rowIndex: number,
    span: MergeSpan<T>
  ) => {
    const key = String(rowIndex) + span.property
    const sourceSpan = spans.get(key) as MergeSpan<T>
    if (sourceSpan) {
      sourceSpan.colspan = span.colspan
      return
    }
    spans.set(key, span)
  }

  return {
    buildSpans,
  }
}

export default useUtils
