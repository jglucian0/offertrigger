const fs = require('fs');
const path = require('path');
const WppService = require('../services/wppService');

const manager = require('../services/sessionSingleton');
const wppService = new WppService(manager);

async function startSession(req, res) {
  console.log('Body recebido:', req.body);

  if (!req.body || !req.body.userId) {
    return res.status(400).json({ error: 'O campo userId é obrigatório no corpo da requisição.' });
  }

  const { userId } = req.body;

  // Verifica se já existe ou se há espaço
  const canCreate = manager.createSession(userId);
  if (!canCreate && !manager.getSession(userId)) {
    return res.status(403).json({ error: 'Limite de 5 usuários atingido' });
  }

  // Inicia o processo do WhatsApp em segundo plano
  // Não usamos 'await' aqui para não travar a resposta da API
  wppService.initSession(userId);

  return res.status(201).json({
    message: `Processo de conexão iniciado para ${userId}. Aguarde o QR Code.`
  });
};

// Nova rota para o Front-end consultar o status e o QR Code
function checkStatus(req, res) {
  const { userId } = req.params;
  const session = manager.getSession(userId);

  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });

  return res.json({
    userId: session.id,
    status: session.status,
    qrcode: session.qrcode // O Front-end usará isso numa tag <img src="...">

  });

};

function listSessions(req, res) {
  const sessions = manager.getAllSessions();

  const payload = sessions.map(s => ({
    id: s.id,
    status: s.status,
    qrcode: s.qrcode || null,
    interfaceReady: !!s.interfaceReady
  }));

  return res.json(payload);
};

async function deleteSession(req, res) {
  const { userId } = req.params;

  try {
    const session = manager.getSession(userId);

    if (!session)
      return res.status(404).json({ error: 'Sessão não encontrada' });

    // fecha whatsapp
    await wppService.closeSession(userId);

    // remove da memória
    manager.removeSession(userId);

    // apaga pasta token
    const tokensPath = path.join(process.cwd(), 'tokens', userId);

    if (fs.existsSync(tokensPath)) {
      fs.rmSync(tokensPath, { recursive: true, force: true });
      console.log(`[Session] Tokens removidos: ${userId}`);
    }

    res.json({ success: true });

  } catch (err) {
    console.error('[Session] Erro ao remover:', err);
    res.status(500).json({ error: 'Falha ao remover sessão' });
  }
};

async function getGroups(req, res) {
  const { userId } = req.params;

  try {
    const groups = await wppService.getAllGroups(userId);
    res.json(groups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  startSession,
  checkStatus,
  deleteSession,
  getGroups,
  listSessions,
  manager,
  wppService
};