const nicheGroupService = require('../services/nicheGroupService')

exports.register = async (req, res) => {
  try {

    const { groupId, niche, groupName } = req.body

    if (!groupId || !niche)
      return res.status(400).json({ error: 'groupId e niche obrigatórios' })

    await nicheGroupService.register(groupId, niche, groupName)

    res.json({ success: true })

  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {

    const { groupId, niche } = req.body

    if (!groupId || !niche)
      return res.status(400).json({ error: 'groupId e niche obrigatórios' })

    await nicheGroupService.remove(groupId, niche)

    res.json({ success: true })

  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

exports.list = async (req, res) => {
  try {
    const groups = await nicheGroupService.listAll()
    res.json(groups)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}