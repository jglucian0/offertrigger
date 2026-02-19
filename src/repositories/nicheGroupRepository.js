const pool = require('../infra/db')

class NicheGroupRepository {

  async getByNiche(niche) {
    const { rows } = await pool.query(
      `SELECT group_id FROM niche_groups WHERE niche = $1 AND active = true`,
      [niche]
    )

    return rows.map(r => r.group_id)
  }

  async countActive() {
    const { rows } = await pool.query(
      `SELECT COUNT(*) FROM niche_groups WHERE active = true`
    )

    return Number(rows[0].count)
  }

  async create(sessionId, groupId, niche, groupName) {
    return pool.query(
      `
    INSERT INTO niche_groups (session_id, group_id, niche, group_name, active)
    VALUES ($1,$2,$3,$4,true)
    ON CONFLICT (session_id, group_id)
    DO UPDATE SET
      niche = EXCLUDED.niche,
      group_name = EXCLUDED.group_name,
      active = true
    `,
      [sessionId, groupId, niche || 'sem nicho definido', groupName]
    )
  }

  async listBySession(sessionId) {
    const { rows } = await pool.query(
      `
    SELECT id, group_id, group_name, niche, active, created_at
    FROM niche_groups
    WHERE session_id = $1
    ORDER BY created_at DESC
    `,
      [sessionId]
    )

    return rows
  }

  async remove(sessionId, groupId) {
    return pool.query(
      `DELETE FROM niche_groups WHERE session_id = $1 AND group_id = $2`,
      [sessionId, groupId]
    )
  }

  async listAll(sessionId) {
    const { rows } = await pool.query(
      `
    SELECT id, group_id, group_name, niche
    FROM niche_groups
    WHERE session_id = $1
    ORDER BY created_at DESC
    `,
      [sessionId]
    )

    return rows
  }
}

module.exports = new NicheGroupRepository()
