const camelizeRE = /-(\w)/g;
const camelize = str => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
};

const hyphenateRE = /\B([A-Z])/g;
const hyphenate = str => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
};

function getInitialProps (propsList) {
  const res = {};
  propsList.forEach(key => {
    res[key] = undefined;
  });
  return res
}

function callHooks (vm, hook) {
  if (vm) {
    const hooks = vm.$options[hook] || [];
    hooks.forEach(hook => {
      hook.call(vm);
    });
  }
}

function createCustomEvent (name, args) {
  return new CustomEvent(name, {
    bubbles: false,
    cancelable: false,
    detail: args
  })
}

const isBoolean = val => /function Boolean/.test(String(val));
const isNumber = val => /function Number/.test(String(val));

function convertAttributeValue (value, name, options) {
  if (isBoolean(options.type)) {
    if (value === 'true' || value === 'false') {
      return value === 'true'
    }
    if (value === '' || value === name) {
      return true
    }
    return value != null
  } else if (isNumber(options.type)) {
    const parsed = parseFloat(value, 10);
    return isNaN(parsed) ? value : parsed
  } else {
    return value
  }
}

function toVNodes (h, children) {
  const res = [];
  for (let i = 0; i < children.length; i++) {
    res.push(toVNode(h, children[i]));
  }
  return res
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
    };
    if (data.attrs.slot) {
      data.slot = data.attrs.slot;
      delete data.attrs.slot;
    }
    return h(node.tagName, data)
  } else {
    return null
  }
}

function getAttributes (node) {
  const res = {};
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    res[attr.nodeName] = attr.nodeValue;
  }
  return res
}

function wrap (Vue, Component) {
  const options = typeof Component === 'function'
    ? Component.options
    : Component;

  // inject hook to proxy $emit to native DOM events
  options.beforeCreate = [].concat(options.beforeCreate || []);
  options.beforeCreate.unshift(function () {
    const emit = this.$emit;
    this.$emit = (name, ...args) => {
      this.$root.$options.customElement.dispatchEvent(createCustomEvent(name, args));
      return emit.call(this, name, ...args)
    };
  });

  // extract props info
  const propsList = Array.isArray(options.props)
    ? options.props
    : Object.keys(options.props || {});
  const hyphenatedPropsList = propsList.map(hyphenate);
  const camelizedPropsList = propsList.map(camelize);
  const originalPropsAsObject = Array.isArray(options.props) ? {} : options.props || {};
  const camelizedPropsMap = camelizedPropsList.reduce((map, key, i) => {
    map[key] = originalPropsAsObject[propsList[i]];
    return map
  }, {});

  class CustomElement extends HTMLElement {
    static get observedAttributes () {
      return hyphenatedPropsList
    }

    constructor () {
      super();
      this.attachShadow({ mode: 'open' });
      const wrapper = this._wrapper = new Vue({
        name: 'shadow-root',
        customElement: this,
        shadowRoot: this.shadowRoot,
        data () {
          return {
            props: getInitialProps(camelizedPropsList),
            slotChildren: []
          }
        },
        render (h) {
          return h(Component, {
            ref: 'inner',
            props: this.props
          }, this.slotChildren)
        }
      });

      // Use MutationObserver to react to slot content change
      const observer = new MutationObserver(() => {
        wrapper.slotChildren = Object.freeze(toVNodes(
          wrapper.$createElement,
          this.childNodes
        ));
      });
      observer.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }

    get vueComponent () {
      return this._wrapper.$refs.inner
    }

    connectedCallback () {
      const wrapper = this._wrapper;
      if (!wrapper._isMounted) {
        // initialize children
        wrapper.slotChildren = Object.freeze(toVNodes(
          wrapper.$createElement,
          this.childNodes
        ));
        wrapper.$mount();
        // sync default props values to wrapper
        camelizedPropsList.forEach(key => {
          wrapper.props[key] = this.vueComponent[key];
        });
        this.shadowRoot.appendChild(wrapper.$el);
      } else {
        callHooks(this.vueComponent, 'activated');
      }
    }

    disconnectedCallback () {
      callHooks(this.vueComponent, 'deactivated');
    }

    // watch attribute change and sync
    attributeChangedCallback (attrName, oldVal, newVal) {
      const camelized = camelize(attrName);
      this._wrapper.props[camelized] = convertAttributeValue(
        newVal,
        attrName,
        camelizedPropsMap[camelized]
      );
    }
  }

  // proxy props as Element properties
  camelizedPropsList.forEach(key => {
    Object.defineProperty(CustomElement.prototype, key, {
      get () {
        return this._wrapper.props[key]
      },
      set (newVal) {
        this._wrapper.props[key] = newVal;
      },
      enumerable: false,
      configurable: true
    });
  });

  return CustomElement
}

export default wrap;
