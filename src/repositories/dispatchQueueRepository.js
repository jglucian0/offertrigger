const db = require('../infra/db');

class DispatchQueueRepository {

  async enqueue(offer) {
    const query = `
      INSERT INTO dispatch_queue
        (product_name, message_text, image_url, link, niche)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING id
    `;

    const values = [
      offer.title,
      offer.message,
      offer.imagePath,
      offer.affiliateUrl,
      offer.niche
    ];

    const res = await db.query(query, values);
    return res.rows[0];
  }

  async getNext(niche) {
    const q = `
    SELECT *
    FROM dispatch_queue
    WHERE niche = $1
      AND send_count = 0
    ORDER BY created_at ASC
    LIMIT 1
  `;

    const r = await db.query(q, [niche]);
    return r.rows[0];
  }

  async markSent(id) {
    await db.query(`
    UPDATE dispatch_queue
    SET send_count = send_count + 1
    WHERE id = $1
  `, [id]);
  }

}

module.exports = new DispatchQueueRepository();