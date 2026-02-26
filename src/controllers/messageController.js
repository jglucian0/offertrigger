const { manager, wppService } = require('./sessionController')
const ScraperService = require('../services/scraperService')
const AffiliateService = require('../services/affiliate/affiliateService')
const MessageFormatter = require('../services/messageFormatter')

exports.sendMessage = async (req, res) => {
  const { userId, to, url } = req.body

  const session = manager.getSession(userId)

  if (!session) {
    return res.status(404).json({ error: 'Sessão não encontrada' })
  }

  if (!session.client || session.status !== 'connected') {
    return res.status(400).json({ error: 'Sessão não pronta para envio' })
  }

  try {
    const scraper = new ScraperService()
    const affiliate = new AffiliateService()

    console.log(`[Controller] Scraping produto: ${url}`)

    const produtos = await scraper.fetchProducts(url, userId)
    const item = produtos?.[0]

    if (!item) {
      return res.status(404).json({ error: 'Produto não encontrado pelo Scraper' })
    }

    console.log('[Controller] Gerando link afiliado...')

    item.link = await affiliate.generateAffiliateLink(item.url, userId) //VER SE N È LINK
    console.log(`usuario do messagecontroller ${userId}`)

    const mensagem = MessageFormatter.format(item)

    await wppService.sendImage(userId, to, item.image, mensagem)

    return res.json({
      message: 'Oferta enviada com sucesso!',
      data: {
        title: item.title,
        link: item.link
      }
    })

  } catch (err) {
    console.error('[Controller] Erro:', err)

    if (err.message === 'COOKIES_NOT_FOUND mesageController.js') {
      return res.status(400).json({
        error: 'Cookies não enviados ou inválidos para este usuário'
      })
    }

    if (err.message === 'SESSION_EXPIRED') {
      return res.status(401).json({
        error: 'Sessão do Mercado Livre expirada. Envie novos cookies.'
      })
    }

    return res.status(500).json({
      error: 'Falha ao processar e enviar oferta',
      details: err.message
    })
  }
}