const configRepo = require('../repositories/nicheDispatchConfigRepository');
const queueRepo = require('../repositories/dispatchQueueRepository');
const db = require('../infra/db')

const MIN_INTERVAL = 5 * 60 * 1000;

class DispatchController {

  async saveConfig(req, res) {
    try {
      const { sessionId, niche, interval, start, end, paused } = req.body;

      if (!interval || interval < MIN_INTERVAL) {
        return res.status(400).json({
          error: 'Intervalo mínimo permitido é 5 minutos'
        });
      }

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

  async deleteConfig(req, res) {
    try {
      const { sessionId, niche } = req.params;

      await configRepo.delete(sessionId, niche);

      return res.json({ success: true });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao excluir nicho' });
    }
  }

  async register(sessionId, groupId, niche, groupName) {
    await repo.create(sessionId, groupId, niche, groupName);

    const existing = await configRepo.getBySessionAndNiche(sessionId, niche);

    if (!existing) {
      await configRepo.upsert({
        sessionId,
        niche,
        interval: MIN_INTERVAL,
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

  async stats(req, res) {
    try {
      const { sessionId } = req.params

      const stats = await queueRepo.getStatsBySession(sessionId)

      return res.json({
        pending: Number(stats.pending) || 0,
        sent_today: Number(stats.sent_today) || 0
      })

    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Erro ao buscar stats' })
    }
  }

  async history(req, res) {
    try {
      const { sessionId } = req.params

      const history = await queueRepo.getHistoryBySession(sessionId)

      return res.json(history)

    } catch (err) {
      console.error(err)
      return res.status(500).json({ error: 'Erro ao buscar histórico' })
    }
  }

  async listQueue(req, res) {
    try {
      const { sessionId, niche } = req.params;

      const rows = await queueRepo.listPendingBySessionAndNiche(sessionId, niche);

      return res.json(rows);

    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro ao listar fila' });
    }
  }
}

module.exports = new DispatchController();
