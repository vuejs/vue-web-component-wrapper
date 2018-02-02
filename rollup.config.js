export default {
  input: 'src/index.js',
  output: [
    {
      format: 'es',
      file: 'dist/vue-wc-wrapper.js'
    },
    {
      format: 'iife',
      name: 'wrapVueWebComponent',
      file: 'dist/vue-wc-wrapper.global.js'
    }
  ]
}
