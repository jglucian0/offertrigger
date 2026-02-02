const ScraperService = require('./services/scraperService');
const AffiliateService = require('./services/affiliateService');
const MessageFormatter = require('./services/messageFormatter');
const WppService = require('./services/wppService');
// Assumindo que você tem um SessionManager para gerenciar os estados
const SessionManager = require('./services/sessionManager');

async function dispararOferta(urlMeli, userId, groupId) {
  // 1. Inicializa os serviços
  const sessionManager = new SessionManager();
  const wppService = new WppService(sessionManager);
  const scraper = new ScraperService();
  const affiliate = new AffiliateService();

  try {
    // 2. Inicia a sessão do WhatsApp (Gera QR Code se necessário)
    console.log(`[Status] Iniciando sessão para o usuário: ${userId}...`);
    await wppService.initSession(userId);

    // Pequena pausa para garantir que o cliente conectou
    await new Promise(r => setTimeout(r, 5000));

    // 3. Coleta os dados do Mercado Livre (Scraper)
    console.log('[Status] Coletando dados do produto...');
    const produtos = await scraper.fetchProducts(urlMeli);
    const item = produtos[0];

    if (!item) throw new Error('Produto não encontrado pelo Scraper');

    // 4. Converte o link (Affiliate usando o arquivo de cookies)
    console.log('[Status] Convertendo link de afiliado...');
    const linkAfiliado = await affiliate.generateAffiliateLink(item.link);
    item.link = linkAfiliado;

    // 5. Formata a mensagem para o Zap
    const textoFinal = MessageFormatter.format(item);

    // 6. DISPARO REAL PARA O WHATSAPP (Com Imagem)
    console.log('[Status] Enviando oferta para o grupo...');
    await wppService.sendImage(userId, groupId, item.image, textoFinal);

    console.log('✅ PROCESSO CONCLUÍDO: Oferta enviada com sucesso!');

  } catch (err) {
    console.error('❌ Falha no processo:', err.message);
  }
}

// CONFIGURAÇÕES DE TESTE
const urlTeste = "https://www.mercadolivre.com.br/sec/1Q1NTGY";
const meuUserId = "jgluciano"; // ID da sua sessão local
const meuGrupoId = "120363423722087569@g.us"; // ID do grupo extraído pelo getAllGroups

dispararOferta(urlTeste, meuUserId, meuGrupoId);