/* eslint-disable */
export default {
    displayName: 'salesforce-api-svc',
    preset: '../../jest.preset.js',
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
    },
    testResultsProcessor: 'jest-sonar-reporter',
    moduleFileExtensions: ['ts', 'js'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    bail: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}'],
    coverageThreshold: {
        global: {
            lines: 0,
        },
    },
    coverageReporters: ['json', 'lcov', 'text'],
    coveragePathIgnorePatterns: ['src/server.ts', 'src/logger.ts', 'src/config.ts', 'src/routes.ts'],
};
