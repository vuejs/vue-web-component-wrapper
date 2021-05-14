import {
  defineComponent,
  createApp,
  defineAsyncComponent,
  createVNode,
  getCurrentInstance,
} from "vue";
import {
  hyphenate,
  camelize,
  convertAttributeValue,
  toVNodes,
  getInitialProps,
  createCustomEvent,
  injectHook,
  callHooks
} from "./utils";


function wrap(Component) {
  const isAsync = typeof Component === "function" && !Component.cid;
  let isInitialized = false;
  let hyphenatedPropsList; 
  let camelizedPropsList;
  let camelizedPropsMap; 

  function initialize(Component) {
    if (isInitialized) return;
    const options =
      typeof Component === "function" ? Component.options : Component;

    // extract props info
    const propsList = Array.isArray(options.props)
      ? options.props
      : Object.keys(options.props || {});
    hyphenatedPropsList = propsList.map(hyphenate);
    camelizedPropsList = propsList.map(camelize);
    const originalPropsAsObject = Array.isArray(options.props)
      ? {}
      : options.props || {};
    camelizedPropsMap = camelizedPropsList.reduce((map, key, i) => {
      map[key] = originalPropsAsObject[propsList[i]];
      return map;
    }, {});

    // proxy $emit to native DOM events
    injectHook(options, "beforeCreate", function() {
      const emit = getCurrentInstance().emit;
      getCurrentInstance().emit = function(name, ...args) {
        this.$root.$options.customElement.dispatchEvent(
          createCustomEvent(name, args)
        );
        return emit.call(this, name, ...args);
      };
    });

    injectHook(options, 'created', function () {
    // sync default props values to wrapper on created
      camelizedPropsList.forEach(key => {
        this.$root.props[key] = this[key]
      })
    })

    // proxy props as Element properties
    camelizedPropsList.forEach(key => {
      Object.defineProperty(CustomElement.prototype, key, {
        get() {
          return this.wrapper.props[key];
        },
        set(newVal){
          Promise.resolve().then(()=>{
            this.wrapper.props[key] = newVal;
          })

        
        },
        enumerable: false,
        configurable: true
      });
    });

    isInitialized = true;
  }

  function syncAttribute(el, key) {
    const camelized = camelize(key);
    const value = el.hasAttribute(key)
      ? el.getAttribute(key)
      : undefined;
      el.wrapper.props[camelized] = convertAttributeValue(
      value,
      key,
      camelizedPropsMap[camelized]
    );
  }

  class CustomElement extends HTMLElement {
    wrapper
    constructor() {

      const self = super();
      self.attachShadow({ mode: "open" });
      self._wrapper = createApp(
        defineComponent({
          name: "shadow-root",
          customElement: self,
          shadowRoot: self.shadowRoot,
          data(){
            return { 
              props : {},
              slotChildren : []
            }
          },
          beforeCreate(){
            self.wrapper = this
          },
          created(){
            const syncInitialAttributes = () => {
              
              this.props = getInitialProps(camelizedPropsList);
              hyphenatedPropsList.forEach(key => {
                syncAttribute(self, key);
              });
            };

            if (isInitialized) {
              syncInitialAttributes();
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
            this.slotChildren = Object.freeze(toVNodes(self.childNodes));
          },
          render(){
            return  createVNode(
              isAsync ?  defineAsyncComponent(Component) : Component,
              {
                ref: "inner",
                ...this.props
              },
              () => this.slotChildren
            );
          },
       
        })
      );

      // Use MutationObserver to react to future attribute & slot content change
      const observer = new MutationObserver(mutations => {
        console.log("变化了吗");
        let hasChildrenChange = false;
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (
            isInitialized &&
            m.type === "attributes" &&
            m.target === self
          ) {
            syncAttribute(self, m.attributeName);
          } else {
            hasChildrenChange = true;
          }
        }
        if (hasChildrenChange) {
          self.wrapper.slotChildren = Object.freeze(toVNodes(self.childNodes));
        }
      });
      observer.observe(self, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }
    get vueComponent(){
      return this.wrapper?.$refs?.inner;
    }

    connectedCallback() {
      if (!this.vueComponent) {
        this._wrapper.mount(this.shadowRoot);
      } else {
        callHooks(this.vueComponent, "activated");

      }
    }
    disconnectedCallback () {
      callHooks(this.vueComponent, 'deactivated');
    }
  }

  if (!isAsync) {
    initialize(Component);
  }

  return CustomElement;
}

export default wrap;
