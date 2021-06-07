import type VueV2 from 'vue';
import type { Component as VueV2Component, AsyncComponent as VueV2AsyncComponent } from 'vue';
import type * as VueV3 from 'vue-v3';
import type { Component as VueV3Component } from 'vue-v3';
declare function wrap(Vue: typeof VueV2, Component: VueV2Component | VueV2AsyncComponent): CustomElementConstructor;
declare function wrap(Vue: typeof VueV3, Component: VueV3Component): CustomElementConstructor;
export default wrap;
