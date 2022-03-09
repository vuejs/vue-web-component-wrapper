import _Vue, { Component, AsyncComponent } from 'vue'

declare function wrap(
  Vue: typeof _Vue,
  Component: Component | AsyncComponent,
  plugin?: any // update any to a better typing (i.e. VueConstructor...)
): HTMLElement

export default wrap
