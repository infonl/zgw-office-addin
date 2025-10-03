import '@testing-library/jest-dom'

// Mock Office.js for testing
global.Office = {
  onReady: vi.fn().mockResolvedValue({}),
  context: {
    document: {},
    application: {}
  }
} as any