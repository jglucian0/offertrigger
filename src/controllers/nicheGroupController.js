const nicheGroupService = require('../services/nicheGroupService')

exports.register = async (req, res) => {

  try {
    const { sessionId, groupId, niche, groupName } = req.body

    if (!sessionId || !groupId || !groupName)
      return res.status(400).json({ error: 'sessionId, groupId e groupName obrigatórios' })

    await nicheGroupService.register(
      sessionId,
      groupId,
      niche?.trim() || 'sem nicho definido',
      groupName
    )

    res.json({ success: true })

  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

exports.listBySession = async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!sessionId)
      return res.status(400).json({ error: 'sessionId obrigatório' })

    const groups = await nicheGroupService.listBySession(sessionId)

    res.json(groups)

  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const { sessionId, groupId } = req.body

    if (!groupId)
      return res.status(400).json({ error: 'groupId obrigatório' })

    await nicheGroupService.remove(sessionId, groupId)

    res.json({ success: true })

  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

exports.list = async (req, res) => {
  const { sessionId } = req.query

  if (!sessionId)
    return res.status(400).json({ error: 'sessionId obrigatório' })

  const groups = await nicheGroupService.listAll(sessionId)

  res.json(groups)
}