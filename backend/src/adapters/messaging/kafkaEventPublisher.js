const { Kafka } = require('kafkajs');
const { EventPublisher } = require('../../application/ports/eventPublisher');

class KafkaEventPublisher extends EventPublisher {
  constructor(config) {
    super();
    this.topic = config.kafkaTopic;
    this.kafka = new Kafka({ clientId: 'gs-insurance', brokers: [config.kafkaBroker] });
    this.producer = this.kafka.producer();
    this.connected = false;
  }

  async publish(topic, payload) {
    try {
      if (!this.connected) {
        await this.producer.connect();
        this.connected = true;
      }
      await this.producer.send({
        topic: topic || this.topic,
        messages: [{ value: JSON.stringify(payload) }]
      });
    } catch (error) {
      console.error(`Kafka publish failed for ${topic}:`, error.message);
    }
  }
}

module.exports = { KafkaEventPublisher };
