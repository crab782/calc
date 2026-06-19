import js from '@eslint/js'
import globals from 'globals'
import vue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx,vue}'],
  })),
  ...vue.configs['flat/recommended'].map(config => ({
    ...config,
    files: ['**/*.vue'],
  })),
  {
    files: ['**/*.{ts,tsx,vue}'],
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.browser,
    },
  },
])
