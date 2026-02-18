const repo = require('../repositories/nicheGroupRepository')

class NicheGroupService {

  async register(groupId, niche, groupName) {

    const total = await repo.countActive()

    if (total >= 5)
      throw new Error('Limite de 5 grupos ativos atingido')

    return repo.create(groupId, niche, groupName)
  }

  async getGroups(niche) {
    return repo.getByNiche(niche)
  }

  async listAll() {
    return repo.listAll()
  }

  async remove(groupId, niche) {
    return repo.remove(groupId, niche)
  }
}

module.exports = new NicheGroupService()
