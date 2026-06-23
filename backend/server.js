const { createServer } = require('http');
const app = require('./app');
const { connectDb } = require('./config/db');
const env = require('./config/env');

const server = createServer(app);

async function start() {
  await connectDb();

  server.listen(env.port, () => {
    console.log(`Career Mentor AI backend running on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});
