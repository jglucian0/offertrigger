// src/controllers/offerController.js
const ScraperService = require('../services/scraperService');
const AffiliateService = require('../services/affiliateService');
const MessageFormatter = require('../services/messageFormatter');

class OfferController {
  constructor(wppService, db) {
    this.wppService = wppService;
    this.scraper = new ScraperService();
    this.affiliate = new AffiliateService();
    this.db = db; // Sua base de dados
  }

  async handleOffer(req, res) {
    const { userId, groupId, url } = req.body;

    try {
      // 1. Busca o token do cliente no Banco de Dados
      const userConfig = await this.db.findUser(userId);
      if (!userConfig?.token) throw new Error('Token de afiliado não configurado');

      // 2. Scraper: Coleta dados do produto
      const products = await this.scraper.fetchProducts(url);
      const item = products[0];

      // 3. Affiliate: Converte o link usando o token dinâmico
      const affiliateLink = await this.affiliate.generateAffiliateLink(item.link, userConfig.token);
      item.link = affiliateLink;

      // 4. Formatter: Cria o texto
      const message = MessageFormatter.format(item);

      // 5. WhatsApp: Envia com imagem
      await this.wppService.sendImage(userId, groupId, item.image, message);

      res.json({ success: true, link: affiliateLink });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}