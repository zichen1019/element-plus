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
 * 合并行与列
 * @param data  需要合并的table
 * @param cols  行与行之间合并的字段
 * @param rows  行内合并的字段
 */
const buildSpans = (data, cols, rows) => {
  const spans = []
  const spans2 = new Map()
  const defaultGetValue = (property) => {
    return (row) => row[property]
  }
  const mergeCols = cols?.map((col) => {
    return {
      rowspan: 1,
      rowIndex: 0,
      property: col.property,
      getValue: col.getValue || defaultGetValue(col.property),
    }
  })
  // 行间合并
  const mergeRows = rows?.map((row) => {
    return {
      colspan: 1,
      rowIndex: 0,
      property: row.property,
      getValue: row.getValue || defaultGetValue(row.property),
      // 关联的根行的索引值, 从0开始
      rootRowIndex: -1,
    }
  })
  console.log('mergeRows', mergeRows)
  for (const [i, row] of data.entries()) {
    spans[i] = {
      rowSpans: [],
      colSpans: [],
    }
    // 行间合并
    for (const [j, column] of mergeRows.entries()) {
      if (i === 3 && j === 0) {
        console.log(column)
      }
      const rowValue = column.getValue(row)

      // 当前单元格合并数据
      const span = Object.assign({}, column)
      span.rowIndex = i
      span.rowspan = 1

      // 如果是第一行或者当前值与上一行当前列的值不同时，合并行数默认为1
      if (i === 0 || rowValue !== span.getValue(data[i - 1])) {
        spans[i].rowSpans.push(span)
        spans2.set(i + span.property, span)
        continue
      }

      // 如果当前值与上一行的值相同时，合并行数默认为0
      span.rowspan = 0
      // 获取上一行当前列的合并行数
      const preRowspan = spans[i - 1].rowSpans[j]
      // 当前行关联的根行的索引值为：如果上一行是被合并的单元格，则取上一行当前列的关联的根行的索引值；否则取上一行索引值
      if (i === 5 && j === 0) {
        console.log(spans[0].rowSpans[0].rowspan, preRowspan, i - 1)
      }
      span.rootRowIndex =
        preRowspan.rowspan === 0 ? preRowspan.rootRowIndex : i - 1
      // 根据关联的根行的索引值更新对应的行合并数
      // spans[span.rootRowIndex].rowSpans[j].rowspan += 1
      spans2.get(span.rootRowIndex + span.property).rowspan += 1

      spans[i].rowSpans.push(span)
      spans2.set(i + span.property, span)
    }

    // 行内合并【列合并】
    for (let j = 0; j < mergeCols.length; j++) {
      // 单元格
      const column = mergeCols[j]
      // 当前单元格的数据
      const columnValue = column?.getValue(row)

      // 当前单元格合并数据
      const span = Object.assign({}, column)
      span.rowIndex = i
      span.colspan = 1
      spans[i].colSpans.push(span)

      const key = i + span.property
      const oldSpan = spans2.get(key)
      if (oldSpan) {
        oldSpan.colspan = 1
      } else {
        spans2.set(key, span)
      }

      j = updateSpanAndGetNextColumnIndex(
        row,
        spans,
        i,
        mergeCols,
        j,
        columnValue,
        spans2
      )
    }
  }

  console.log(spans)

  return spans2
}

/**
 * 更新当前列的span数，并获取下一个待处理的列的索引
 * @param row
 * @param spans
 * @param rowIndex
 * @param mergeCols
 * @param mergeColsIndex
 * @param columnValue
 */
const updateSpanAndGetNextColumnIndex = (
  row,
  spans,
  rowIndex,
  mergeCols,
  mergeColsIndex,
  columnValue,
  spans2
) => {
  // 下一个待处理的列的索引
  let nextColumnIndex
  // 合并列长度
  const localColsLength = mergeCols.length
  for (let i = mergeColsIndex + 1; i < localColsLength; i++) {
    // 获取当前单元格
    const column = mergeCols[i]

    // 初始化合并数据
    const span = Object.assign({}, column)
    span.rowIndex = rowIndex
    span.colspan = 0

    // 如果指定单元格与当前单元格数据不匹配，则直接返回
    if (columnValue !== column.getValue(row)) {
      // 更新指定单元格合并列数
      spans[rowIndex].colSpans[mergeColsIndex].colspan = i - mergeColsIndex
      spans2.get(rowIndex + mergeCols[mergeColsIndex].property).colspan =
        i - mergeColsIndex
      // 重置下一个待处理的列的索引为上一个列的索引，这样才能重新以当前单元格为开始进行匹配
      nextColumnIndex = i - 1
      break
    }

    // 如果直到最后一个单元格，其值也都一样
    if (i === localColsLength - 1) {
      // 更新指定单元格合并列数
      spans[rowIndex].colSpans[mergeColsIndex].colspan = i - mergeColsIndex + 1
      spans2.get(rowIndex + mergeCols[mergeColsIndex].property).colspan =
        i - mergeColsIndex + 1
      // 重置下一个待处理的列的索引为合并列的最后一个索引值，这样才能结束下一个单元格匹配
      nextColumnIndex = localColsLength - 1
    }
    spans[rowIndex].colSpans.push(span)

    const key = rowIndex + span.property
    const oldSpan = spans2.get(key)
    if (oldSpan) {
      oldSpan.colspan = 1
    } else {
      spans2.set(key, span)
    }
  }
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
