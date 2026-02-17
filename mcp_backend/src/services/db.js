const { Pool } = require('pg');
const logger = require('../logger');

const DEFAULT_POOL_MAX = 10;
const DEFAULT_POOL_IDLE_TIMEOUT_MS = 30_000;
const DEFAULT_POOL_CONN_TIMEOUT_MS = 5_000;

let roPool;
let rwPool;

function getCommonPoolOptions() {
  return {
    max: Number(process.env.PG_POOL_MAX || DEFAULT_POOL_MAX),
    idleTimeoutMillis: Number(process.env.PG_POOL_IDLE_TIMEOUT_MS || DEFAULT_POOL_IDLE_TIMEOUT_MS),
    connectionTimeoutMillis: Number(process.env.PG_POOL_CONN_TIMEOUT_MS || DEFAULT_POOL_CONN_TIMEOUT_MS)
  };
}

function buildPool(connectionString, applicationName) {
  const pool = new Pool({
    connectionString,
    application_name: applicationName,
    ...getCommonPoolOptions()
  });

  pool.on('error', (err) => {
    logger.error({ err, msg: 'Unexpected PostgreSQL pool error' });
  });

  return pool;
}

function getRoPool() {
  if (!roPool) {
    const connStr = process.env.POSTGRES_URL_RO || process.env.POSTGRES_URL;
    if (!connStr) {
      throw new Error('Missing env POSTGRES_URL (and/or POSTGRES_URL_RO) for RO pool');
    }
    roPool = buildPool(connStr, 'mcp-database-server-ro');
  }
  return roPool;
}

function getRwPool() {
  if (!rwPool) {
    const connStr = process.env.POSTGRES_URL_RW || process.env.POSTGRES_URL;
    if (!connStr) {
      throw new Error('Missing env POSTGRES_URL (and/or POSTGRES_URL_RW) for RW pool');
    }
    rwPool = buildPool(connStr, 'mcp-database-server-rw');
  }
  return rwPool;
}

/**
 * PUBLIC_INTERFACE
 * Runs a parameterized SQL query using the RO pool by default.
 *
 * @param {object} params
 * @param {string} params.sql - SQL statement with $1..$n placeholders.
 * @param {any[]} [params.parameters] - Parameter values for placeholders.
 * @param {'ro'|'rw'} [params.mode] - Pool selection. Defaults to 'ro'.
 * @returns {Promise<{ rows: any[], rowCount: number }>}
 */
async function query({ sql, parameters = [], mode = 'ro' }) {
  const pool = mode === 'rw' ? getRwPool() : getRoPool();
  const start = Date.now();
  const result = await pool.query(sql, parameters);
  logger.info({
    msg: 'db.query',
    mode,
    duration_ms: Date.now() - start,
    rowCount: result.rowCount
  });
  return { rows: result.rows, rowCount: result.rowCount };
}

/**
 * PUBLIC_INTERFACE
 * Executes a parameterized SQL statement that modifies data (RW mode).
 * This helper refuses to run if mode is not 'rw'.
 *
 * @param {object} params
 * @param {string} params.sql
 * @param {any[]} [params.parameters]
 * @param {'rw'} params.mode
 * @returns {Promise<{ rowCount: number }>}
 */
async function execute({ sql, parameters = [], mode }) {
  if (mode !== 'rw') {
    throw new Error('execute requires mode="rw"');
  }
  const pool = getRwPool();
  const start = Date.now();
  const result = await pool.query(sql, parameters);
  logger.info({
    msg: 'db.execute',
    mode,
    duration_ms: Date.now() - start,
    rowCount: result.rowCount
  });
  return { rowCount: result.rowCount };
}

/**
 * PUBLIC_INTERFACE
 * Checks database connectivity by running `SELECT 1`.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
async function ping() {
  try {
    await query({ sql: 'SELECT 1 as ok', parameters: [], mode: 'ro' });
    return { ok: true };
  } catch (err) {
    logger.error({ err, msg: 'db.ping failed' });
    return { ok: false, error: err.message };
  }
}

/**
 * PUBLIC_INTERFACE
 * Closes database pools (used in shutdown and tests).
 */
async function closePools() {
  const closers = [];
  if (roPool) closers.push(roPool.end());
  if (rwPool) closers.push(rwPool.end());
  await Promise.allSettled(closers);
  roPool = undefined;
  rwPool = undefined;
}

module.exports = {
  query,
  execute,
  ping,
  closePools
};
