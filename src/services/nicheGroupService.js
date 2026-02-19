const repo = require('../repositories/nicheGroupRepository')

class NicheGroupService {

  async register(sessionId, groupId, niche, groupName) {
    return repo.create(sessionId, groupId, niche, groupName)
  }

  async getGroups(niche) {
    return repo.getByNiche(niche)
  }

  async listAll(sessionId) {
    return repo.listAll(sessionId)
  }

  async remove(sessionId, groupId) {
    return repo.remove(sessionId, groupId)
  }

  async listBySession(sessionId) {
    return repo.listBySession(sessionId)
  }
}

module.exports = new NicheGroupService()
