const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

class LocalStackNotifications {
  constructor(config) {
    this.topicArn = config.snsTopicArn;
    this.client = new SNSClient({
      endpoint: config.localStackEndpoint,
      region: 'us-east-1',
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
    });
  }

  async publish(subject, message) {
    if (!this.topicArn) return;
    await this.client.send(new PublishCommand({ TopicArn: this.topicArn, Subject: subject, Message: JSON.stringify(message) }));
  }
}

module.exports = { LocalStackNotifications };
