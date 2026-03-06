const axios = require('axios');

class UrlResolverService {
  async resolveFinalUrl(url) {
    try {

      const response = await axios.get(url, {
        maxRedirects: 10,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
        },
        validateStatus: () => true
      });

      const finalUrl = response.request.res.responseUrl || response.config.url;

      // Se cair na página social, tentamos extrair o link do produto via Regex no HTML bruto
      if (finalUrl.includes('/social/')) {
        const html = response.data;

        // Regex para capturar links do Mercado Livre que contenham MLB (ID do produto)
        const singleSectionMatch = html.match(
          /<section class="rl-list-single">([\s\S]*?)<\/section>\s*<\/section>/
        );

        let productMatch = null;

        if (singleSectionMatch) {
          const singleSectionHtml = singleSectionMatch[1];

          // 2️⃣ Agora buscamos apenas dentro desse bloco
          const productMatch = singleSectionHtml.match(
            /https:\/\/produto\.mercadolivre\.com\.br\/MLB-\d+[^"'\s]+/
          );

          if (productMatch) {
            return productMatch[0].split('?')[0];
          }
        }

        if (productMatch) {
          const cleanUrl = productMatch[0].split('?')[0]; // Remove trackings
          return cleanUrl;
        }
      }

      return finalUrl;
    } catch (error) {
      console.error(`[Resolver] Erro ao resolver URL: ${error.message}`);
      return url;
    }
  }
}

module.exports = new UrlResolverService();