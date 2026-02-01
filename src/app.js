const express = require('express');
const cors = require('cors');
const sessionController = require('./controllers/sessionController');
const messageController = require('./controllers/messageController');

const app = express();

app.use(cors());
app.use(express.json()); // Esta linha permite que o Express entenda JSON no body
app.use(express.urlencoded({ extended: true })); // Opcional: para dados de formulário

// Rota Raiz
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Servidor online' });
});

// --- Rotas de Sessão (Milestone 1) ---

// Inicia o processo de conexão (POST)
app.post('/session/start', sessionController.startSession);

// Consulta o status e pega o QR Code (GET)
app.get('/session/status/:userId', sessionController.checkStatus);

app.post('/message/send', messageController.sendMessage);

app.get('/session/groups/:userId', sessionController.getGroups);

module.exports = app;