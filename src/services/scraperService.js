const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

class ScraperService {
  async fetchProducts(url) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Espera o container principal carregar para evitar pegar a página vazia
      await page.waitForSelector('.aff-social-lists__container', { timeout: 10000 });

      const products = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.aff-social-polycard__container'));

        return cards.map(card => {
          // 1. Título e Link (Tentativa em múltiplos seletores comuns nessas listas)
          const anchor = card.querySelector('.poly-component__title a') ||
            card.querySelector('a[class*="title"]') ||
            card.querySelector('.poly-core a');

          const title = anchor?.innerText?.trim();
          const link = anchor?.href;

          // 2. Preços
          const priceContainer = card.querySelector('.poly-component__price') || card.querySelector('[class*="price"]');
          const oldPrice = priceContainer?.querySelector('.andes-money-amount--previous .andes-money-amount__fraction')?.innerText;
          const currentPrice = priceContainer?.querySelector('.poly-price__current .andes-money-amount__fraction')?.innerText;
          const discount = priceContainer?.querySelector('.andes-money-amount__discount')?.innerText;

          // 3. Frete
          const shipping = card.querySelector('.poly-component__shipping') || card.querySelector('[class*="shipping"]');
          const isFreeShipping = shipping?.innerText?.toLowerCase().includes('grátis') || false;

          // 4. Imagem
          const imgElement = card.querySelector('.poly-card__portada img') || card.querySelector('img[class*="image"]');
          const image = imgElement?.src || imgElement?.dataset?.src;

          return {
            title: title || "Produto sem título", // Fallback para não vir vazio
            link: link || null,
            oldPrice: oldPrice ? `R$ ${oldPrice}` : null,
            price: currentPrice ? `R$ ${currentPrice}` : null,
            discount: discount || null,
            freeShipping: isFreeShipping,
            image: image || null
          };
        });
      });

      return products;
    } catch (error) {
      console.error('Erro ao capturar lista social do ML:', error);
      return [];
    } finally {
      await browser.close();
    }
  }
}

module.exports = ScraperService;