<template>
  <div>
    <h1>Crud components</h1>
  </div>
</template>

<script lang="ts" setup>
import { useNamespace } from '@element-plus/hooks'

defineOptions({
  name: 'ElCrud',
})

const ns = useNamespace('crud')
</script>

<style scoped></style>
