const express = require('express')
const expressWinston = require('express-winston')
const swaggerJsdoc = require("swagger-jsdoc")
const swaggerUi = require("swagger-ui-express");

const bookRouter = require('./routes/book')
const checkApiKey = require('./auth')
const { logger, requestLogger } = require('./loggers')
const { errorHandler } = require('./errorHandler');
const options = require('./swagger');

const app = express()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(expressWinston.logger({
    winstonInstance: requestLogger,
    statusLevels: true
}))

expressWinston.requestWhitelist.push('body')
expressWinston.responseWhitelist.push('body')


bookRouter.use(checkApiKey)
app.use('/book', bookRouter)

app.use(expressWinston.errorLogger({
    winstonInstance: logger
}))

app.use(errorHandler)

const specs = swaggerJsdoc(options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
)

app.listen(3000)

module.exports = app
