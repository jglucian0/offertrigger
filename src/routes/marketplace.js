const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const tagsDir = path.resolve(__dirname, '../../uploads/tags');

if (!fs.existsSync(tagsDir)) {
  fs.mkdirSync(tagsDir, { recursive: true });
}

router.post('/mercadolivre/tag', (req, res) => {
  const userId = String(req.body.userId || '').trim();
  const tag = String(req.body.tag || '').trim();

  if (!userId || !tag) {
    return res.status(400).json({
      error: 'userId e tag são obrigatórios'
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

module.exports = router;