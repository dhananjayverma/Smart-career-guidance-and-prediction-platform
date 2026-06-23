const Bottleneck = require('bottleneck');
const env = require('../config/env');

const limiter = new Bottleneck({
  minTime: Number(env.queueMinTimeMs || 1200),
  maxConcurrent: Number(env.queueMaxConcurrent || 1),
});

async function scheduleTask(task, label = 'ai-request') {
  return limiter.schedule({ id: label }, task);
}

function getQueueStats() {
  return {
    running: limiter.running(),
    queued: limiter.queued(),
    done: limiter.done(),
    minTimeMs: Number(env.queueMinTimeMs || 1200),
    maxConcurrent: Number(env.queueMaxConcurrent || 1),
  };
}

module.exports = {
  scheduleTask,
  getQueueStats,
  limiter,
};
