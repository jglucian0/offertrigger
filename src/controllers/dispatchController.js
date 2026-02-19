const configRepo = require('../repositories/nicheDispatchConfigRepository');
const queueRepo = require('../repositories/dispatchQueueRepository');

class DispatchController {

  async saveConfig(req, res) {
    try {
      const { sessionId, niche, interval, start, end, paused } = req.body;

      await configRepo.upsert({
        sessionId,
        niche,
        interval,
        start,
        end,
        paused
      });

      return res.json({ success: true });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao salvar config' });
    }
  }

  async register(sessionId, groupId, niche, groupName) {
    await repo.create(sessionId, groupId, niche, groupName);

    const existing = await configRepo.getBySessionAndNiche(sessionId, niche);

    if (!existing) {
      await configRepo.upsert({
        sessionId,
        niche,
        interval: 60000,
        start: '00:00',
        end: '23:59',
        paused: false
      });
    }
  }

  async listConfigs(req, res) {
    try {
      const { sessionId } = req.params;
      const configs = await configRepo.getBySession(sessionId);
      return res.json(configs);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao listar configs' });
    }
  }

  async toggle(req, res) {
    try {
      const { sessionId, niche, paused } = req.body;
      await configRepo.toggle(sessionId, niche, paused);
      return res.json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao pausar nicho' });
    }
  }

  async listQueue(req, res) {
    try {
      const { sessionId, niche } = req.params;

      const { rows } = await require('../infra/db').query(
        `
        SELECT *
        FROM dispatch_queue
        WHERE session_id = $1
          AND niche = $2
          AND send_count = 0
        ORDER BY created_at DESC
        `,
        [sessionId, niche]
      );

      return res.json(rows);
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao listar fila' });
    }
  }
}

module.exports = new DispatchController();
