const express = require('express');
const cors = require('cors');
const sessionController = require('./controllers/sessionController');
const messageController = require('./controllers/messageController');
const affiliateController = require('./controllers/affiliateController');
//onst dispatchController = require('./controllers/dispatchController');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Servidor online' });
});

app.post('/session/start', sessionController.startSession);

app.get('/session/session/:userId', sessionController.checkStatus);

app.post('/message/send', messageController.sendMessage);

app.get('/session/groups/:userId', sessionController.getGroups);

app.post('/affiliate/generate', affiliateController.generateLink);

//app.post('/dispatch/send', dispatchController.send);

module.exports = app;