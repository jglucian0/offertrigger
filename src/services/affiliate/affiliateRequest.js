const axios = require('axios')
const { loadCookies } = require('../../utils/cookieHelper')

class AffiliateRequest {

  async generate(originalLink) {
    const cookies = await loadCookies()
    const ssid = cookies.find(c => c.name === 'ssid')?.value

    if (!ssid) throw new Error('NO_SSID')

    try {
      const { data } = await axios.post(
        'https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink',
        {
          urls: [originalLink],
          tag: 'garimpei'
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
            origin: 'https://www.mercadolivre.com.br',
            referer: 'https://www.mercadolivre.com.br/afiliados/linkbuilder',
            'user-agent': 'Mozilla/5.0',
            cookie: `ssid=${ssid}`
          },
          timeout: 8000
        }
      )

      const short = data?.urls?.[0]?.short_url
      if (!short) throw new Error()

      return short

    } catch {
      throw new Error('REQUEST_FAILED')
    }
  }
}

module.exports = AffiliateRequest