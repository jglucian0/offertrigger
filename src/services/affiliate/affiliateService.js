const AffiliateBrowser = require('./affiliateBrowser')
const AffiliateRequest = require('./affiliateRequest')

class AffiliateService {
  constructor() {
    this.request = new AffiliateRequest()
    this.browser = new AffiliateBrowser()
  }

  async generateAffiliateLink(originalLink) {
    try {
      const link = await this.request.generate(originalLink);

      console.log('[Affiliate] Link gerado via REQUEST');
      return link;

    } catch (err) {
      console.log('[Affiliate] Link gerado via BROWSER');
      return await this.browser.generate(originalLink);
    }
  }
}

module.exports = AffiliateService;