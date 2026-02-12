import 'reflect-metadata';
import 'dotenv/config';
import { Worker } from 'bullmq';
import * as jobs from './modules/jobs/index.js';
import logger from './config/logger/index.js';
import { PgConnection } from './config/postgres/connection.js';
import redisClient from './config/redis/redisClient.js';

async function startWorker() {
  /**Redis */
  await redisClient.connect().then(async () => {
    logger.info('Redis connected with success!');
  });

  /**Postgres */
  await PgConnection.getInstance()
    .connect()
    .then(async () => {
      logger.info('PostgreSQL database connected with success!');
    })
    .catch((err) => {
      logger.fatal(err);
      throw err;
    });

  /**Workers */
  const workers = Object.values(jobs).map((job) => ({
    instance: new Worker(job.name, job.jobFunction, {
      concurrency: Number(process.env.WORKER_CONCURRENCY_FACTOR) || 5,
      connection: {
        url: `${process.env.REDIS_URI}?family=0`,
        retryStrategy(times: number) {
          return Math.max(Math.min(Math.exp(times), 20000), 1000);
        },
      },
      autorun: false,
    }),
  }));

  workers.forEach((worker) => {
    worker.instance.run(); // Execute workers

    worker.instance.on('failed', (job, filedReason) => {
      if (job) {
        logger.error(`JOB FAILED: ${job.id} - ${job.name}. Reason: ${filedReason}`);
      }
    });
    worker.instance.on('progress', (job, process) => {
      logger.info(`JOB PROGRESS: ${job.id} - ${job.name}. Progress: ${process}%`);
    });
    worker.instance.on('completed', (job, returnvalue) => {
      logger.info(`JOB COMPLETED: ${job.id} - ${job.name} has completed!`);
    });
    worker.instance.on('error', (err) => {
      logger.error(`WORKER ERROR: ${err}`);
    });
    worker.instance.on('ioredis:close', () => {
      logger.fatal(`WORKER REDIS CLOSE`);
    });
    worker.instance.on('ready', () => {
      logger.info(`Worker ${worker.instance.name} is ready!`);
    });
    worker.instance.on('resumed', () => {
      logger.info(`WORKER RESUMED`);
    });
  });
}

startWorker().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
