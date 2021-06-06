import type VueV2 from 'vue';
import type { Component, AsyncComponent } from 'vue';
import type * as VueV3 from 'vue-v3';
export default function wrap(Vue: typeof VueV2 | typeof VueV3, Component: Component | AsyncComponent): CustomElementConstructor;
