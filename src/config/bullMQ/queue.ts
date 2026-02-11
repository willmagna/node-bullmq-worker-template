import { Queue } from 'bullmq';
import type { JobsOptions } from 'bullmq';
import logger from '../logger/index.js';
import { ErrorLogger } from '../../shared/errors/ErrorLogger.js';

const queueList = ['testing'] as const;

type QueueName = (typeof queueList)[number];

type UpsertJobSchedulerParams = [
  { pattern: string },
  { name: string; data?: object | undefined; opts?: JobsOptions },
];

const queues = queueList.map((queueName) => ({
  queueName,
  instance: new Queue(queueName, {
    connection: {
      url: `${process.env.REDIS_URI}?family=0`,
      retryStrategy: (times: number) => {
        return Math.max(Math.min(Math.exp(times), 20000), 1000);
      },
    },
  }),
}));

queues.forEach((queue) => {
  queue.instance.on('error', (err) => {
    logger.error(`QUEUE ERROR: ${err}`);
  });
  queue.instance.on('ioredis:close', () => {
    logger.fatal(`QUEUE IOREDIS CLOSE`);
  });
  queue.instance.on('waiting', () => {
    logger.info(`QUEUE WAITING`);
  });
  queue.instance.on('progress', (job, progress) => {
    logger.info(`API QUEUE - JOB: ${job} - PROGRESS: ${progress}`);
  });
});

async function add(queueName: QueueName, jobName: string, jobData: object, opts?: JobsOptions) {
  const jobOptions = {
    ...opts,
    removeOnComplete: 200,
    removeOnFail: 200,
  };

  const queue = queues.find((queue) => queue.queueName === queueName);
  if (queue) {
    const result = await queue.instance.add(jobName, jobData, jobOptions);
    if (!!result) {
      logger.info(`JOB ADDED TO QUEUE ${queueName} - JobId: ${result.id}, JobName: ${jobName}`);
      logger.info(JSON.stringify(result));
    } else {
      logger.error(`Error on Adding Job ${jobName} to the queue ${queueName}`);
      logger.error(JSON.stringify(result));
    }
    return result;
  } else {
    throw new ErrorLogger(`QueueName ${queueName} provided does not found at add method`, {
      cause: 404,
    });
  }
}

async function getJobs(queueName: string) {
  const queue = queues.find((queue) => queue.queueName === queueName);
  if (queue) {
    return queue.instance.getJobs();
  } else {
    throw new ErrorLogger(`QueueName ${queueName} provided does not found at getJobs method`, {
      cause: 404,
    });
  }
}

async function upsertJobScheduler(
  queueName: string,
  schedulerId: string,
  parameters: UpsertJobSchedulerParams,
) {
  const queue = queues.find((queue) => queue.queueName === queueName);
  if (queue) {
    return queue.instance.upsertJobScheduler(schedulerId, parameters[0], parameters[1]);
  } else {
    throw new ErrorLogger(
      `QueueName ${queueName} provided does not found at upsertJobScheduler method`,
      {
        cause: 404,
      },
    );
  }
}

async function removeJobScheduler(queueName: string, schedulerId: string) {
  const queue = queues.find((queue) => queue.queueName === queueName);
  if (queue) {
    return queue.instance.removeJobScheduler(schedulerId);
  } else {
    throw new ErrorLogger(
      `QueueName ${queueName} provided does not found at removeJobScheduler method`,
      {
        cause: 404,
      },
    );
  }
}

async function getJobSchedulers() {
  const schedulers = await Promise.all(
    queues.map(async (queue) => {
      return {
        queueName: queue.instance.name,
        queueJobSchedulersList: await queue.instance.getJobSchedulers(0, 9, true),
      };
    }),
  );
  logger.info('getJobSchedulers method was called');
  return schedulers;
}

export default {
  queues,
  add,
  getJobs,
  upsertJobScheduler,
  removeJobScheduler,
  getJobSchedulers,
};
