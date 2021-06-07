import type * as _Vue from "vue-v3";
import type { Component, h } from "vue-v3";

export default function wrap(Vue: typeof _Vue, Component: Component): CustomElementConstructor {
  /* WIP */

  class CustomElement extends HTMLElement {
    private _wrapper: _Vue.ComponentPublicInstance

    constructor() {
      super()
      this.attachShadow({ mode: 'open' })
      // shadow root was attached with its mode set to open, so this shadow root is nonnull.
      const shadowRoot = this.shadowRoot as ShadowRoot;

      this._wrapper = Vue.createApp({
        data() {
          return {
            props: {},
            slotChildren: []
          }
        },
        render() {
          return Vue.h(Component, this.props)
        }
      }).mount(shadowRoot.host)
    }
  }

  return CustomElement
}
