const express = require('express');
const cors = require('cors');
const sessionController = require('./controllers/sessionController');
const messageController = require('./controllers/messageController');
const affiliateController = require('./controllers/affiliateController');
const offerController = require('./controllers/offerController');
const { manager, wppService } = require('./controllers/sessionController');

manager.loadExistingSessions();

for (const session of manager.sessions.values()) {
  wppService.initSession(session.id);
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Servidor online' });
});

app.post('/session/start', sessionController.startSession);
app.get('/session/status/:userId', sessionController.checkStatus);
app.delete('/session/:userId', sessionController.deleteSession);
app.get('/session/list', sessionController.listSessions);

app.post('/message/send', messageController.sendMessage);

app.get('/session/groups/:userId', sessionController.getGroups);

app.post('/affiliate/generate', affiliateController.generateLink);
app.get('/offers', offerController.listOffers);
app.delete("/offers/:id", offerController.deleteOffer);
app.put("/offers/:id", offerController.updateOffer);

app.use('/storage', express.static('/home/jgluciano/offertrigger/storage'));
app.use('/dispatch-config', require('./routes/dispatch'));


module.exports = app;