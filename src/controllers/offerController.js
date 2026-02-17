const db = require('../infra/db');

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
      send_count
    FROM dispatch_queue
    ORDER BY niche, created_at DESC
  `);

  const grouped = {};

  result.rows.forEach(o => {
    if (!grouped[o.niche]) grouped[o.niche] = [];

    grouped[o.niche].push({
      ...o,
      sent: o.send_count > 0
    });
  });

  res.json(
    Object.entries(grouped).map(([niche, offers]) => ({
      niche,
      offers
    }))
  );
}

async function deleteOffer(req, res) {
  const { id } = req.params;

  await db.query(
    `DELETE FROM dispatch_queue WHERE id = $1`,
    [id]
  );

  res.json({ success: true });
}

async function updateOffer(req, res) {
  const { id } = req.params;

  const {
    product_name,
    original_price,
    current_price,
    discount,
    free_shipping,
    sent
  } = req.body;

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
  ]);

  res.sendStatus(200);
}

module.exports = { listOffers, updateOffer, deleteOffer };