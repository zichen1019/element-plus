import { withInstall } from '@element-plus/utils'
import Crud from './src/crud.vue'

export const ElCrud = withInstall(Crud, {})

export default ElCrud

export type CrudInstance = InstanceType<typeof Crud>
