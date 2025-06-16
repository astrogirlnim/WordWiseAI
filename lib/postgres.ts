import { Pool } from "pg"
import { env } from "./env"

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Cache interface
export interface CacheEntry {
  key: string
  value: string
  expires_at: Date
  created_at: Date
  updated_at: Date
}

// Cache operations
export class PostgresCache {
  static async get(key: string): Promise<string | null> {
    try {
      const result = await pool.query("SELECT value FROM cache WHERE key = $1 AND expires_at > NOW()", [key])
      return result.rows[0]?.value || null
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  static async set(key: string, value: string, ttlSeconds = 3600): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
      await pool.query(
        `INSERT INTO cache (key, value, expires_at, created_at, updated_at) 
         VALUES ($1, $2, $3, NOW(), NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, expires_at = $3, updated_at = NOW()`,
        [key, value, expiresAt],
      )
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }

  static async delete(key: string): Promise<void> {
    try {
      await pool.query("DELETE FROM cache WHERE key = $1", [key])
    } catch (error) {
      console.error("Cache delete error:", error)
    }
  }

  static async clear(): Promise<void> {
    try {
      await pool.query("DELETE FROM cache WHERE expires_at < NOW()")
    } catch (error) {
      console.error("Cache clear error:", error)
    }
  }
}
