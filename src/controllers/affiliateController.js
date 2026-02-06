const AffiliateService = require('../services/affiliateService');
const affiliateService = new AffiliateService();

exports.generateLink = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'A URL do produto é obrigatória no corpo da requisição.' });
  }

  try {
    console.log(`[Route] Gerando link de afiliado para: ${url}`);
    const affiliateLink = await affiliateService.generateAffiliateLink(url);

    if (!affiliateLink) {
      throw new Error('Não foi possível capturar o link gerado.');
    }

    return res.status(200).json({
      success: true,
      affiliateUrl: affiliateLink
    });
  } catch (error) {
    console.error('[AffiliateController] Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Falha ao gerar link de afiliado',
      details: error.message
    });
  }
};