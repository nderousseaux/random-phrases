const Phrase = require('../utils/fonctions.js').phrase
const router = require('express').Router()

router.get('/', function (req, res) {
  res.send(Phrase().corps)
})

module.exports = router
