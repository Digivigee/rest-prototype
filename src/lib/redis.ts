import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;
const isProduction = process.env.NODE_ENV === 'production';

export const redisOptions: any = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times: number) {
    if (times > 3) return null; 
    return Math.min(times * 100, 3000);
  },
  enableOfflineQueue: false,
};

// Only initialize Redis if a URL is provided or if we're in development
const redis = redisUrl ? new Redis(redisUrl, redisOptions) : null;

if (redis) {
  redis.on('error', (err: any) => {
    const isConnRefused = err.code === 'ECONNREFUSED' || 
      (err.errors && err.errors.some((e: any) => e.code === 'ECONNREFUSED'));
      
    if (!isConnRefused) {
      console.error('Redis error:', err);
    }
  });
}

export default redis;

export async function cacheGet(key: string) {
  try {
    if (!redis || redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    if (!redis || redis.status !== 'ready') return;
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    // Silent fail for cache set
  }
}

export async function cacheDelete(key: string) {
  try {
    if (!redis || redis.status !== 'ready') return;
    await redis.del(key);
  } catch (error) {
    // Silent fail for cache delete
  }
}
