<template>
  <el-table-normal
    ref="tableColumns"
    :data="columns"
    max-height="500"
    size="small"
    border
    fit
    highlight-current-row
  >
    <el-table-column width="60">
      <el-tag class="move" style="cursor: move">
        <el-icon-d-caret style="width: 1em; height: 1em" />
      </el-tag>
    </el-table-column>
    <el-table-column prop="hidden" label="显示" width="65">
      <template #default="{ row }">
        <el-switch
          v-model="row.hidden"
          :active-value="false"
          :inactive-value="true"
          @change="changeTableColumnAttr"
        />
      </template>
    </el-table-column>
    <el-table-column prop="label" label="名称" min-width="120px" />
    <el-table-column prop="width" label="宽度(px)" width="140px">
      <template #default="{ row }">
        <el-input-number
          v-model="row.width"
          placeholder="auto"
          size="small"
          @change="changeTableColumnAttr"
        />
      </template>
    </el-table-column>
    <el-table-column prop="sortable" label="排序" width="65">
      <template #default="{ row }">
        <el-switch
          v-if="row.type !== 'selection' && row.type !== 'index'"
          v-model="row.sortable"
        />
        <span v-else />
      </template>
    </el-table-column>
    <el-table-column prop="fixed" label="固定" min-width="160">
      <template #default="{ row }">
        <el-radio-group
          v-model="row.fixed"
          size="small"
          @change="changeTableColumnAttr"
        >
          <el-radio-button :label="false">关</el-radio-button>
          <el-radio-button label="left">左</el-radio-button>
          <el-radio-button :label="true">中</el-radio-button>
          <el-radio-button label="right">右</el-radio-button>
        </el-radio-group>
      </template>
    </el-table-column>
  </el-table-normal>
</template>

<script lang="ts">
import { defineComponent, inject, nextTick, ref } from 'vue'
import { Sortable } from 'sortablejs'
import { DCaret as ElIconDCaret } from '@element-plus/icons-vue'
import ElInputNumber from '../../../input-number'
import ElSwitch from '../../../switch'
import { ElRadioButton, ElRadioGroup } from '../../../radio'
import ElTag from '../../../tag'
import ElTableColumn from '../tableColumn'
import ElTableNormal from '../table-normal.vue'
import { TABLE_INJECTION_KEY } from '../tokens'
import '@element-plus/components/base/style'
import '@element-plus/theme-chalk/src/table.scss'
import '@element-plus/components/switch/style'
import '@element-plus/components/input-number/style'
import '@element-plus/components/radio/style'
import '@element-plus/components/radio-button/style'
import '@element-plus/components/radio-group/style'

export default defineComponent({
  name: 'ElTableColumnSetting',
  components: {
    ElTableNormal,
    ElTableColumn,
    ElInputNumber,
    ElSwitch,
    ElRadioGroup,
    ElRadioButton,
    ElTag,
    ElIconDCaret,
  },
  setup() {
    const table = inject(TABLE_INJECTION_KEY)
    const columns = table.store.states.settingColumns
    const tableColumns = ref()

    nextTick(() => {
      const tbody = tableColumns.value.$el.querySelectorAll(
        '.el-table__inner-wrapper .el-table__body-wrapper table > tbody'
      )[0]
      new Sortable(tbody, {
        handle: '.move',
        animation: 100,
        ghostClass: 'sortable-ghost',
        onEnd({ newIndex, oldIndex }) {
          // 表格列数组排序
          const currRow = columns.value.splice(oldIndex, 1)[0]
          columns.value.splice(newIndex, 0, currRow)
          table.store.states._columns.value = columns.value
          table.store.updateColumns()
        },
      })
    })
    const changeTableColumnAttr = () => {
      table.store.scheduleLayout(true, true)
    }
    return {
      columns,
      tableColumns,
      changeTableColumnAttr,
    }
  },
})
</script>

<style></style>
