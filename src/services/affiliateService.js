const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { loadCookies } = require('../utils/cookieHelper');

puppeteer.use(StealthPlugin());

class AffiliateService {
  async generateAffiliateLink(originalLink) {
    console.log('[AffiliateService] Lendo cookies do arquivo...');
    const cookiesToInject = await loadCookies();

    if (cookiesToInject.length === 0) {
      throw new Error('Nenhum cookie encontrado no arquivo txt.');
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      await page.setCookie(...cookiesToInject);

      await page.goto('https://www.mercadolivre.com.br/afiliados/linkbuilder#hub', {
        waitUntil: 'networkidle2'
      });

      const inputSelector = 'textarea';
      await page.waitForSelector(inputSelector, { visible: true, timeout: 15000 });

      await page.click(inputSelector, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type(inputSelector, originalLink);

      await page.click('button.links-form__button');

      await page.waitForFunction(() => document.querySelectorAll('textarea').length > 1, { timeout: 15000 });

      const resultLink = await page.evaluate(() => {
        const areas = Array.from(document.querySelectorAll('textarea'));
        return areas.length > 1 ? areas[areas.length - 1].value : null;
      });

      return resultLink;
    } finally {
      await browser.close();
    }
  }
}

module.exports = AffiliateService;