const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class LocalStackStorage {
  constructor(config) {
    this.bucket = config.s3Bucket;
    this.client = new S3Client({
      endpoint: config.localStackEndpoint,
      region: 'us-east-1',
      forcePathStyle: true,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
    });
  }

  async put(key, body, contentType) {
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType
    }));
  }
}

module.exports = { LocalStackStorage };
