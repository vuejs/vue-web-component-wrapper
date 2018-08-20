import {
  toVNodes,
  camelize,
  hyphenate,
  callHooks,
  injectHook,
  getInitialProps,
  createCustomEvent,
  convertAttributeValue
} from './utils.js'

export default function wrap (Vue, Component) {
  const isAsync = typeof Component === 'function' && !Component.cid
  let isInitialized = false
  let hyphenatedPropsList
  let camelizedPropsList
  let camelizedPropsMap

  function initialize (Component) {
    if (isInitialized) return

    const options = typeof Component === 'function'
      ? Component.options
      : Component

    // extract props info
    const propsList = Array.isArray(options.props)
      ? options.props
      : Object.keys(options.props || {})
    hyphenatedPropsList = propsList.map(hyphenate)
    camelizedPropsList = propsList.map(camelize)
    const originalPropsAsObject = Array.isArray(options.props) ? {} : options.props || {}
    camelizedPropsMap = camelizedPropsList.reduce((map, key, i) => {
      map[key] = originalPropsAsObject[propsList[i]]
      return map
    }, {})

    // proxy $emit to native DOM events
    injectHook(options, 'beforeCreate', function () {
      const emit = this.$emit
      this.$emit = (name, ...args) => {
        this.$root.$options.customElement.dispatchEvent(createCustomEvent(name, args))
        return emit.call(this, name, ...args)
      }
    })

    injectHook(options, 'created', function () {
      // sync default props values to wrapper on created
      camelizedPropsList.forEach(key => {
        this.$root.props[key] = this[key]
      })
    })

    // proxy props as Element properties
    camelizedPropsList.forEach(key => {
      Object.defineProperty(CustomElement.prototype, key, {
        get () {
          return this._wrapper.props[key]
        },
        set (newVal) {
          this._wrapper.props[key] = newVal
        },
        enumerable: false,
        configurable: true
      })
    })

    isInitialized = true
  }

  function syncAttribute (el, key) {
    const camelized = camelize(key)
    const value = el.hasAttribute(key) ? el.getAttribute(key) : undefined
    el._wrapper.props[camelized] = convertAttributeValue(
      value,
      key,
      camelizedPropsMap[camelized]
    )
  }

  class CustomElement extends HTMLElement {
    constructor () {
      const self = super()
      self.attachShadow({ mode: 'open' })

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
      })

      // Use MutationObserver to react to future attribute & slot content change
      const observer = new MutationObserver(mutations => {
        let hasChildrenChange = false
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i]
          if (isInitialized && m.type === 'attributes' && m.target === self) {
            syncAttribute(self, m.attributeName)
          } else {
            hasChildrenChange = true
          }
        }
        if (hasChildrenChange) {
          wrapper.slotChildren = Object.freeze(toVNodes(
            wrapper.$createElement,
            self.childNodes
          ))
        }
      })
      observer.observe(self, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      })
    }

    get vueComponent () {
      return this._wrapper.$refs.inner
    }

    connectedCallback () {
      const wrapper = this._wrapper
      if (!wrapper._isMounted) {
        // initialize attributes
        const syncInitialAttributes = () => {
          wrapper.props = getInitialProps(camelizedPropsList)
          hyphenatedPropsList.forEach(key => {
            syncAttribute(this, key)
          })
        }

        if (isInitialized) {
          syncInitialAttributes()
        } else {
          // async & unresolved
          Component().then(resolved => {
            if (resolved.__esModule || resolved[Symbol.toStringTag] === 'Module') {
              resolved = resolved.default
            }
            initialize(resolved)
            syncInitialAttributes()
          })
        }
        // initialize children
        wrapper.slotChildren = Object.freeze(toVNodes(
          wrapper.$createElement,
          this.childNodes
        ))
        wrapper.$mount()
        this.shadowRoot.appendChild(wrapper.$el)
      } else {
        callHooks(this.vueComponent, 'activated')
      }
    }

    disconnectedCallback () {
      callHooks(this.vueComponent, 'deactivated')
    }
  }

  if (!isAsync) {
    initialize(Component)
  }

  return CustomElement
}
