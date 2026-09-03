import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["**/__tests__/**/*.test.(ts|tsx)"],
  // Base UI's Combobox/Select popups are slow to open under jsdom (CPU-bound,
  // not a hang) — comfortably past Jest's 5s default, with extra headroom for
  // CPU contention when many such tests run back-to-back in one worker.
  testTimeout: 90000,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/layout.tsx",
    "!src/types/**",
  ],
}

export default createJestConfig(config)
