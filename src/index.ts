import type VueV2 from 'vue';
import type { Component, AsyncComponent } from 'vue';
import type * as VueV3 from 'vue-v3';

import wrapV2 from './wrapV2.js'

const isV2 = (Vue: typeof VueV2 | typeof VueV3): Vue is typeof VueV2 => {
  const vueMajorVersion = Vue.version.split('.')[0];
  return vueMajorVersion === '2';
}

export default function wrap(
  Vue: typeof VueV2 | typeof VueV3,
  Component: Component | AsyncComponent
): CustomElementConstructor {
  if (isV2(Vue)) {
    return wrapV2(Vue, Component)
  } else {
    throw new Error('not implemented')
  }
}
