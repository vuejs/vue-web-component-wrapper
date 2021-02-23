import _Vue, { Component, AsyncComponent } from 'vue'

declare function wrap(
  Vue: typeof _Vue,
  Component: Component | AsyncComponent,
  options: { shadowMode?: 'closed' | 'open' }
): HTMLElement

export default wrap