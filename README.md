# @vue/web-component-wrapper

> Wrap and register a Vue component as a custom element.

## Compatibility

Requires [native ES2015 class support](https://caniuse.com/#feat=es6-class). IE11 and below are not supported.

## Usage

``` js
import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'

const Component = {
  // any component options
}

const CustomElement = wrap(Vue, Component)

window.customElements.define('my-element', CustomElement)
```

## Interface Proxying Details

### Props

- All `props` declared in the Vue component are exposed on the custom element as its properties. Kebab-case props are converted to camelCase properties, similar to how they are converted in Vue.

- Setting properties on the custom element updates the props passed to the inner Vue component.

- Setting attributes on the custom element updates corresponding declared props. Attributes are mapped to kebab-case. For example, a prop named `someProp` will have a corresponding attribute named `some-prop`.

- Attributes that map to props declared with `type: Boolean` are auto-casted into boolean values in the following rules:

  - `""` or same value as attribute name: -> `true`

  - `"true"` -> `true`

  - `"false"` -> `false`

- Attributes that map to props declared with `type: Number` are auto-casted into numbers if the value is a parsable number.

### Events

Custom events emitted on the inner Vue component are dispatched on the custom element as a `CustomEvent`. Additional arguments passed to `$emit` will be exposed as an Array as `event.detail`.

### Slots

Slots work the same way as expected, including named slots. They also update when changed (using `MutationObserver`).

Scoped slots however, are not supported as they are a Vue specific concept.

### Lifecycle

When the custom element is removed from the document, the Vue component behaves just as if it's inside a `<keep-alive>` and its `deactivated` hook will be called. When it's inserted again, the `activated` hook will be called.

If you wish to destroy the inner component, you'd have to do that explicitly:

``` js
myElement.vueComponent.$destroy()
```

## Acknowledgments

Special thanks to the prior work by @karol-f in [vue-custom-element](https://github.com/karol-f/vue-custom-element).

## License

MIT
