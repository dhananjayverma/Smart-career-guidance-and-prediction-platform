const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat.routes');
const careerRoutes = require('./routes/career.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const collegeRoutes = require('./routes/college.routes');
const contentRoutes = require('./routes/content.routes');
const env = require('./config/env');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Career Mentor AI',
    ai: {
      provider: env.aiProvider,
      model: env.aiModel || 'default',
      configured: Boolean(env.groqApiKey || env.openAiApiKey),
    },
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/content', contentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Something went wrong',
  });
});

module.exports = app;
