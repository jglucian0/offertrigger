const db = require('../infra/db');

class NicheDispatchConfigRepository {

  async getActiveBySession(sessionId) {
    const { rows } = await db.query(
      `
      SELECT *
      FROM niche_dispatch_config
      WHERE session_id = $1
      `,
      [sessionId]
    );

    return rows;
  }

  async updateLastSent(sessionId, niche) {
    await db.query(
      `
      UPDATE niche_dispatch_config
      SET last_sent = $1
      WHERE session_id = $2
        AND niche = $3
      `,
      [Date.now(), sessionId, niche]
    );
  }
}

module.exports = new NicheDispatchConfigRepository();
