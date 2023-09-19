// @ts-nocheck
import {
  defineComponent,
  getCurrentInstance,
  h,
  inject,
  onUnmounted,
  watch,
} from 'vue'
import { addClass, isClient, rAF, removeClass } from '@element-plus/utils'
import { useNamespace } from '@element-plus/hooks'
import useLayoutObserver from '../layout-observer'
import { removePopper } from '../util'
import { TABLE_INJECTION_KEY } from '../tokens'
import useRender from './render-helper'
import defaultProps from './defaults'

import type { VNode } from 'vue'

/**
 * 深拷贝
 * @param o
 */
const deepCopy = (o) => {
  if (Array.isArray(o)) {
    const n = []
    for (const [i, element] of o.entries()) {
      n[i] = deepCopy(element)
    }
    return n
  } else if (o instanceof Object) {
    const nn = {}
    for (const j in o) {
      nn[j] = deepCopy(o[j])
    }
    return nn
  } else {
    return o
  }
}

/**
 * 合并行与列
 * @param data  需要合并的table
 * @param cols  行与行之间合并的字段
 * @param rows  行内合并的字段
 */
const buildSpans = (data, cols, rows) => {
  const spans = []
  const localCols = cols?.map((col) => {
    return {
      rowSpan: 1,
      colSpan: 1,
      rowIndex: null,
      colIndex: null,
      colProperty: col.property,
      order: 0, // 行序号
      value: null,
      getValue: col.getValue,
    }
  }) // 行间合并
  const localRows = rows?.map((row) => {
    return {
      rowSpan: 1,
      colSpan: 1,
      rowIndex: null,
      colIndex: null,
      colProperty: row.property,
      value: null,
      getValue: row.getValue,
    }
  })
  for (const [i, row] of data.entries()) {
    spans[i] = {
      mergeRowsSpans: [],
      mergeColsSpans: [],
    }
    // 行间合并
    for (const j in localRows) {
      const localRow = localRows[j]
      if (i === 0 || localRow.value !== localRow.getValue(row)) {
        // 边界指针，1.第一条硬性第一个边界 2.与上一单元格值不同的属于边界
        localRow.rowIndex = i // 行索引，若下一单元格值相同则以此索引叠加rowSpan值
        localRow.rowSpan = 1 // rowSpan默认1
        localRow.value = localRow.getValue(row) // 单元格值
        localRow.order += 1 // 行号+1
      } else {
        // 若本单元格值==上一单元格值则合并列，rowSpan+=1
        for (const span of spans[localRow.rowIndex].mergeRowsSpans) {
          if (span.colProperty === localRow.colProperty) {
            span.rowSpan += 1
          } else {
            break
          }
        }
      }
    }
    spans[i].mergeRowsSpans = deepCopy(localRows) // 深度复制，否则总是指向最后一条数据
    // 行内合并【列合并】
    for (let j = 0; j < localCols.length; j++) {
      // 单元格
      const column = localCols[j]
      // 当前单元格的数据
      const columnValue = column?.getValue(row)

      // 当前单元格合并数据
      const span = Object.assign({}, column)
      span.rowSpan = 1 // rowSpan默认1
      span.colSpan = 1
      span.rowIndex = i // 行索引，若下一单元格值相同则以此索引叠加rowSpan值
      spans[i].mergeColsSpans.push(span)
      j = updateSpanAndGetNextColumnIndex(
        row,
        spans,
        i,
        localCols,
        j,
        columnValue
      )
    }
  }
  return spans
}

/**
 * 更新当前列的span数，并获取下一个待处理的列的索引
 * @param row
 * @param spans
 * @param rowIndex
 * @param localCols
 * @param mergeColsIndex
 * @param columnValue
 */
const updateSpanAndGetNextColumnIndex = (
  row,
  spans,
  rowIndex,
  localCols,
  mergeColsIndex,
  columnValue
) => {
  // console.log('----------------------------init nextColumn', i, mergeColsIndex + 1)
  let nextColumnIndex
  const localColsLength = localCols.length
  for (let k = mergeColsIndex + 1; k < localColsLength; k++) {
    const nextColumn = localCols[k]
    const nextSpan = Object.assign({}, nextColumn)
    nextSpan.rowSpan = 0
    nextSpan.colSpan = 0
    if (columnValue !== nextColumn.getValue(row)) {
      spans[rowIndex].mergeColsSpans[mergeColsIndex].colSpan =
        k - mergeColsIndex
      nextColumnIndex = k - 1
      // console.log('nextColumn break 1', i, mergeColsIndex)
      break
    }
    if (k === localColsLength - 1) {
      spans[rowIndex].mergeColsSpans[mergeColsIndex].colSpan =
        k - mergeColsIndex + 1
      nextColumnIndex = localColsLength - 1
      // console.log('nextColumn break 2', i, k, mergeColsIndex)
    }
    nextSpan.rowIndex = rowIndex
    spans[rowIndex].mergeColsSpans.push(nextSpan)
  }
  // console.log('nextColumn over', mergeColsIndex)
  return nextColumnIndex
}

export default defineComponent({
  name: 'ElTableBody',
  props: defaultProps,
  setup(props) {
    const instance = getCurrentInstance()
    const parent = inject(TABLE_INJECTION_KEY)
    const ns = useNamespace('table')
    const { wrappedRowRender, tooltipContent, tooltipTrigger } =
      useRender(props)
    const { onColumnsChange, onScrollableChange } = useLayoutObserver(parent!)

    watch(props.store.states.hoverRow, (newVal: any, oldVal: any) => {
      if (!props.store.states.isComplex.value || !isClient) return

      rAF(() => {
        // just get first level children; fix #9723
        const el = instance?.vnode.el as HTMLElement
        const rows = Array.from(el?.children || []).filter((e) =>
          e?.classList.contains(`${ns.e('row')}`)
        )
        const oldRow = rows[oldVal]
        const newRow = rows[newVal]
        if (oldRow) {
          removeClass(oldRow, 'hover-row')
        }
        if (newRow) {
          addClass(newRow, 'hover-row')
        }
      })
    })

    onUnmounted(() => {
      removePopper?.()
    })

    return {
      ns,
      onColumnsChange,
      onScrollableChange,
      wrappedRowRender,
      tooltipContent,
      tooltipTrigger,
    }
  },
  render() {
    const { wrappedRowRender, store } = this
    const parent = inject(TABLE_INJECTION_KEY)
    const data = store.states.data.value || []

    // TODO mergeColsRows
    let spans = []
    const mergeCols = parent?.props.mergeCols
    const mergeRows = parent?.props.mergeRows
    if (mergeCols || mergeRows) {
      console.log('build-spans', spans)
      spans = buildSpans(data, mergeCols, mergeRows)
      console.log('spans', spans)
    }

    // Why do we need tabIndex: -1 ?
    // If you set the tabindex attribute on an element ,
    // then its child content cannot be scrolled with the arrow keys,
    // unless you set tabindex on the content too
    // See https://github.com/facebook/react/issues/25462#issuecomment-1274775248 or https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/tabindex
    return h('tbody', { tabIndex: -1 }, [
      data.reduce((acc: VNode[], row) => {
        return acc.concat(wrappedRowRender(row, acc.length, spans))
      }, []),
    ])
  },
})
