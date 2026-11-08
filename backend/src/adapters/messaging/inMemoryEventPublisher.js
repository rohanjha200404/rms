const { EventPublisher } = require('../../application/ports/eventPublisher');

class InMemoryEventPublisher extends EventPublisher {
  constructor(eventBus) {
    super();
    this.eventBus = eventBus;
  }

  async publish(topic, payload) {
    await this.eventBus.publish(topic, payload);
  }
}

module.exports = { InMemoryEventPublisher };
