// Jest 配置文件
import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
    '**/*.test.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.ts$': '$1',
  },
  // Agent 评估测试是长运行测试，设置更长的超时
  testTimeout: 120000,
  // 忽略 E2E 测试
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],
  // 输出详细测试结果
  verbose: true,
};

export default createJestConfig(config);
