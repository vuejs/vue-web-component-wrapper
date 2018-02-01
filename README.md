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

### Events

### Slots

### Lifecycle

## Acknowledgments

Special thanks to the prior work by @karol-f in [vue-custom-element](https://github.com/karol-f/vue-custom-element).

## License

MIT
