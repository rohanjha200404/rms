class EventPublisher {
  async publish(_topic, _payload) {
    throw new Error('EventPublisher.publish must be implemented by an adapter.');
  }
}

module.exports = { EventPublisher };
