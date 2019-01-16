import _Vue, { Component } from 'vue'

declare function wrap(
  Vue: typeof _Vue,
  Component: Component
): HTMLElement

export default wrap
