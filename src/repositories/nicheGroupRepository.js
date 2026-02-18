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

  async create(groupId, niche, groupName) {

    return pool.query(
      `INSERT INTO niche_groups (group_id, niche, group_name)
     VALUES ($1,$2,$3)
     ON CONFLICT (group_id, niche)
     DO UPDATE SET active = true, group_name = EXCLUDED.group_name`,
      [groupId, niche, groupName || null]
    )
  }

  async remove(groupId, niche) {
    return pool.query(
      `DELETE FROM niche_groups WHERE group_id = $1 AND niche = $2`,
      [groupId, niche]
    )
  }

  async listAll() {
    const { rows } = await pool.query(
      `SELECT id, group_id, group_name, niche, active, created_at
     FROM niche_groups
     ORDER BY created_at DESC`
    )

    return rows
  }
}

module.exports = new NicheGroupRepository()
