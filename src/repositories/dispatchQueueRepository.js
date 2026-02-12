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

}

module.exports = new DispatchQueueRepository();