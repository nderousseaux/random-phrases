const Phrase = require('../utils/fonctions.js')
const router = require('express').Router()

router.get('/', function (req, res) {
  const minLength = parseInt(req.query.minLength) || 0
  const maxLength = parseInt(req.query.maxLength) || 999999999
  let phrase = ''
  let i = 0

  // Testing the consistency of query param

  if (minLength > maxLength) {
    return res.status(400).json(
      { error: 'minLength cannot be upper than maxLength' }
    )
  }

  // Generating sentence
  do {
    phrase = Phrase().corps
    i += 1

    // If no sentence was found
    if (i > 10000) {
      return res.status(400).json(
        { error: 'no sentence was found' }
      )
    }
  } while (
    minLength > phrase.length ||
    maxLength < phrase.length
  )

  res.send(phrase)
})

module.exports = router
