class PolicyRepository {
  async findRenewals() {
    throw new Error('PolicyRepository.findRenewals must be implemented by an adapter.');
  }

  async upsertMany(_policies) {
    throw new Error('PolicyRepository.upsertMany must be implemented by an adapter.');
  }

  async updateStatus(_id, _status) {
    throw new Error('PolicyRepository.updateStatus must be implemented by an adapter.');
  }
}

module.exports = { PolicyRepository };
