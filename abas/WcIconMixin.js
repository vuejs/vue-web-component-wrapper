import { dom } from '@fortawesome/fontawesome-svg-core'

/**
 * @mixin
 */
export default {
  mounted () {
    const id = 'fa-styles'
    const shadowRoot = this.getShadowRoot(this)
    if (shadowRoot && !shadowRoot.getElementById(id)) {
      const faStyles = document.createElement('style')
      faStyles.setAttribute('id', id)
      faStyles.textContent = dom.css()
      shadowRoot.appendChild(faStyles)
    }
  },
  methods: {
    getShadowRoot (obj) {
      if (obj.$parent) {
        if (obj.$parent.$options && obj.$parent.$options.shadowRoot) {
          return obj.$parent.$options.shadowRoot
        }
        return this.getShadowRoot(obj.$parent)
      }
      return null
    }
  }
}
