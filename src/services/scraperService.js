const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { loadCookies } = require('../utils/cookieHelper');

puppeteer.use(StealthPlugin());

class ScraperService {
  async fetchProducts(url) {
    console.log(`[Scraper] Iniciando scraping...`);

    const cookiesToInject = await loadCookies();
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

      if (cookiesToInject.length > 0) {
        await page.setCookie(...cookiesToInject);
      }

      // Otimização agressiva: não carrega nada além do HTML básico
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'font', 'stylesheet', 'media'].includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Aguarda apenas a presença da tag h1 ou da classe de título
      await page.waitForSelector('.ui-pdp-title, h1', { timeout: 10000 });

      await page.waitForFunction(() =>
        document.querySelector('#price [data-testid="price-part"] .andes-money-amount__fraction')
      );

      const productData = await page.evaluate(() => {
        const getTitle = () => {
          const el = document.querySelector('.ui-pdp-title') || document.querySelector('h1');
          return el ? el.innerText.trim() : "Título não encontrado";
        };

        const extractCurrentPriceSemantic = () => {
          const container = document.querySelector('#price .ui-pdp-price__second-line');
          if (!container) return null;

          // 1) prioridade máxima → meta price
          const meta = container.querySelector('meta[itemprop="price"]');
          if (meta?.content) {
            const value = Number(meta.content);
            const [reais, cents = '00'] = meta.content.split('.');
            return { raw: meta.content, value, reais, cents };
          }

          // 2) fallback visual
          const part = container.querySelector('[data-testid="price-part"]');
          if (!part) return null;

          let reais = part.querySelector('.andes-money-amount__fraction')?.textContent;
          let cents = part.querySelector('.andes-money-amount__cents')?.textContent;

          if (!reais) return null;

          return {
            raw: `${reais}.${cents || '00'}`,
            value: Number(`${reais}.${cents || '00'}`),
            reais,
            cents: cents || '00'
          };
        };

        const extractOldPriceSemantic = (currentPriceValue) => {

          const moneyElements = Array.from(
            document.querySelectorAll('#price .andes-money-amount')
          );

          if (!moneyElements.length) return null;

          const prices = moneyElements.map(el => {

            let reais = el.querySelector('.andes-money-amount__fraction')?.textContent;
            let cents = el.querySelector('.andes-money-amount__cents')?.textContent || '00';

            if (!reais) return null;

            const value = Number(`${reais}.${cents}`);

            // verifica se está tachado
            const isStriked =
              el.closest('s') ||
              el.closest('.ui-pdp-price__original-value') ||
              el.getAttribute('aria-label')?.toLowerCase().includes('antes');

            return {
              value,
              reais,
              cents,
              isStriked: !!isStriked
            };

          }).filter(Boolean);

          if (!prices.length) return null;

          // regra de ouro:
          // preço antigo = maior preço tachado OU maior preço da lista
          let oldPrice =
            prices
              .filter(p => p.isStriked && (!currentPriceValue || p.value > currentPriceValue))
              .sort((a, b) => b.value - a.value)[0]
            ||
            prices
              .filter(p => currentPriceValue && p.value > currentPriceValue)
              .sort((a, b) => b.value - a.value)[0];

          if (!oldPrice) return null;

          return {
            raw: `${oldPrice.reais}.${oldPrice.cents || '00'}`,
            value: Number(`${oldPrice.reais}.${oldPrice.cents || '00'}`),
            reais: oldPrice.reais,
            cents: oldPrice.cents || '00',
            isStriked: oldPrice.isStriked
          };
        };

        const extractShippingInfo = () => {

          const normalize = txt =>
            txt?.replace(/\s+/g, ' ').trim().toLowerCase();

          const isValidShippingText = (text) => {
            if (!text) return false;

            const t = normalize(text);

            // queremos só vantagens reais
            return (
              t.includes('frete grátis') ||
              t.includes('frete gratis') ||
              t.includes('grátis') ||
              t.includes('gratis') ||
              t.includes('chega amanhã') ||
              t.includes('full')
            );
          };

          // ---------- PRIORIDADE 1 (ID INTERNO DO ML) ----------
          const special = document.getElementById('special_event_shipping_summaryspecial_event_shipping_summary');
          if (special) {
            const text = special.innerText;
            if (isValidShippingText(text)) return text.trim();
          }

          // ---------- PRIORIDADE 2 (pill verde promoção) ----------
          const pills = Array.from(
            document.querySelectorAll('.ui-pdp-promotions-pill-label')
          );

          for (const el of pills) {
            const text = el.innerText;
            if (isValidShippingText(text)) return text.trim();
          }

          // ---------- PRIORIDADE 3 (qualquer menção no bloco do preço) ----------
          const priceSection = document.querySelector('#price')?.innerText;
          if (isValidShippingText(priceSection)) {
            const match = priceSection.match(/(frete[^.\n]+)/i);
            if (match) return match[1].trim();
          }

          return null;
        };

        const oldPrice = extractOldPriceSemantic();
        const currentPrice = extractCurrentPriceSemantic();
        const shipping = extractShippingInfo();

        console.log(`O VALOR DE FRETE: ${shipping}`)

        let discountPercent = null;
        if (oldPrice?.value && currentPrice?.value) {
          discountPercent = Math.round(
            ((oldPrice.value - currentPrice.value) / oldPrice.value) * 100
          );
        }

        return {
          title: getTitle(),
          priceText: price?.raw || null,

          currentPriceText: currentPrice?.raw || null,
          currentPriceValue: currentPrice?.value || null,
          currentPriceReais: currentPrice?.reais || null,
          currentPriceCents: currentPrice?.cents || null,

          oldPriceText: oldPrice?.raw || null,
          oldPriceValue: oldPrice?.value || null,
          oldPriceReais: oldPrice?.reais || null,
          oldPriceCents: oldPrice?.cents || null,

          discountPercent,
          shipping,

          url: window.location.href
        };
      });

      return productData;

    } catch (error) {
      console.error(`[Scraper] Erro ao recuperar título: ${error.message}`);
      return { title: "Erro ao recuperar título" };
    } finally {
      await browser.close();
    }
  }
}

module.exports = ScraperService;