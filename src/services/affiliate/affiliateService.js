const AffiliateBrowser = require('./affiliateBrowser')
const AffiliateRequest = require('./affiliateRequest')

class AffiliateService {
  constructor() {
    this.request = new AffiliateRequest()
    this.browser = new AffiliateBrowser()
  }

  async generateAffiliateLink(originalLink, userId) {
    try {
      const link = await this.request.generate(originalLink, userId)
      return link

    } catch {
      console.log('[Affiliate] Erro ao gerar link via REQUEST')
      return
      // console.log('[Affiliate] Link gerado via BROWSER')
      // return this.browser.generate(originalLink)
    }
  }
}

module.exports = AffiliateService