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
  // not a hang) — comfortably past Jest's 5s default. GitHub Actions' shared
  // runners are ~2-2.5x slower than a local dev machine for this CPU-bound
  // work, so the budget needs headroom for CI, not just local contention —
  // a 90s timeout was already being exceeded there by ordinary (not even the
  // heaviest) tests.
  testTimeout: 240000,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/layout.tsx",
    "!src/types/**",
  ],
}

export default createJestConfig(config)
