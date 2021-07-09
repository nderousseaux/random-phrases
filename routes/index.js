const Phrase = require('../utils/fonctions.js')
const router = require('express').Router()

router.get('/', function (req, res) {
  let min_length = parseInt(req.query.min_length) || 0
  let max_length = parseInt(req.query.max_length) || 999999999
  let phrase = ''
  let i = 0

  // Testing the consistency of query param

  if (min_length > max_length){
    return res.status(400).json(
      { error: "min_length cannot be upper than max_length"}
    )
  }

  //Generating sentence
  do{
    phrase = Phrase().corps
    i += 1

    // If no sentence was found
    if (i > 10000){
      return res.status(400).json(
        { error: "no sentence was found"}
      )
    }
  } while(
    min_length>phrase.length ||
    max_length<phrase.length
  )

  res.send(phrase)
})

module.exports = router
