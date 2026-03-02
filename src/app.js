require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

//Controllers
const sessionController = require('./controllers/sessionController');
const { manager, wppService } = sessionController;

const messageController = require('./controllers/messageController');
const affiliateController = require('./controllers/affiliateController');
const offerController = require('./controllers/offerController');
const nicheGroupController = require('./controllers/nicheGroupController');



//Session Boot
manager.loadExistingSessions();

for (const session of manager.sessions.values()) {
  wppService.initSession(session.id);
}

const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Health / Base
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Servidor online' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

//Session Routes
app.use('/session', require('./routes/session.routes'));

//Message
app.post('/message/send', messageController.sendMessage);

//Affiliate / Offers
app.post('/affiliate/generate', affiliateController.generateLink);

app.use('/offers', require('./routes/offers.routes'));

//Niche Groups
app.use('/niche-groups', require('./routes/nicheGroups.routes'));

//External Routes
app.use('/dispatch', require('./routes/dispatch'));
app.use('/cookies', require('./routes/cookies'));
app.use('/marketplace', require('./routes/marketplace'));

//Static Files
app.use(
  '/uploads',
  express.static(path.resolve(__dirname, '../uploads'))
);

module.exports = app;
