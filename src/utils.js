  
import {createVNode} from 'vue'
const camelizeRE = /-(\w)/g;
export const camelize = str => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ""));
};

const hyphenateRE = /\B([A-Z])/g;
export const hyphenate = str => {
  return str.replace(hyphenateRE, "-$1").toLowerCase();
};

export function getInitialProps(propsList) {
  const res = {};
  propsList.forEach(key => {
    res[key] = undefined;
  });
  return res;
}

export function injectHook(options, key, hook) {
    const defaultHook = options[key]
    if(defaultHook){
        options[key] = function(){
            hook.call(this)
            defaultHook.call(this)
        }
    }else {
        options[key] = hook;
    }
  
}

export function callHooks(vm, hook) {
  const _hook = vm?.$options[hook]
  if (_hook) {
    _hook.call(vm)
  }
}

export function createCustomEvent(name, args) {
  return new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: args
  });
}

const isBoolean = val => /function Boolean/.test(String(val));
const isNumber = val => /function Number/.test(String(val));

export function convertAttributeValue(value, name, { type } = {}) {
  if (isBoolean(type)) {
    if (value === "true" || value === "false") {
      return value === "true";
    }
    if (value === "" || value === name || value != null) {
      return true;
    }
    return value;
  } else if (isNumber(type)) {
    const parsed = parseFloat(value, 10);
    return isNaN(parsed) ? value : parsed;
  } else {
    return value;
  }
}

export function toVNodes(children) {
  const res = [];
  for (let i = 0, l = children.length; i < l; i++) {
    res.push(toVNode(children[i]));
  }
  return res;
}

export function toVNode(node) {
  if (node.nodeType === 3) {
    return node.data.trim() ? node.data : null;
  } else if (node.nodeType === 1) {
    let children = null
    if(node.childNodes){
      children =  toVNodes(node.childNodes);
    }

    return createVNode(node.tagName, { ...getAttributes(node) },children);
  } else {
    return null;
  }
}

export function getAttributes(node) {
  const res = {};
  for (let i = 0, l = node.attributes.length; i < l; i++) {
    const attr = node.attributes[i];
    res[attr.nodeName] = attr.nodeValue;
  }
  return res;
}