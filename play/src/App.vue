<template>
  <div>
    <div class="play-container is-hidden">
      <el-icon color="#409EFC">
        <el-icon-check />
      </el-icon>
      <el-icon>
        <el-icon-menu />
      </el-icon>
      <el-button type="primary" @click="handleClick">test</el-button>
    </div>
    <el-table
      ref="table"
      :data="list"
      border
      :merge-cols="mergeCols"
      :merge-rows="mergeRows"
      fit
    >
      <el-table-column type="selection" label="选择" />
      <el-table-column type="index" label="序号" :width="100" />
      <el-table-column prop="a" label="a" :width="1000" />
      <el-table-column prop="b" label="b" hidden />
      <el-table-column prop="c" label="c" />
      <el-table-column prop="d" label="d" />
      <el-table-column prop="e" label="e" />
      <el-table-column prop="f" label="f" />
      <el-table-column prop="g" label="g" />
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" @click="edit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-table ref="table2" :data="list" border fit>
      <el-table-column type="selection" label="选择" />
      <el-table-column type="index" label="序号" :width="100" />
      <el-table-column prop="a" label="a" :width="100" />
      <el-table-column prop="b" label="b" hidden />
      <el-table-column prop="c" label="c" />
      <el-table-column prop="d" label="d" />
      <el-table-column prop="e" label="e" />
      <el-table-column prop="f" label="f" />
      <el-table-column label="操作" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" @click="edit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const handleClick = () => {
  console.log('handleClick')
}

const list = ref([
  { label: 'A1', a: 11, b: 12, c: 13, d: 14, e: 15, f: 16, g: 17 },
  { label: 'A2', a: 11, b: 12, c: 13, d: 13, e: 13, f: 16, g: 17 },
  { label: 'A3', a: 11, b: 12, c: null, d: null, e: null, f: 16, g: 17 },
  { label: 'A4', a: 12, b: 12, c: null, d: null, e: null, f: 16, g: 17 },
  { label: 'A5', a: 11, b: 12, c: null, d: null, e: null, f: 16, g: 17 },
  { label: 'B1', a: 11, b: 22, c: 23, d: 24, e: 25, f: 16, g: 17 },
  { label: 'B2', a: 21, b: 22, c: 21, d: 24, e: 25, f: 16, g: 17 },
  { label: 'B3', a: 31, b: 22, c: 23, d: 24, e: 25, f: 16, g: 17 },
])

const table = ref()

const edit = (row) => {
  console.log('edit', row)
}

const mergeCols = ref([
  {
    property: 'a',
  },
  {
    property: 'c',
    getValue: (row) => row.c,
  },
  {
    property: 'd',
    getValue: (row) => row.d,
  },
  {
    property: 'e',
    getValue: (row) => row.e,
  },
])

const mergeRows = ref(['a', 'f'])

onMounted(() => {
  nextTick(() => {
    // console.log('table width', table.value.store.states.columns.value)
    // table.value.store.states.columns.value[0].width = 500
  })
})
</script>

<style lang="scss">
html,
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  #play {
    height: 100%;
    width: 100%;
    .play-container {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
