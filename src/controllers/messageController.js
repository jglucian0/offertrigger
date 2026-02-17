const { manager, wppService } = require('./sessionController');
const ScraperService = require('../services/scraperService');
const AffiliateService = require('../services/affiliate/affiliateService');
const MessageFormatter = require('../services/messageFormatter');

exports.sendMessage = async (req, res) => {
  const { userId, to, url } = req.body;

  const session = manager.getSession(userId);

  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  if (!session?.client || session.status !== 'connected') {
    return res.status(400).json({
      error: 'Sessão não pronta para envio'
    });
  }

  try {
    const scraper = new ScraperService();
    const affiliate = new AffiliateService();

    console.log(`[Controller] Iniciando Scraper para: ${url}`);
    const produtos = await scraper.fetchProducts(url);
    const item = produtos[0];

    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado pelo Scraper' });
    }

    console.log('[Controller] Convertendo link no Affiliate Builder...');
    const linkAfiliado = await affiliate.generateAffiliateLink(item.link);
    item.link = linkAfiliado;

    const mensagemFormatada = MessageFormatter.format(item);

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