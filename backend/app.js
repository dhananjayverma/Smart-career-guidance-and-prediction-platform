const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat.routes');
const voiceRoutes = require('./routes/voice.routes');
const careerRoutes = require('./routes/career.routes');
const roadmapRoutes = require('./routes/roadmap.routes');
const collegeRoutes = require('./routes/college.routes');
const contentRoutes = require('./routes/content.routes');
const env = require('./config/env');
const { getProviderStatus } = require('./services/aiProvider');
const { getCacheStats } = require('./services/cache.service');
const { getQueueStats } = require('./services/requestQueue.service');
const { getTemplateStats } = require('./services/templateEngine.service');

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  const providers = getProviderStatus();
  res.json({
    status: 'ok',
    service: 'Career Mentor AI',
    ai: {
      provider: env.aiProvider,
      model: env.aiModel || 'default',
      configured: Boolean(
        providers.groq || providers.openrouter || providers.together || providers.openai
      ),
      providers,
      pipeline: ['cache', 'template', 'queue', 'groq', 'openrouter', 'together', 'local', 'static'],
    },
    cache: getCacheStats(),
    queue: getQueueStats(),
    templates: getTemplateStats(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/chat/voice', voiceRoutes);
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
