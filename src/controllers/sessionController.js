const SessionManager = require('../services/sessionManager');
const WppService = require('../services/wppService');

const manager = new SessionManager();
const wppService = new WppService(manager);

exports.startSession = async (req, res) => {
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
exports.checkStatus = (req, res) => {
  const { userId } = req.params;
  const session = manager.getSession(userId);

  if (!session) return res.status(404).json({ error: 'Sessão não encontrada' });

  return res.json({
    userId: session.id,
    status: session.status,
    qrcode: session.qrcode // O Front-end usará isso numa tag <img src="...">

  });

};

exports.getGroups = async (req, res) => {
  const { userId } = req.params;

  try {
    const groups = await wppService.getAllGroups(userId);
    res.json(groups);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  startSession: exports.startSession,
  checkStatus: exports.checkStatus,
  getGroups: exports.getGroups,
  manager,
  wppService
};