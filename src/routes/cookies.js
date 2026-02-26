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
    const userId = req.body.userId;

    if (!userId) {
      return cb(new Error('userId é obrigatório'));
    }

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
  res.status(200).json({ message: 'Arquivo enviado com sucesso' });
});

module.exports = router;