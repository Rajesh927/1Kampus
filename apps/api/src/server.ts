import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`
  ======================================================
  🚀 1KAMPUS API SERVER RUNNING
  ======================================================
  📡 URL:         http://localhost:${env.PORT}
  🔍 Health:      http://localhost:${env.PORT}${env.API_PREFIX}/health
  🛡️ Environment: ${env.NODE_ENV}
  🌐 Client URL:  ${env.CLIENT_URL}
  ======================================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
