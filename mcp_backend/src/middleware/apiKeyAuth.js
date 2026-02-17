const logger = require('../logger');

/**
 * Constant-time string comparison to reduce timing attacks on API key checks.
 * Not cryptographically perfect, but avoids trivial early-return comparisons.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * PUBLIC_INTERFACE
 * Express middleware that enforces API key authentication.
 *
 * Env:
 * - MCP_API_KEY: required secret token.
 *
 * Header:
 * - x-api-key: required when MCP_API_KEY is set.
 */
function apiKeyAuth(req, res, next) {
  const expected = process.env.MCP_API_KEY;
  if (!expected) {
    logger.warn({ msg: 'MCP_API_KEY not set; allowing request without auth (dev only).' });
    return next();
  }

  const provided = req.get('x-api-key');
  if (!timingSafeEqual(provided || '', expected)) {
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized'
    });
  }
  return next();
}

module.exports = apiKeyAuth;
