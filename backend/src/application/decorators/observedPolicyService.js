function withObservability(service, { eventPublisher, cache }) {
  const invalidateSummary = async () => {
    await cache.delete('renewals:summary:*');
  };

  return {
    async summary(options = {}) {
      const cacheKey = `renewals:summary:${JSON.stringify(options)}`;
      const cached = await cache.get(cacheKey);
      if (cached) return cached;
      const result = await service.summary(options);
      await cache.set(cacheKey, result, 60);
      return result;
    },
    async importCsv(file) {
      const result = await service.importCsv(file);
      await invalidateSummary();
      await eventPublisher.publish('renewal.policy.imported', result);
      return result;
    },
    async updateStatus(id, status) {
      const result = await service.updateStatus(id, status);
      await invalidateSummary();
      return result;
    },
    async updateDisposition(id, disposition) {
      const result = await service.updateDisposition(id, disposition);
      await invalidateSummary();
      return result;
    }
  };
}

module.exports = { withObservability };
