const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

class LocalStackQueue {
  constructor(config) {
    this.queueUrl = config.sqsQueueUrl;
    this.client = new SQSClient({
      endpoint: config.localStackEndpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
    });
  }

  async send(payload) {
    if (!this.queueUrl) return;
    await this.client.send(new SendMessageCommand({ QueueUrl: this.queueUrl, MessageBody: JSON.stringify(payload) }));
  }
}

module.exports = { LocalStackQueue };
