import { eslintConfig } from '@kutsan/eslint-config'

/** @type { import('eslint').Linter.Config[] } */
const config = eslintConfig({
  configs: ['node'],
})

export default config
