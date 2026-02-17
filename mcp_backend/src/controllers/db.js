const db = require('../services/db');
const logger = require('../logger');

class DbController {
  async query(req, res, next) {
    try {
      const { sql, parameters, mode } = req.body || {};
      if (typeof sql !== 'string' || !sql.trim()) {
        return res.status(400).json({ status: 'error', message: 'sql is required' });
      }
      if (mode && !['ro', 'rw'].includes(mode)) {
        return res.status(400).json({ status: 'error', message: 'mode must be ro or rw' });
      }

      const result = await db.query({ sql, parameters: parameters || [], mode: mode || 'ro' });
      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      logger.error({ err, msg: 'REST db.query failed' });
      return next(err);
    }
  }

  async execute(req, res, next) {
    try {
      const { sql, parameters, mode } = req.body || {};
      if (typeof sql !== 'string' || !sql.trim()) {
        return res.status(400).json({ status: 'error', message: 'sql is required' });
      }
      if (mode !== 'rw') {
        return res.status(400).json({ status: 'error', message: 'execute requires mode=rw' });
      }

      const result = await db.execute({ sql, parameters: parameters || [], mode });
      return res.status(200).json({ status: 'ok', result });
    } catch (err) {
      logger.error({ err, msg: 'REST db.execute failed' });
      return next(err);
    }
  }

  async ping(req, res) {
    const result = await db.ping();
    const code = result.ok ? 200 : 503;
    return res.status(code).json({ status: result.ok ? 'ok' : 'error', ...result });
  }
}

module.exports = new DbController();
