const { manager, wppService } = require('./sessionController');

exports.sendMessage = async (req, res) => {
  const { userId, to, message } = req.body;

  const session = manager.getSession(userId);

  // Validação do Usuário (Issue #04 - Teste 1)
  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  // Validação do Status (Issue #04 - Teste 2)
  // O WPPConnect usa status como 'inChat', 'connected', etc.
  if (session.status !== 'inChat' && session.status !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    // Chamamos o serviço para enviar
    await wppService.sendText(userId, to, message);
    return res.status(200).json({ message: 'Mensagem enviada com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao enviar', details: error.message });
  }
};