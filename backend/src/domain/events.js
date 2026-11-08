class DomainEventBus {
  constructor() {
    this.observers = new Map();
  }

  subscribe(eventName, observer) {
    const observers = this.observers.get(eventName) || [];
    observers.push(observer);
    this.observers.set(eventName, observers);
    return () => this.observers.set(eventName, observers.filter((item) => item !== observer));
  }

  async publish(eventName, payload) {
    for (const observer of this.observers.get(eventName) || []) {
      await observer({ eventName, payload, occurredAt: new Date().toISOString() });
    }
  }
}

module.exports = { DomainEventBus };
