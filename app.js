const express = require('express')
const app = express()

app.use(require('./routes'))

app.listen(3000, function () {
  console.log('Server running on localhost:3000')
})
