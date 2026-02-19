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

  async getBySession(sessionId) {
    const { rows } = await db.query(
      `SELECT * FROM niche_dispatch_config WHERE session_id = $1`,
      [sessionId]
    );
    return rows;
  }

  async getBySessionAndNiche(sessionId, niche) {
    const { rows } = await db.query(
      `
      SELECT *
      FROM niche_dispatch_config
      WHERE session_id = $1
        AND niche = $2
      `,
      [sessionId, niche]
    );
    return rows[0] || null;
  }

  async upsert(config) {
    return db.query(
      `
    INSERT INTO niche_dispatch_config (
      session_id,
      niche,
      interval_ms,
      start_time,
      end_time,
      paused,
      last_sent
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (session_id, niche)
    DO UPDATE SET
      interval_ms = EXCLUDED.interval_ms,
      start_time = EXCLUDED.start_time,
      end_time = EXCLUDED.end_time,
      paused = EXCLUDED.paused
    `,
      [
        config.sessionId,
        config.niche,
        config.interval,
        config.start,
        config.end,
        config.paused ?? false,
        0
      ]
    );
  }

  async toggle(sessionId, niche, paused) {
    return db.query(
      `
      UPDATE niche_dispatch_config
      SET paused = $1
      WHERE session_id = $2
        AND niche = $3
      `,
      [paused, sessionId, niche]
    );
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
