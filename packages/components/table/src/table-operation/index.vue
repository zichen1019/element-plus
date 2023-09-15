<template>
  <div class="crud-opts">
    <span class="crud-opts-left">
      <!--操作按钮插槽-->
      <slot name="opts" />
    </span>
    <el-button-group class="crud-opts-right">
      <!--      <el-button-->
      <!--        plain-->
      <!--        type="info"-->
      <!--        icon="el-icon-search"-->
      <!--        @click="toggleSearch()"-->
      <!--      />-->
      <!--      <el-button icon="el-icon-refresh" @click="crud.refresh()" />-->
      <el-popover
        :visible="tableColumnsPopoverVisible"
        placement="bottom-end"
        width="610"
      >
        <template #reference>
          <el-button
            :icon="ElIconGrid"
            @click="tableColumnsPopoverVisible = !tableColumnsPopoverVisible"
          />
        </template>
        <el-table-column-setting @close="tableColumnsPopoverVisible = false" />
      </el-popover>
    </el-button-group>
  </div>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import { Grid as ElIconGrid } from '@element-plus/icons-vue'
import { ElButton, ElButtonGroup } from '../../../button'
import { ElPopover } from '../../../popover'
import ElTableColumnSetting from '../table-column-setting/index.vue'

export default defineComponent({
  name: 'ElTableOperation',
  components: { ElTableColumnSetting, ElButton, ElButtonGroup, ElPopover },
  setup() {
    return {
      ElIconGrid,
    }
  },
  data() {
    return {
      tableColumnsPopoverVisible: false,
    }
  },
  methods: {},
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
