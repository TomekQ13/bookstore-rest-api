const nodemailer = require('nodemailer')

errorMailer = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'contact@neverforgetit.net',
        pass: process.env.EMAIL_PASS
    }
})

module.exports = { errorMailer }