const express = require('express')

const bookRouter = require('./routes/book')
const checkApiKey = require('./auth')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(checkApiKey)

app.use('/book', bookRouter)

app.listen(3000)

module.exports = app
