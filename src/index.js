const ScraperService = require('./services/scraperService');
const AffiliateService = require('./services/affiliateService');
const MessageFormatter = require('./services/messageFormatter');

async function dispararOferta(urlMeli) {
  const scraper = new ScraperService();
  const affiliate = new AffiliateService();

  try {
    // 1. Coleta os dados do Mercado Livre (Scraper)
    const produtos = await scraper.fetchProducts(urlMeli);
    const item = produtos[0];

    // 2. Converte o link (Affiliate usando Cookies Fixos)
    const linkAfiliado = await affiliate.generateAffiliateLink(item.link);
    item.link = linkAfiliado;

    // 3. Formata a mensagem para o Zap
    const textoFinal = MessageFormatter.format(item);

    console.log('--- MENSAGEM PRONTA ---');
    console.log(textoFinal);
    console.log('--- IMAGEM PARA ENVIO ---');
    console.log(item.image);

  } catch (err) {
    console.error('Falha no processo:', err.message);
  }
}

// Teste com o link que você forneceu
dispararOferta("https://www.mercadolivre.com.br/sec/1Q1NTGY");