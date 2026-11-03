import { defineConfig } from 'vitest/config'

// A temporary file database exercises real SQLite locks without touching demo data.
export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DB_STORAGE: `db/vitest-${process.pid}.sqlite`,
      JWT_SECRET: 'test-only-secret-with-more-than-32-characters',
    },
  },
})
