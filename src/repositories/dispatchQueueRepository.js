const db = require('../infra/db')

class DispatchQueueRepository {

  async enqueue(offer) {
    const query = `
      INSERT INTO dispatch_queue (
        product_name,
        message_text,
        image_url,
        link,
        niche,
        original_price,
        current_price,
        discount,
        free_shipping
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id
    `

    const values = [
      offer.title,
      offer.message,
      offer.imagePath,
      offer.affiliateUrl,
      offer.niche,
      offer.original_price,
      offer.current_price,
      offer.discount,
      offer.free_shipping
    ]

    const { rows } = await db.query(query, values)
    return rows[0]
  }

  async getNext(niche) {
    const query = `
      SELECT *
      FROM dispatch_queue
      WHERE niche = $1
        AND send_count = 0
      ORDER BY created_at ASC
      LIMIT 1
    `

    const { rows } = await db.query(query, [niche])
    return rows[0]
  }

  async markSent(id) {
    const query = `
      UPDATE dispatch_queue
      SET send_count = send_count + 1
      WHERE id = $1
    `

    await db.query(query, [id])
  }

}

module.exports = new DispatchQueueRepository()