const express = require('express');
const cors = require('cors');
const path = require('path')
const sessionController = require('./controllers/sessionController');
const messageController = require('./controllers/messageController');
const affiliateController = require('./controllers/affiliateController');
const offerController = require('./controllers/offerController');
const { manager, wppService } = require('./controllers/sessionController');
const nicheGroupController = require('./controllers/nicheGroupController');


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


app.use('/dispatch', require('./routes/dispatch'));


app.get('/niche-groups/:sessionId', nicheGroupController.listBySession)
app.post('/niche-groups/:sessionId', nicheGroupController.register)
app.delete('/niche-groups/:sessionId', nicheGroupController.remove)
app.use('/niche-groups', require('./routes/nicheGroups'))

app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
)

module.exports = app;