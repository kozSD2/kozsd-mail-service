const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KozSD Mail Service API',
      version: '1.0.0',
      description: 'Comprehensive Email Platform with Production-Ready Features',
      contact: {
        name: 'KozSD Team',
        email: 'support@kozsd.com',
        url: 'https://github.com/kozSD2/kozsd-mail-service'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.kozsd.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details (development only)'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2023-12-01T10:30:00.000Z'
            },
            path: {
              type: 'string',
              example: '/api/auth/login'
            },
            method: {
              type: 'string',
              example: 'POST'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Mail',
        description: 'Email sending and management operations'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Path to the API routes
};

const specs = swaggerJsdoc(options);

const setupSwagger = app => {
  // Swagger UI options
  const swaggerOptions = {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'KozSD Mail Service API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showRequestHeaders: true,
      tryItOutEnabled: true
    }
  };

  // Serve API documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

  // Serve OpenAPI spec as JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // eslint-disable-next-line no-console
  console.log('📚 API Documentation available at /api-docs');
  // eslint-disable-next-line no-console
  console.log('📄 OpenAPI spec available at /api-docs.json');
};

module.exports = {
  setupSwagger,
  specs
};
