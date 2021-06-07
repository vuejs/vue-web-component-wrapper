import type VueV2 from 'vue';
import type { Component as VueV2Component, AsyncComponent as VueV2AsyncComponent } from 'vue';
import type * as VueV3 from 'vue-v3';
import type { Component as VueV3Component } from 'vue-v3';

import wrapV2 from './wrapV2.js'
import wrapV3 from './wrapV3'

const majorVersion = (Vue: any): string | null => {
  if (typeof Vue.version !== 'string') {
    return null
  }
  return Vue.version.split('.')[0]
}

const isV2 = (Vue: any): Vue is typeof VueV2 => {
  return majorVersion(Vue) === '2'
}

const isV3 = (Vue: any): Vue is typeof VueV3 => {
  return majorVersion(Vue) === '3'
}

function wrap(Vue: typeof VueV2, Component: VueV2Component | VueV2AsyncComponent): CustomElementConstructor

function wrap(Vue: typeof VueV3, Component: VueV3Component): CustomElementConstructor

function wrap(Vue: any, Component: any): CustomElementConstructor {
  if (isV2(Vue)) {
    return wrapV2(Vue, Component)
  }
  if (isV3(Vue)) {
    return wrapV3(Vue, Component)
  }

  throw new Error('supported vue version is v2 or v3.')
}

export default wrap
