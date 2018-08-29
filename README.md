# @VerticalOne/vue-web-component-wrapper
> Wrap and register a Vue component as a custom element.

## Compatibility

This is a fork of [vuejs/vue-web-component-wrapper](https://github.com/vuejs/vue-web-component-wrapper) which **extends support to IE11** through babel transpilation with the [babel-plugin-transform-builtin-classes](https://github.com/WebReflection/babel-plugin-transform-builtin-classes) plugin that was created to address the issue of extending `HTMLElement` in browsers without native support for ES2015 classes.

If you're running into this [issue](https://github.com/facebook/create-react-app/blob/master/packages/react-scripts/template/README.md#npm-run-build-fails-to-minify) -- i.e. "Failed to minify the code from this file" -- trying to minify code from the original project, this fork may also help you out, as all the code is transpiled to ES5.

**Requires IE11 or higher, from the plugin [docs](https://github.com/WebReflection/babel-plugin-transform-builtin-classes)**:
> This transformer works on IE11 and every other browser with Object.setPrototypeOf or \_\_proto\_\_ as fallback.

> There is NO IE <= 10 support. If you need IE <= 10 don't use this plugin and/or don't extend natives (recommended).

Other notes:

- **If targeting browsers that don't support native Web Components:**

  You will also need the [Shady DOM + Custom Elements polyfill](https://github.com/webcomponents/webcomponentsjs).

  See caniuse.com for support on [Custom Elements v1](https://caniuse.com/#feat=custom-elementsv1) and [Shadow DOM v1](https://caniuse.com/#feat=shadowdomv1).

- **Note on CSS Encapsulation When Using the Shady DOM polyfill**

  It's recommended to use [CSS Modules](https://vue-loader.vuejs.org/en/features/css-modules.html) instead of `<style scoped>` in your `*.vue` files if you intend to use the Shady DOM polyfill, because it does not offer real style encapsulation like Shadow DOM does, so external stylesheets may affect your components if not using hashed class names.

## Usage

- **`dist/vue-wc-wrapper.js`**: This file is in ES modules format. It's the default export for bundlers, and can be used in browsers with `<script type="module">`.

- **`dist/vue-wc-wrapper.global.js`**: This is for old school `<script>` includes in browsers that do not support `<script type="module">` yet (exposes `wrapVueWebComponent` global).

``` js
import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'

const Component = {
  // any component options
}

const CustomElement = wrap(Vue, Component)

window.customElements.define('my-element', CustomElement)
```

It works with async components as well - you can pass an async component factory function that returns a Promise, and the function will only be called when an instance of the custom element is created on the page:

``` js
const CustomElement = wrap(Vue, () => import(`MyComponent.vue`))

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
