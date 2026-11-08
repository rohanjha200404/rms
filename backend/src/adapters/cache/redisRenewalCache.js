const Redis = require('ioredis');

class RedisRenewalCache {
  constructor(config) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
    this.connected = false;
  }

  async get(key) {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis read failed:', error.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    try {
      await this.connect();
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.error('Redis write failed:', error.message);
    }
  }

  async delete(key) {
    try {
      await this.connect();
      const keys = key.includes('*') ? await this.client.keys(key) : [key];
      if (keys.length) await this.client.del(...keys);
    } catch (error) {
      console.error('Redis delete failed:', error.message);
    }
  }

  async connect() {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
  }
}

module.exports = { RedisRenewalCache };
