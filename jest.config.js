// jest.config.js (for ES modules)
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js'],
};