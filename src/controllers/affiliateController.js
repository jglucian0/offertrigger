const AffiliateService = require('../services/affiliate/affiliateService')

const affiliateService = new AffiliateService()

exports.generateLink = async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({
      error: 'A URL do produto é obrigatória no corpo da requisição.'
    })
  }

  try {
    console.log(`[Route] Gerando link afiliado: ${url}`)

    const affiliateUrl = await affiliateService.generateAffiliateLink(url)

    if (!affiliateUrl) {
      throw new Error('Link vazio')
    }

    return res.json({
      success: true,
      affiliateUrl
    })

  } catch (err) {
    console.error('[AffiliateController] Erro:', err)

    return res.status(500).json({
      success: false,
      error: 'Falha ao gerar link de afiliado',
      details: err.message
    })
  }
}