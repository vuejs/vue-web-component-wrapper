import typescript from '@rollup/plugin-typescript'

export default [
  {
    input: 'src/index.ts',
    output: {
      format: 'es',
      dir: './',
      entryFileNames: 'dist/vue-wc-wrapper.js'
    },
    plugins: [
      // https://github.com/rollup/plugins/issues/61
      typescript({
        declaration: true,
        declarationDir: 'dist/'
      })]
  },
  {
    input: 'src/index.ts',
    output: {
      format: 'iife',
      name: 'wrapVueWebComponent',
      file: 'dist/vue-wc-wrapper.global.js'
    },
    plugins: [typescript()]
  }
]
