import babel from 'rollup-plugin-babel'

export default [
  {
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
  },
  {
    input: 'src/index.js',
    output: [
      {
        format: 'es',
        file: 'dist/vue-wc-wrapper.es5.js'
      },
      {
        format: 'iife',
        name: 'wrapVueWebComponent',
        file: 'dist/vue-wc-wrapper.es5.global.js'
      }
    ],
    plugins: [babel()]
  }
]
