# This readme is only for abas

1. Checkout this wrapper repo into the same level of the project what you want to convert. e.g. abas-elements
2. To fix the icons styles
   Put 'WcIconMixin.js' file into abas-elements/src/mixins
   Add 'import WcIconMixin from '../mixins/WcIconMixin';' in Icon.vue
   Add mixin 'mixins: [WcIconMixin],' in Icon.vue
3. Adjust 'vue.config.js' in abas-elements project by adding alias for the '@vue/web-component-wrapper'

    '''
      configureWebpack: {
        resolve: {
          alias: {
            '@vue/web-component-wrapper': path.join(__dirname, '../vue-web-component-wrapper'),
          },
        },
      },
    '''
4. add dependency into package.json in block 'devDependencies'
    '''
    "eslint-plugin-vue-libs": "^2.1.0"
    '''
