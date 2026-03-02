const router = require('express').Router()
const controller = require('../controllers/nicheGroupController')

router.get('/:sessionId', controller.listBySession)
router.post('/:sessionId', controller.register)
router.delete('/:sessionId', controller.remove)

module.exports = router
