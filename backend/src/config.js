require('dotenv').config();

module.exports = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE || 'gs_insurance',
    username: process.env.MYSQL_USER || 'gs_user',
    password: process.env.MYSQL_PASSWORD || 'gs_password'
  },
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  kafkaBroker: process.env.KAFKA_BROKER || 'localhost:9092',
  kafkaTopic: process.env.KAFKA_TOPIC || 'renewal-events',
  eventTransport: process.env.EVENT_TRANSPORT || 'memory',
  localStackEndpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  s3Bucket: process.env.S3_BUCKET || 'gs-insurance-documents',
  sqsQueueUrl: process.env.SQS_QUEUE_URL || '',
  snsTopicArn: process.env.SNS_TOPIC_ARN || ''
};
