import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisOptions: any = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times: number) {
    // Limit reconnection attempts
    if (times > 3) return null; // Stop retrying after 3 attempts
    return Math.min(times * 100, 3000);
  },
  enableOfflineQueue: false, // Don't queue commands if offline
};

const redis = new Redis(redisUrl, redisOptions);

redis.on('error', (err: any) => {
  // Only log if it's not a connection refused error to avoid spam
  const isConnRefused = err.code === 'ECONNREFUSED' || 
    (err.errors && err.errors.some((e: any) => e.code === 'ECONNREFUSED'));
    
  if (!isConnRefused) {
    console.error('Redis error:', err);
  }
});

export default redis;

export async function cacheGet(key: string) {
  try {
    if (redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    if (redis.status !== 'ready') return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    // Silent fail for cache set
  }
}

export async function cacheDelete(key: string) {
  try {
    if (redis.status !== 'ready') return;
    await redis.del(key);
  } catch (error) {
    // Silent fail for cache delete
  }
}
