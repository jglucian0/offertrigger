const { manager, wppService } = require('./sessionController');
const ScraperService = require('../services/scraperService');
const AffiliateService = require('../services/affiliateService');
const MessageFormatter = require('../services/messageFormatter');

exports.sendMessage = async (req, res) => {
  // Agora recebemos 'url' em vez de 'message' para disparar o fluxo automático
  const { userId, to, url } = req.body;

  const session = manager.getSession(userId);

  // 1. Validação da Sessão Ativa
  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  // 2. Validação do Status
  if (session.status !== 'inChat' && session.status !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const scraper = new ScraperService();
    const affiliate = new AffiliateService();

    // 3. Executa o Scraper (Usa a lógica que você validou no TDD)
    console.log(`[Controller] Iniciando Scraper para: ${url}`);
    const produtos = await scraper.fetchProducts(url);
    const item = produtos[0];

    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado pelo Scraper' });
    }

    // 4. Converte o link para Afiliado (Usa o arquivo de cookies .txt)
    console.log('[Controller] Convertendo link no Affiliate Builder...');
    const linkAfiliado = await affiliate.generateAffiliateLink(item.link);
    item.link = linkAfiliado;

    // 5. Formata a mensagem final
    const mensagemFormatada = MessageFormatter.format(item);

    // 6. Envia a IMAGEM + TEXTO usando a sessão ativa
    // Importante: to deve ser o ID do grupo (ex: 120363...@g.us)
    await wppService.sendImage(userId, to, item.image, mensagemFormatada);

    return res.status(200).json({
      message: 'Oferta enviada com sucesso!',
      data: {
        title: item.title,
        link: item.link
      }
    });

  } catch (error) {
    console.error('[Controller] Erro no processamento:', error.message);
    return res.status(500).json({
      error: 'Falha ao processar e enviar oferta',
      details: error.message
    });
  }
};