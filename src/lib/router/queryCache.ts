import { ExecutionPlan } from '../types';

interface CacheEntry {
  plan: ExecutionPlan;
  cachedAt: number;
}

class QueryExecutionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private defaultTTLMs = 60000; // 60 seconds TTL

  private generateKey(dbType: string, queryText: string): string {
    return `${dbType}:${queryText.trim().toLowerCase()}`;
  }

  public get(dbType: string, queryText: string): ExecutionPlan | null {
    const key = this.generateKey(dbType, queryText);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.cachedAt > this.defaultTTLMs) {
      this.cache.delete(key);
      return null;
    }

    // Return a clone with updated cacheHit flag
    return {
      ...entry.plan,
      cacheHit: true,
      executionTimeMs: 1, // Cache lookup latency ~1ms
      timestamp: new Date().toISOString()
    };
  }

  public set(dbType: string, queryText: string, plan: ExecutionPlan): void {
    const key = this.generateKey(dbType, queryText);
    this.cache.set(key, {
      plan,
      cachedAt: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const queryCache = new QueryExecutionCache();
