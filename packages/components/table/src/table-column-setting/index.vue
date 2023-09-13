<template>
  <el-table-normal
    ref="tableNormalColumns"
    :data="columns"
    row-key="prop"
    max-height="500px"
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
    <el-table-column prop="hidden" label="隐藏" width="65">
      <template #default="{ row }">
        <el-switch
          v-model="row.hidden"
          :active-value="true"
          :inactive-value="false"
          @change="changeTableColumnAttr"
        />
      </template>
    </el-table-column>
    <el-table-column prop="property" min-width="120px" label="prop" />
    <el-table-column prop="label" min-width="120px" label="名称" />
    <el-table-column prop="width" label="宽度(px)" width="100px">
      <template #default="{ row }">
        <el-input
          v-model="row.width"
          placeholder="auto"
          size="small"
          @change="changeTableColumnAttr"
        />
      </template>
    </el-table-column>
    <el-table-column prop="sortable" label="排序" width="65">
      <template #default="{ row }">
        <el-switch v-model="row.sortable" />
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
import { defineComponent, inject } from 'vue'
import { DCaret as ElIconDCaret } from '@element-plus/icons-vue'
import ElInput from '../../../input'
import ElSwitch from '../../../switch'
import { ElRadioButton, ElRadioGroup } from '../../../radio'
import ElTag from '../../../tag'
import ElTableColumn from '../tableColumn'
import ElTableNormal from '../table-normal.vue'
import { TABLE_INJECTION_KEY } from '../tokens'
import '@element-plus/components/base/style'
import '@element-plus/theme-chalk/src/table.scss'
import '@element-plus/components/switch/style'
import '@element-plus/components/input/style'
import '@element-plus/components/radio/style'
import '@element-plus/components/radio-button/style'
import '@element-plus/components/radio-group/style'

export default defineComponent({
  name: 'ElTableColumnSetting',
  components: {
    ElTableNormal,
    ElTableColumn,
    ElInput,
    ElSwitch,
    ElRadioGroup,
    ElRadioButton,
    ElTag,
    ElIconDCaret,
  },
  setup() {
    const table = inject(TABLE_INJECTION_KEY)
    const columns = table.store.states.originColumns
    console.log(table.store.states)
    console.log('columns', columns)
    const changeTableColumnAttr = () => {
      console.log('changeFixed')
      table.store.scheduleLayout(true)
      // table.state.doLayout()
    }
    return {
      columns,
      changeTableColumnAttr,
    }
  },
})
</script>

<style>
.crud-opts {
  padding: 6px 0;
  display: -webkit-flex;
  display: flex;
  align-items: center;
}

.crud-opts-left {
  display: flex;
}

.crud-opts .crud-opts-right {
  margin-left: auto;
}
</style>
