import { Queue, Worker } from 'bullmq';
import redis, { redisOptions } from './redis';

const connection = {
  ...redisOptions,
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
};

// Queues (Lazy connection)
export const orderQueue = new Queue('order-tasks', { connection });
export const billingQueue = new Queue('billing-tasks', { connection });

// Workers (Optional for local dev)
export let orderWorker: Worker | null = null;

if (process.env.REDIS_URL || process.env.NODE_ENV === 'production') {
  orderWorker = new Worker('order-tasks', async (job) => {
    console.log(`Processing order job ${job.id}:`, job.data);
  }, { connection });

  orderWorker.on('completed', (job) => {
    console.log(`${job.id} has completed!`);
  });

  orderWorker.on('failed', (job, err) => {
    console.log(`${job?.id} has failed with ${err.message}`);
  });
} else {
  console.log('⚠️ Redis not configured. Workers are disabled.');
}
