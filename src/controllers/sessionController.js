const fs = require('fs')
const path = require('path')

const WppService = require('../services/wppService')
const manager = require('../services/sessionSingleton')
const nicheDispatchConfigRepository = require('../repositories/nicheDispatchConfigRepository');
const nicheGroupRepository = require('../repositories/nicheGroupRepository');

const wppService = new WppService(manager)

async function startSession(req, res) {
  console.log('[SessionController] Body recebido:', req.body)

  if (!req.body?.userId) {
    return res.status(400).json({
      error: 'O campo userId é obrigatório no corpo da requisição.'
    })
  }

  const { userId } = req.body

  const canCreate = manager.createSession(userId)

  if (!canCreate && !manager.getSession(userId)) {
    return res.status(403).json({
      error: 'Limite de usuários atingido'
    })
  }

  wppService.initSession(userId)

  return res.status(201).json({
    message: `Processo de conexão iniciado para ${userId}. Aguarde o QR Code.`
  })
}

function checkStatus(req, res) {
  const { userId } = req.params
  const session = manager.getSession(userId)

  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' })
  }

  return res.json({
    userId: session.id,
    status: session.status,
    qrcode: session.qrcode
  })
}

function listSessions(req, res) {
  const sessions = manager.getAllSessions()

  const payload = sessions.map(session => ({
    id: session.id,
    status: session.status,
    qrcode: session.qrcode || null,
    interfaceReady: Boolean(session.interfaceReady)
  }))

  return res.json(payload)
}

async function deleteSession(req, res) {
  const { userId } = req.params

  try {
    const session = manager.getSession(userId)

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' })
    }

    await nicheDispatchConfigRepository.deleteBySession(userId);
    await wppService.closeSession(userId)

    manager.removeSession(userId)

    const tokensPath = path.join(process.cwd(), 'tokens', userId)

    if (fs.existsSync(tokensPath)) {
      fs.rmSync(tokensPath, { recursive: true, force: true })
      console.log(`[Session] Tokens removidos: ${userId}`)
    }

    return res.json({ success: true })

  } catch (err) {
    console.error('[Session] Erro ao remover:', err)
    return res.status(500).json({ error: 'Falha ao remover sessão' })
  }
}

async function getGroups(req, res) {
  const { userId } = req.params

  try {
    const groups = await wppService.getAllGroups(userId)
    return res.json(groups)
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

module.exports = {
  startSession,
  checkStatus,
  deleteSession,
  getGroups,
  listSessions,
  manager,
  wppService
}