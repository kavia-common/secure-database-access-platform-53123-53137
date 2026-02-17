const express = require('express');
const healthController = require('../controllers/health');
const dbController = require('../controllers/db');
const apiKeyAuth = require('../middleware/apiKeyAuth');

const router = express.Router();
// Health endpoint

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

/**
 * @swagger
 * /health/db:
 *   get:
 *     summary: Database connectivity check
 *     description: Runs a lightweight `SELECT 1` using the configured RO pool.
 *     responses:
 *       200:
 *         description: Database reachable
 *       503:
 *         description: Database unreachable
 */
router.get('/health/db', apiKeyAuth, dbController.ping.bind(dbController));

/**
 * @swagger
 * /db/query:
 *   post:
 *     summary: Parameterized SQL query (RO by default)
 *     description: >
 *       Execute a SQL query using $1..$n placeholders with a separate parameters array.
 *       Use mode=ro for read-only access; mode=rw only when necessary.
 *     parameters: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sql]
 *             properties:
 *               sql:
 *                 type: string
 *                 example: "SELECT * FROM users WHERE email = $1"
 *               parameters:
 *                 type: array
 *                 items: {}
 *                 example: ["alice@example.com"]
 *               mode:
 *                 type: string
 *                 enum: [ro, rw]
 *                 example: "ro"
 *     responses:
 *       200:
 *         description: Query results
 *       401:
 *         description: Unauthorized (missing/invalid x-api-key)
 */
router.post('/db/query', apiKeyAuth, dbController.query.bind(dbController));

/**
 * @swagger
 * /db/execute:
 *   post:
 *     summary: Parameterized SQL execute (RW only)
 *     description: >
 *       Execute a SQL statement that modifies data. Requires mode=rw.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sql, mode]
 *             properties:
 *               sql:
 *                 type: string
 *                 example: "UPDATE users SET last_login = NOW() WHERE id = $1"
 *               parameters:
 *                 type: array
 *                 items: {}
 *                 example: [123]
 *               mode:
 *                 type: string
 *                 enum: [rw]
 *                 example: "rw"
 *     responses:
 *       200:
 *         description: Execute result (rowCount)
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized (missing/invalid x-api-key)
 */
router.post('/db/execute', apiKeyAuth, dbController.execute.bind(dbController));

module.exports = router;
