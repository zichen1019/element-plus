<template>
  <div :class="ns.e('crud-opts')">
    <span :class="ns.e('crud-opts-left')">
      <!--操作按钮插槽-->
      <slot name="opts" />
    </span>
    <el-button-group :class="ns.e('crud-opts-right')">
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
import { useNamespace } from '@element-plus/hooks'
import { ElButton, ElButtonGroup } from '../../../button'
import { ElPopover } from '../../../popover'
import ElTableColumnSetting from '../table-column-setting/index.vue'

export default defineComponent({
  name: 'ElTableOperation',
  components: { ElTableColumnSetting, ElButton, ElButtonGroup, ElPopover },
  setup() {
    const ns = useNamespace('table-operation')
    return {
      ns,
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
