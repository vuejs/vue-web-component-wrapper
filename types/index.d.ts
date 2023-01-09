import _Vue, { Component, AsyncComponent } from 'vue'

declare function wrap(
  Vue: typeof _Vue,
  Component: Component | AsyncComponent
): CustomElementConstructor

export default wrap
