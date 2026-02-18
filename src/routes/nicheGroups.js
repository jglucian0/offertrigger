const router = require('express').Router()
const controller = require('../controllers/nicheGroupController')

router.get('/', controller.list)
router.post('/', controller.register)
router.delete('/', controller.remove)

module.exports = router
