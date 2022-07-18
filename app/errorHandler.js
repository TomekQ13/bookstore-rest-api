const { logger } = require("./loggers");
const { errorMailer } = require('./mailer')

async function errorHandler(err, req, res, next) {
    let mail
    try {
        mail = errorMailer.sendMail({
            from: 'contact@neverforgetit.net',
            to: 'kuczak.tomasz@gmail.com',
            subject: 'REST API Error',
            text: 'There has been an error in the bookstore REST API',
            html: '<p>There has been an error in the bookstore REST API<p>'
        })
        logger.error(`Message sent`)
    } catch (e) {
        logger.error(e)
    }

    res.status(500).json({ message: 'There was an internal server error. Please try again.' })
}

module.exports = { errorHandler }