const pino = require('pino');

/**
 * Base application logger.
 * Uses JSON logs so they are easy to ingest by log pipelines.
 */
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers["x-api-key"]',
      'res.headers["set-cookie"]'
    ],
    remove: true
  }
});

module.exports = logger;
