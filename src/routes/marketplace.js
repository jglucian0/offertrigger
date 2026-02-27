const express = require('express');
const fs = require('fs');
const path = require('path');

const AffiliateRequest = require('../services/affiliate/affiliateRequest');
const { DEFAULT_MARKETPLACE_OWNER } = require('../config/appConfig');
const router = express.Router();
const pool = require('../infra/db')

const tagsDir = path.resolve(__dirname, '../../uploads/tags');

if (!fs.existsSync(tagsDir)) {
  fs.mkdirSync(tagsDir, { recursive: true });
}

router.post('/mercadolivre/tag', (req, res) => {
  const userId = DEFAULT_MARKETPLACE_OWNER; // 🔥 agora fixo
  const tag = String(req.body.tag || '').trim();

  if (!tag) {
    return res.status(400).json({
      error: 'tag é obrigatória'
    });
  }


  try {
    // 🔥 1️⃣ Remove qualquer arquivo antigo desse usuário (extra segurança)
    const files = fs.readdirSync(tagsDir);

    files.forEach(file => {
      if (file.startsWith(`${userId}_mercadolivre`)) {
        fs.unlinkSync(path.join(tagsDir, file));
      }
    });

    const filePath = path.join(
      tagsDir,
      `${userId}_mercadolivre.json`
    );

    let createdAt = new Date().toISOString();

    // 🔥 2️⃣ Se já existir, preserva createdAt
    if (fs.existsSync(filePath)) {
      const existing = JSON.parse(fs.readFileSync(filePath));
      createdAt = existing.createdAt || createdAt;
    }

    const data = {
      userId,
      marketplace: 'mercadolivre',
      tag,
      createdAt,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return res.json({
      success: true,
      message: 'Etiqueta aplicada (sobrescrita se já existia)'
    });

  } catch (err) {
    console.error('[MarketplaceTag] Erro:', err);
    return res.status(500).json({
      error: 'Erro ao salvar tag'
    });
  }
});

const TEST_PRODUCT_URL =
  'https://www.mercadolivre.com.br/whey-protein-concentrado-1kg-chocolate-dark-lab/p/MLB40182826';

router.post('/mercadolivre/validate', async (req, res) => {
  try {
    const request = new AffiliateRequest();

    const link = await request.generate(
      TEST_PRODUCT_URL,
      DEFAULT_MARKETPLACE_OWNER
    );

    if (!link) {
      throw new Error('EMPTY_LINK');
    }

    return res.json({
      success: true,
      message: 'Cookie válido',
      testAffiliateLink: link
    });

  } catch (err) {
    console.error('[ValidateCookie] Erro real:', err.message);

    return res.status(400).json({
      success: false,
      error: 'Cookie inválido ou sessão expirada'
    });
  }
});


router.post('/config/status', async (req, res) => {
  const { marketplace, enabled, configured } = req.body;

  if (!marketplace) {
    return res.status(400).json({ error: 'Marketplace é obrigatório' });
  }

  try {
    await pool.query(
      `
      INSERT INTO marketplace_configs
        (user_id, marketplace, enabled, configured)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, marketplace)
      DO UPDATE SET
        enabled = EXCLUDED.enabled,
        configured = EXCLUDED.configured,
        updated_at = NOW()
      `,
      [
        DEFAULT_MARKETPLACE_OWNER,
        marketplace,
        enabled ?? false,
        configured ?? false
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error('[Marketplace] Erro ao salvar config:', err);
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

router.get('/config/status', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT marketplace, enabled, configured
      FROM marketplace_configs
      WHERE user_id = $1
      `,
      [DEFAULT_MARKETPLACE_OWNER]
    );

    res.json(rows);

  } catch (err) {
    console.error('[Marketplace] Erro ao buscar config:', err);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

router.get('/mercadolivre/tag', (req, res) => {
  const userId = DEFAULT_MARKETPLACE_OWNER;
  const filePath = path.join(
    tagsDir,
    `${userId}_mercadolivre.json`
  );

  if (!fs.existsSync(filePath)) {
    return res.json({ tag: null });
  }

  const data = JSON.parse(fs.readFileSync(filePath));

  res.json({
    tag: data.tag || null
  });
});

module.exports = router;