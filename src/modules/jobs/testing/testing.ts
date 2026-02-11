import { Job } from 'bullmq';
import { container, inject, singleton } from 'tsyringe';

@singleton()
class WorkerTesting {
  constructor() {}
  public async main(job: Job) {
    console.log('WorkerTesting');
    console.log(job.data);
  }
}

export default {
  name: 'testing',
  jobFunction: async (job: Job) => {
    const inst = container.resolve(WorkerTesting);
    return inst.main(job);
  },
};
