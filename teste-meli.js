const axios = require('axios');

// === CONFIGURAÇÕES (Cole aqui os dados que você extraiu) ===
const CONFIG = {
  SSID: 'ghy-020320-Pgvu1OU5YT1GREe85gOMGDtnvj8d2H-__-757601996-__-1864861086350--RRR_0-RRR_0',
  TAG: 'garimpei',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  URL_PRODUTO: 'https://www.mercadolivre.com.br/creatina-monohidratada-250g-growth-supplements-sem-sabor-em-po/p/MLB19603205#polycard_client=social-profile-middleend&source=lists&type=product&tracking_id=fa8f5651-409a-481a-8858-656bb801a9b2&wid=MLB5872060016&sid=storefronts'
};

async function dispararConversao() {
  console.log('🚀 Iniciando conversão...');

  try {
    const response = await axios({
      method: 'post',
      url: 'https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink',
      headers: {
        'authority': 'www.mercadolivre.com.br',
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'user-agent': CONFIG.USER_AGENT,
        'origin': 'https://www.mercadolivre.com.br',
        'referer': 'https://www.mercadolivre.com.br/afiliados/linkbuilder',
        // Montagem do Cookie com os dois campos que você tem
        'cookie': `ssid=${CONFIG.SSID}`
      },
      data: {
        urls: [CONFIG.URL_PRODUTO],
        tag: CONFIG.TAG
      }
    });

    if (response.data && response.data.urls && response.data.urls.length > 0) {
      const linkCurto = response.data.urls[0].short_url;

      // Retorno exatamente como você pediu
      console.log(`"short_url": "${linkCurto}",`);
    }

  } catch (error) {
    console.error('❌ FALHA NA REQUISIÇÃO');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados do Erro:', error.response.data);

      if (error.response.status === 403) {
        console.log('\n💡 Dica: O CSRF ou o SSID podem ter expirado. Tente pegar novos no navegador.');
      }
    } else {
      console.error('Erro de Conexão:', error.message);
    }
  }
}

dispararConversao();