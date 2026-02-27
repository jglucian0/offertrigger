const AffiliateService = require('../services/affiliate/affiliateService')
const affiliateService = new AffiliateService()

exports.generateLink = async (req, res) => {
  const { url } = req.body;
  const { DEFAULT_MARKETPLACE_OWNER } = require('../config/appConfig');

  if (!url) {
    return res.status(400).json({
      error: 'A URL do produto é obrigatória no corpo da requisição.'
    })
  }

  try {
    console.log(`[Route] Gerando link afiliado: ${url}`)

    const affiliateUrl = await affiliateService.generateAffiliateLink(
      url,
      DEFAULT_MARKETPLACE_OWNER
    )

    if (!affiliateUrl) {
      throw new Error('Link vazio')
    }

    return res.json({
      success: true,
      affiliateUrl
    })

  } catch (err) {
    console.error('[AffiliateController] Erro:', err)

    if (err.message === 'COOKIES_NOT_FOUND affiliateController.js') {
      return res.status(400).json({
        success: false,
        error: 'Cookies não encontrados para este usuário'
      })
    }

    if (err.message === 'NO_SSID') {
      return res.status(401).json({
        success: false,
        error: 'Sessão inválida. Reenvie os cookies.'
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Falha ao gerar link de afiliado',
      details: err.message
    })
  }
}