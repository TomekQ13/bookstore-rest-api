const express = require('express')
const expressWinston = require('express-winston')

const bookRouter = require('./routes/book')
const checkApiKey = require('./auth')
const { logger, requestLogger } = require('./loggers')

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(checkApiKey)

app.use(expressWinston.logger({
    winstonInstance: requestLogger,
    statusLevels: true
}))

expressWinston.requestWhitelist.push('body')
expressWinston.responseWhitelist.push('body')

app.use('/book', bookRouter)

app.use(expressWinston.errorLogger({
    winstonInstance: logger
}))

app.listen(3000)

module.exports = app
