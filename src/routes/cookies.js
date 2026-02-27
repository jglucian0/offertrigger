const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.resolve(__dirname, '../../uploads/cookies');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const { DEFAULT_MARKETPLACE_OWNER } = require('../config/appConfig');
    const userId = DEFAULT_MARKETPLACE_OWNER;

    cb(null, `${userId}_mercadolivre.txt`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname) !== '.txt') {
      return cb(new Error('Apenas arquivos .txt são permitidos'));
    }
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 } // 1MB
});

router.post('/upload', upload.single('cookieFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo não enviado'
      });
    }

    if (req.file.size === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Arquivo vazio'
      });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');

    if (!content.includes('ssid')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        error: 'Cookie inválido (ssid não encontrado)'
      });
    }

    return res.status(200).json({
      message: 'Arquivo enviado com sucesso'
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Erro ao processar arquivo'
    });
  }
});

module.exports = router;