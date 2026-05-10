import { Queue, Worker } from 'bullmq';
import redis, { redisOptions } from './redis';

const connection = redis ? {
  ...redisOptions,
  host: redis.options.host,
  port: redis.options.port,
  password: redis.options.password,
} : undefined;

// Queues (Only initialize if connection exists)
export const orderQueue = connection ? new Queue('order-tasks', { connection }) : null;
export const billingQueue = connection ? new Queue('billing-tasks', { connection }) : null;

// Workers (Only initialize if connection exists)
export let orderWorker: Worker | null = null;

if (connection) {
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
  console.log('⚠️ Redis not configured. Queues and Workers are disabled.');
}
