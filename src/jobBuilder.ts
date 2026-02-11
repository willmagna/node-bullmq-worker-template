import 'reflect-metadata';
import 'dotenv/config';
import Queue from './config/bullMQ/queue.js';

async function jobBuilder() {
  await Queue.add('testing', 'testing', {
    foo: 'bar',
  });
}

jobBuilder()
  .then(async () => {
    // await pgConnection.disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    // await pgConnection.disconnect();
    process.exit();
  });
