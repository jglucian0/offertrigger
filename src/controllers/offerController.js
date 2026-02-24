const db = require('../infra/db')

async function listOffers(req, res) {
  const result = await db.query(`
    SELECT
      id,
      product_name,
      image_url,
      link,
      niche,
      created_at,
      original_price,
      current_price,
      discount,
      free_shipping,
      send_count,
      session_id
    FROM dispatch_queue
    ORDER BY niche, created_at DESC
  `)

  const grouped = {}

  result.rows.forEach(offer => {
    if (!grouped[offer.niche]) {
      grouped[offer.niche] = []
    }

    grouped[offer.niche].push({
      ...offer,
      image_url: offer.image_url,
      sent: offer.send_count > 0
    })
  })

  const payload = Object.entries(grouped).map(([niche, offers]) => ({
    niche,
    offers
  }))

  return res.json(payload)
}

async function migrateOffer(req, res) {
  const { id } = req.params
  const { newSessionId } = req.body

  if (!newSessionId)
    return res.status(400).json({ error: "newSessionId obrigatório" })

  await db.query(
    `
    UPDATE dispatch_queue
    SET session_id = $1
    WHERE id = $2
    `,
    [newSessionId, id]
  )

  return res.json({ success: true })
}

async function deleteOffer(req, res) {
  const { id } = req.params

  await db.query(
    'DELETE FROM dispatch_queue WHERE id = $1',
    [id]
  )

  return res.json({ success: true })
}

async function updateOffer(req, res) {
  const { id } = req.params

  const {
    product_name,
    original_price,
    current_price,
    discount,
    free_shipping,
    sent
  } = req.body

  await db.query(`
    UPDATE dispatch_queue
    SET
      product_name = $1,
      original_price = $2,
      current_price = $3,
      discount = $4,
      free_shipping = $5,
      send_count = CASE
        WHEN $6 = false THEN 0
        ELSE 1
      END
    WHERE id = $7
  `, [
    product_name,
    original_price,
    current_price,
    discount,
    free_shipping,
    sent,
    id
  ])

  return res.sendStatus(200)
}

module.exports = {
  listOffers,
  updateOffer,
  deleteOffer,
  migrateOffer
}