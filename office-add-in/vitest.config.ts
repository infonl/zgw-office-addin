import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../vitest.config'

export default mergeConfig(baseConfig, defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,tsx}']
  }
}))