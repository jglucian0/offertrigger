const axios = require('axios')
const { loadCookies } = require('../../utils/cookieHelper')

class AffiliateRequest {
  async generate(originalLink) {
    const cookies = await loadCookies();
    const ssid = cookies.find(c => c.name === 'ssid')?.value;

    if (!ssid) throw new Error('NO_SSID');

    try {
      const response = await axios.post(
        'https://www.mercadolivre.com.br/affiliate-program/api/v2/affiliates/createLink',
        {
          urls: [originalLink],
          tag: 'garimpei'
        },
        {
          headers: {
            'content-type': 'application/json',
            'x-requested-with': 'XMLHttpRequest',
            'origin': 'https://www.mercadolivre.com.br',
            'referer': 'https://www.mercadolivre.com.br/afiliados/linkbuilder',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
            'cookie': `ssid=${ssid}`
          },
          timeout: 8000
        })

      const short = response?.data?.urls?.[0]?.short_url;

      if (!short) throw new Error('INVALID_RESPONSE');

      return short;

    } catch (err) {
      throw new Error('REQUEST_FAILED');
    }
  }
}

module.exports = AffiliateRequest;
