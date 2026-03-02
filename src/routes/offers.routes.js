const express = require('express');
const router = express.Router();

const offerController = require('../controllers/offerController');

router.get('/', offerController.listOffers);
router.delete('/:id', offerController.deleteOffer);
router.put('/:id', offerController.updateOffer);
router.put('/:id/migrate', offerController.migrateOffer);

module.exports = router;