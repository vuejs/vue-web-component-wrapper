import * as VueJS from 'vue'

declare function wrap(
  Vue: VueJS.default,
  Component: VueJS.VueConstructor<VueJS.default>
): HTMLElement

export default wrap
