const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { loadCookies } = require('../../utils/cookieHelper')

puppeteer.use(StealthPlugin())

class AffiliateBrowser {

  async generate(originalLink) {
    console.log('[AffiliateService] Lendo cookies do arquivo...')

    const cookies = await loadCookies()
    if (!cookies.length) throw new Error('Nenhum cookie encontrado')

    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })

    try {
      const page = await browser.newPage()

      await page.setUserAgent('Mozilla/5.0')
      await page.setCookie(...cookies)

      await page.goto('https://www.mercadolivre.com.br/afiliados/linkbuilder#hub', {
        waitUntil: 'networkidle2'
      })

      const selector = 'textarea'

      await page.waitForSelector(selector, { visible: true, timeout: 15000 })

      await page.click(selector, { clickCount: 3 })
      await page.keyboard.press('Backspace')
      await page.type(selector, originalLink)

      await page.click('button.links-form__button')

      await page.waitForFunction(
        () => document.querySelectorAll('textarea').length > 1,
        { timeout: 15000 }
      )

      return page.evaluate(() => {
        const areas = document.querySelectorAll('textarea')
        return areas[areas.length - 1]?.value || null
      })

    } finally {
      await browser.close()
    }
  }
}

module.exports = AffiliateBrowser