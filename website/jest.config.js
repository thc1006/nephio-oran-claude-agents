const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/tests/e2e/',
    '<rootDir>/build/',
    '<rootDir>/.docusaurus/',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/index.tsx', // Skip main page for now as it requires complex setup
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/setup/__mocks__/fileMock.js',
    '^@site/(.*)$': '<rootDir>/$1',
    '^@docusaurus/(.*)$': '<rootDir>/tests/setup/__mocks__/docusaurus.js',
    '^@theme/(.*)$': '<rootDir>/tests/setup/__mocks__/docusaurus.js',
  },
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  // Handle Docusaurus-specific modules
  transformIgnorePatterns: [
    'node_modules/(?!(prism-react-renderer|@docusaurus|clsx)/)',
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};