const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MCP Database Server (Express + PostgreSQL)',
      version: '1.0.0',
      description: 'Secure database access API demonstrating MCP development standards (parameterized SQL, pooling, RO/RW modes, API-key auth, structured logging).',
    }
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
