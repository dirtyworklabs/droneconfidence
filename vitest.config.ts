import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Tests cover the parts where being wrong costs money or double-books a
 * customer: the availability engine, server-side authority over prices and
 * ids, the refund policy, the admin authorisation gate, and the database
 * constraints that arbitrate concurrent bookings.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // The Postgres suite boots a WASM database and applies both migrations.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
})
