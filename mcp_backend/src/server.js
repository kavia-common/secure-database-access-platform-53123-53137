const app = require('./app');
const logger = require('./logger');
const db = require('./services/db');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  logger.info({ msg: `Server running at http://${HOST}:${PORT}` });
});

// Graceful shutdown
async function shutdown(signal) {
  logger.info({ msg: `${signal} received: closing HTTP server` });
  server.close(async () => {
    await db.closePools();
    logger.info({ msg: 'HTTP server closed' });
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
