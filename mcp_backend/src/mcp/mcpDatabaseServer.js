const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const logger = require('../logger');
const db = require('../services/db');

const ModeSchema = z.enum(['ro', 'rw']);

const QueryInputSchema = z.object({
  sql: z.string().min(1).describe('SQL query with $1..$n placeholders.'),
  parameters: z.array(z.any()).optional().describe('Values for SQL placeholders.'),
  mode: ModeSchema.default('ro').describe('Use ro for safe read-only queries; rw only if needed.')
});

const ExecuteInputSchema = z.object({
  sql: z.string().min(1).describe('SQL statement with $1..$n placeholders.'),
  parameters: z.array(z.any()).optional().describe('Values for SQL placeholders.'),
  mode: z.literal('rw').describe('Execute requires rw mode.')
});

function requireApiKeyOrThrow(providedKey) {
  const expected = process.env.MCP_API_KEY;
  if (!expected) return; // dev-only permissive mode
  if (typeof providedKey !== 'string') throw new Error('Unauthorized: missing apiKey');
  if (providedKey.length !== expected.length) throw new Error('Unauthorized: invalid apiKey');
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    diff |= expected.charCodeAt(i) ^ providedKey.charCodeAt(i);
  }
  if (diff !== 0) throw new Error('Unauthorized: invalid apiKey');
}

/**
 * PUBLIC_INTERFACE
 * Starts the MCP Database Server using stdio transport.
 *
 * Tools:
 * - db_query: parameterized query, mode=ro|rw (default ro)
 * - db_execute: parameterized execute, mode=rw only
 *
 * Auth:
 * - Provide `apiKey` field inside tool input payload.
 *
 * Env:
 * - POSTGRES_URL (required) or POSTGRES_URL_RO/POSTGRES_URL_RW
 * - MCP_API_KEY (optional in dev; required in prod)
 */
async function startMcpDatabaseServer() {
  const server = new McpServer({
    name: 'mcp-database-server',
    version: '1.0.0'
  });

  server.tool(
    'db_query',
    'Run a parameterized SQL query (RO by default).',
    QueryInputSchema,
    async (input) => {
      const { sql, parameters = [], mode } = input;

      // Optional API key passed in tool payload for MCP contexts.
      // (In REST mode, API key is enforced by middleware.)
      requireApiKeyOrThrow(input.apiKey);

      const result = await db.query({ sql, parameters, mode });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    }
  );

  server.tool(
    'db_execute',
    'Execute a parameterized SQL statement that modifies data (RW only).',
    ExecuteInputSchema,
    async (input) => {
      const { sql, parameters = [], mode } = input;
      requireApiKeyOrThrow(input.apiKey);

      const result = await db.execute({ sql, parameters, mode });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info({ msg: 'mcp-database-server started (stdio)' });
  return server;
}

module.exports = { startMcpDatabaseServer };
