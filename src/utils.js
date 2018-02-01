const camelizeRE = /-(\w)/g
export const camelize = str => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
}

const hyphenateRE = /\B([A-Z])/g
export const hyphenate = str => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
}

export function getInitialProps (propsList) {
  const res = {}
  for (const key of propsList) {
    res[key] = undefined
  }
  return res
}

export function callHooks (vm, hook) {
  if (vm) {
    const hooks = vm.$options[hook] || []
    hooks.forEach(hook => {
      hook.call(vm)
    })
  }
}

export function createCustomEvent (name, args) {
  return new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: args
  })
}

const isBoolean = val => /function Boolean/.test(String(val))
const isNumber = val => /function Number/.test(String(val))

export function convertAttributeValue (value, name, options) {
  if (isBoolean(options.type)) {
    if (value === 'true' || value === 'false') {
      return value === 'true'
    }
    if (value === '' || value === name) {
      return true
    }
    return value != null
  } else if (isNumber(options.type)) {
    const parsed = parseFloat(value, 10)
    return isNaN(parsed) ? value : parsed
  } else {
    return value
  }
}

export function toVNodes (h, children) {
  return [].map.call(children, node => toVNode(h, node))
}

function toVNode (h, node) {
  if (node.nodeType === 3) {
    return node.data.trim() ? node.data : null
  } else if (node.nodeType === 1) {
    const data = {
      attrs: getAttributes(node),
      domProps: {
        innerHTML: node.innerHTML
      }
    }
    if (data.attrs.slot) {
      data.slot = data.attrs.slot
      delete data.attrs.slot
    }
    return h(node.tagName, data)
  } else {
    return null
  }
}

function getAttributes (node) {
  const res = {}
  for (const attr of node.attributes) {
    res[attr.nodeName] = attr.nodeValue
  }
  return res
}
