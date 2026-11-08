const express = require('express');
const cors = require('cors');
const config = require('./config');
const { sequelize } = require('./db');
const authRoutes = require('./routes/authRoutes');
const captchaRoutes = require('./routes/captchaRoutes');
const { router: policyRouter, configurePolicyRoutes } = require('./routes/policyRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { SequelizePolicyRepository } = require('./adapters/persistence/sequelizePolicyRepository');
const { DomainEventBus } = require('./domain/events');
const { InMemoryEventPublisher } = require('./adapters/messaging/inMemoryEventPublisher');
const { KafkaEventPublisher } = require('./adapters/messaging/kafkaEventPublisher');
const { RedisRenewalCache } = require('./adapters/cache/redisRenewalCache');
const { withObservability } = require('./application/decorators/observedPolicyService');
const { createPolicyService } = require('./services/policyService');
const { createNotificationService } = require('./services/notificationService');
const { SequelizeNotificationRepository } = require('./adapters/persistence/sequelizeNotificationRepository');
const { router: notificationRouter, configureNotificationRoutes } = require('./routes/notificationRoutes');

const app = express();
const eventBus = new DomainEventBus();
const eventPublisher = config.eventTransport === 'kafka'
  ? new KafkaEventPublisher(config)
  : new InMemoryEventPublisher(eventBus);
const policyRepository = new SequelizePolicyRepository();
const notificationRepository = new SequelizeNotificationRepository();
const renewalCache = new RedisRenewalCache(config);
const policyService = withObservability(
  createPolicyService({ policyRepository }),
  { eventPublisher, cache: renewalCache }
);
eventBus.subscribe('renewal.policy.imported', async (event) => {
  console.log('Observer: renewal policy import completed', event.payload);
});
configurePolicyRoutes(policyService);
configureNotificationRoutes(createNotificationService({ notificationRepository }));
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/captcha', captchaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/policies', policyRouter);
app.use('/api/notifications', notificationRouter);
app.use(errorHandler);

async function start() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  app.listen(config.port, () => console.log(`GS Insurance API listening on http://localhost:${config.port}`));
}

if (require.main === module) start().catch((error) => { console.error(error); process.exit(1); });
module.exports = app;
