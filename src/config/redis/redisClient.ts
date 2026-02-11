import { createClient } from 'redis';
import logger from '../logger/index.js';

const redisClient = createClient({
  url: process.env.REDIS_URI || 'redis://localhost:6379',
});

redisClient.on('error', (error) => {
  logger.error(error, 'Redis Client Error');
});

export default redisClient;
