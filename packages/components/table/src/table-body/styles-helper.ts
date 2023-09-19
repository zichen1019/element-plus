// @ts-nocheck
import { inject } from 'vue'
import { useNamespace } from '@element-plus/hooks'
import {
  ensurePosition,
  getFixedColumnOffset,
  getFixedColumnsClass,
} from '../util'
import { TABLE_INJECTION_KEY } from '../tokens'
import type { TableColumnCtx } from '../table-column/defaults'
import type { TableBodyProps } from './defaults'

function useStyles<T>(props: Partial<TableBodyProps<T>>) {
  const parent = inject(TABLE_INJECTION_KEY)
  const ns = useNamespace('table')

  const getRowStyle = (row: T, rowIndex: number) => {
    const rowStyle = parent?.props.rowStyle
    if (typeof rowStyle === 'function') {
      return rowStyle.call(null, {
        row,
        rowIndex,
      })
    }
    return rowStyle || null
  }

  const getRowClass = (row: T, rowIndex: number) => {
    const classes = [ns.e('row')]
    if (
      parent?.props.highlightCurrentRow &&
      row === props.store.states.currentRow.value
    ) {
      classes.push('current-row')
    }

    if (props.stripe && rowIndex % 2 === 1) {
      classes.push(ns.em('row', 'striped'))
    }
    const rowClassName = parent?.props.rowClassName
    if (typeof rowClassName === 'string') {
      classes.push(rowClassName)
    } else if (typeof rowClassName === 'function') {
      classes.push(
        rowClassName.call(null, {
          row,
          rowIndex,
        })
      )
    }
    return classes
  }

  const getCellStyle = (
    rowIndex: number,
    columnIndex: number,
    row: T,
    column: TableColumnCtx<T>
  ) => {
    const cellStyle = parent?.props.cellStyle
    let cellStyles = cellStyle ?? {}
    if (typeof cellStyle === 'function') {
      cellStyles = cellStyle.call(null, {
        rowIndex,
        columnIndex,
        row,
        column,
      })
    }
    const fixedStyle = getFixedColumnOffset(
      columnIndex,
      props?.fixed,
      props.store
    )
    ensurePosition(fixedStyle, 'left')
    ensurePosition(fixedStyle, 'right')
    return Object.assign({}, cellStyles, fixedStyle)
  }

  const getCellClass = (
    rowIndex: number,
    columnIndex: number,
    row: T,
    column: TableColumnCtx<T>,
    offset: number
  ) => {
    const fixedClasses = getFixedColumnsClass(
      ns.b(),
      columnIndex,
      props?.fixed,
      props.store,
      undefined,
      offset
    )
    const classes = [column.id, column.align, column.className, ...fixedClasses]
    const cellClassName = parent?.props.cellClassName
    if (typeof cellClassName === 'string') {
      classes.push(cellClassName)
    } else if (typeof cellClassName === 'function') {
      classes.push(
        cellClassName.call(null, {
          rowIndex,
          columnIndex,
          row,
          column,
        })
      )
    }
    classes.push(ns.e('cell'))
    return classes.filter((className) => Boolean(className)).join(' ')
  }
  const getSpan = (
    row: T,
    column: TableColumnCtx<T>,
    rowIndex: number,
    columnIndex: number,
    spans: []
  ) => {
    let rowspan = 1
    let colspan = 1
    const fn = parent?.props.spanMethod
    const mergeCols = parent?.props.mergeCols
    const mergeRows = parent?.props.mergeRows
    if (typeof fn === 'function') {
      const result = fn({
        row,
        column,
        rowIndex,
        columnIndex,
      })
      if (Array.isArray(result)) {
        rowspan = result[0]
        colspan = result[1]
      } else if (typeof result === 'object') {
        rowspan = result.rowspan
        colspan = result.colspan
      }
    } else if (mergeCols || mergeRows) {
      const result = mergeColRows(rowIndex, column.property, spans)
      rowspan = result.rowspan
      colspan = result.colspan
    }
    return { rowspan, colspan }
  }

  /**
   * 合并行、合并列
   * @param rowIndex
   * @param property
   * @param spans
   */
  const mergeColRows = (rowIndex: number, property: string, spans: []) => {
    // 遍历本行合并表
    const span = {
      rowspan: 1,
      colspan: 1,
    }
    for (const _c of spans[rowIndex].mergeColsSpans) {
      // 列属性匹配
      if (_c.colProperty === property) {
        // 若合并表指向本单元格则构建合并参数并返回
        if (_c.rowIndex === rowIndex) {
          span.colspan = _c.colSpan
        }
        break
      }
    }
    // 行间合并
    for (const _r of spans[rowIndex].mergeRowsSpans) {
      // 列属性匹配
      if (_r.colProperty === property) {
        // 若合并表指向本单元格则构建合并参数并返回
        if (_r.rowIndex === rowIndex) {
          span.rowspan = _r.rowSpan
        } else {
          // 否则隐藏该单元格。这里必须有，否则单元格会被右移一列
          span.rowspan = 0
        }
        break
      }
    }
    return span
  }

  const getColspanRealWidth = (
    columns: TableColumnCtx<T>[],
    colspan: number,
    index: number
  ): number => {
    if (colspan < 1) {
      return columns[index].realWidth
    }
    const widthArr = columns
      .map(({ realWidth, width }) => realWidth || width)
      .slice(index, index + colspan)
    return Number(
      widthArr.reduce((acc, width) => Number(acc) + Number(width), -1)
    )
  }

  return {
    getRowStyle,
    getRowClass,
    getCellStyle,
    getCellClass,
    getSpan,
    getColspanRealWidth,
  }
}

export default useStyles
