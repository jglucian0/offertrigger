const db = require('../infra/db')

class DispatchQueueRepository {

  async enqueue(offer) {
    const query = `
      INSERT INTO dispatch_queue (
        session_id,
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
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id
    `

    const values = [
      offer.sessionId,
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

  async getNext(sessionId, niche) {
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `
      SELECT *
      FROM dispatch_queue
      WHERE session_id = $1
        AND niche = $2
        AND send_count = 0
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
      `,
        [sessionId, niche]
      );

      if (!rows.length) {
        await client.query('COMMIT');
        return null;
      }

      await client.query(
        `
      UPDATE dispatch_queue
      SET send_count = 1
      WHERE id = $1
      `,
        [rows[0].id]
      );

      await client.query('COMMIT');

      return rows[0];

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // async markSent(id) {
  //   const query = `
  //     UPDATE dispatch_queue
  //     SET send_count = send_count + 1
  //     WHERE id = $1
  //   `

  //   await db.query(query, [id])
  // }

}

module.exports = new DispatchQueueRepository()