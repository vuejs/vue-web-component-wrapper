var wrapVueWebComponent = (function () {
  'use strict';

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

  function injectHook (options, key, hook) {
    options[key] = [].concat(options[key] || []);
    options[key].unshift(hook);
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

  function convertAttributeValue (value, name, { type } = {}) {
    if (isBoolean(type)) {
      if (value === 'true' || value === 'false') {
        return value === 'true'
      }
      if (value === '' || value === name || value != null) {
        return true
      }
      return value
    } else if (isNumber(type)) {
      const parsed = parseFloat(value, 10);
      return isNaN(parsed) ? value : parsed
    } else {
      return value
    }
  }

  function toVNodes (h, children) {
    const res = [];
    for (let i = 0, l = children.length; i < l; i++) {
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
    for (let i = 0, l = node.attributes.length; i < l; i++) {
      const attr = node.attributes[i];
      res[attr.nodeName] = attr.nodeValue;
    }
    return res
  }

  /**
   *
   * @param {import("vue").Vue} Vue
   * @param {import("vue").Component | import("vue").AsyncComponent} Component
   * @return {CustomElementConstructor}
   */
  function wrap$2 (Vue, Component) {
    const isAsync = typeof Component === 'function' && !Component.cid;
    let isInitialized = false;
    let hyphenatedPropsList;
    let camelizedPropsList;
    let camelizedPropsMap;

    function initialize (Component) {
      if (isInitialized) return

      const options = typeof Component === 'function'
        ? Component.options
        : Component;

      // extract props info
      const propsList = Array.isArray(options.props)
        ? options.props
        : Object.keys(options.props || {});
      hyphenatedPropsList = propsList.map(hyphenate);
      camelizedPropsList = propsList.map(camelize);
      const originalPropsAsObject = Array.isArray(options.props) ? {} : options.props || {};
      camelizedPropsMap = camelizedPropsList.reduce((map, key, i) => {
        map[key] = originalPropsAsObject[propsList[i]];
        return map
      }, {});

      // proxy $emit to native DOM events
      injectHook(options, 'beforeCreate', function () {
        const emit = this.$emit;
        this.$emit = (name, ...args) => {
          this.$root.$options.customElement.dispatchEvent(createCustomEvent(name, args));
          return emit.call(this, name, ...args)
        };
      });

      injectHook(options, 'created', function () {
        // sync default props values to wrapper on created
        camelizedPropsList.forEach(key => {
          this.$root.props[key] = this[key];
        });
      });

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

      isInitialized = true;
    }

    function syncAttribute (el, key) {
      const camelized = camelize(key);
      const value = el.hasAttribute(key) ? el.getAttribute(key) : undefined;
      el._wrapper.props[camelized] = convertAttributeValue(
        value,
        key,
        camelizedPropsMap[camelized]
      );
    }

    class CustomElement extends HTMLElement {
      constructor () {
        const self = super();
        self.attachShadow({ mode: 'open' });

        const wrapper = self._wrapper = new Vue({
          name: 'shadow-root',
          customElement: self,
          shadowRoot: self.shadowRoot,
          data () {
            return {
              props: {},
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

        // Use MutationObserver to react to future attribute & slot content change
        const observer = new MutationObserver(mutations => {
          let hasChildrenChange = false;
          for (let i = 0; i < mutations.length; i++) {
            const m = mutations[i];
            if (isInitialized && m.type === 'attributes' && m.target === self) {
              syncAttribute(self, m.attributeName);
            } else {
              hasChildrenChange = true;
            }
          }
          if (hasChildrenChange) {
            wrapper.slotChildren = Object.freeze(toVNodes(
              wrapper.$createElement,
              self.childNodes
            ));
          }
        });
        observer.observe(self, {
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
          // initialize attributes
          const syncInitialAttributes = () => {
            wrapper.props = getInitialProps(camelizedPropsList);
            hyphenatedPropsList.forEach(key => {
              syncAttribute(this, key);
            });
          };

          if (isInitialized) {
            syncInitialAttributes();
          } else {
            // async & unresolved
            Component().then(resolved => {
              if (resolved.__esModule || resolved[Symbol.toStringTag] === 'Module') {
                resolved = resolved.default;
              }
              initialize(resolved);
              syncInitialAttributes();
            });
          }
          // initialize children
          wrapper.slotChildren = Object.freeze(toVNodes(
            wrapper.$createElement,
            this.childNodes
          ));
          wrapper.$mount();
          this.shadowRoot.appendChild(wrapper.$el);
        } else {
          callHooks(this.vueComponent, 'activated');
        }
      }

      disconnectedCallback () {
        callHooks(this.vueComponent, 'deactivated');
      }
    }

    if (!isAsync) {
      initialize(Component);
    }

    return CustomElement
  }

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation.

  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.

  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      if (typeof b !== "function" && b !== null)
          throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  function wrap$1(Vue, Component) {
      /* WIP */
      var CustomElement = /** @class */ (function (_super) {
          __extends(CustomElement, _super);
          function CustomElement() {
              var _this = _super.call(this) || this;
              _this.attachShadow({ mode: 'open' });
              // shadow root was attached with its mode set to open, so this shadow root is nonnull.
              var shadowRoot = _this.shadowRoot;
              _this._wrapper = Vue.createApp({
                  data: function () {
                      return {
                          props: {},
                          slotChildren: []
                      };
                  },
                  render: function () {
                      return Vue.h(Component, this.props);
                  }
              }).mount(shadowRoot.host);
              return _this;
          }
          return CustomElement;
      }(HTMLElement));
      return CustomElement;
  }

  var majorVersion = function (Vue) {
      if (typeof Vue.version !== 'string') {
          return null;
      }
      return Vue.version.split('.')[0];
  };
  var isV2 = function (Vue) {
      return majorVersion(Vue) === '2';
  };
  var isV3 = function (Vue) {
      return majorVersion(Vue) === '3';
  };
  function wrap(Vue, Component) {
      if (isV2(Vue)) {
          return wrap$2(Vue, Component);
      }
      if (isV3(Vue)) {
          return wrap$1(Vue, Component);
      }
      throw new Error('supported vue version is v2 or v3.');
  }

  return wrap;

}());
