const promClient = require('prom-client');
const logger = require('../config/logger');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'kozsd_mail_service_'
});

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'kozsd_mail_service_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new promClient.Counter({
  name: 'kozsd_mail_service_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new promClient.Gauge({
  name: 'kozsd_mail_service_active_connections',
  help: 'Number of active connections'
});

const emailsSent = new promClient.Counter({
  name: 'kozsd_mail_service_emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['status']
});

const databaseConnections = new promClient.Gauge({
  name: 'kozsd_mail_service_database_connections',
  help: 'Number of active database connections'
});

const redisOperations = new promClient.Counter({
  name: 'kozsd_mail_service_redis_operations_total',
  help: 'Total number of Redis operations',
  labelNames: ['operation', 'status']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(emailsSent);
register.registerMetric(databaseConnections);
register.registerMetric(redisOperations);

// Middleware to collect HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Increment active connections
  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);

    // Decrement active connections
    activeConnections.dec();
  });

  next();
};

// Initialize metrics collection
const initializeMetrics = app => {
  // Add metrics middleware
  app.use(metricsMiddleware);

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (error) {
      logger.error('Error generating metrics:', error);
      res.status(500).end();
    }
  });

  logger.info('Prometheus metrics initialized');
};

// Utility functions for custom metrics
const incrementEmailCounter = (status = 'success') => {
  emailsSent.inc({ status });
};

const setDatabaseConnections = count => {
  databaseConnections.set(count);
};

const incrementRedisOperation = (operation, status = 'success') => {
  redisOperations.inc({ operation, status });
};

module.exports = {
  register,
  initializeMetrics,
  incrementEmailCounter,
  setDatabaseConnections,
  incrementRedisOperation
};
