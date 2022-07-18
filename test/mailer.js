const { expect } = require("chai")
const Mail = require('nodemailer/lib/mailer')
const chai = require('chai')
const chaiHttp = require('chai-http')
const fs = require('fs')

const app = require("../app/app")
const { errorHandler } = require("../app/errorHandler")
const { errorMailer } = require('../app/mailer')
const { logsFolder } = require('../app/loggers')

chai.use(chaiHttp)

describe('Testing mailer', () => {
    describe('Correct export', () => {
        it('Mailer instanceof  Mail', () => {
            expect(errorMailer instanceof Mail).to.true
        })
    })

    describe('Sending email on error', () => {
        before(() => {
            app.get('/mailerror', (req, res) => {
                throw new Error(errorMessage)
            })

            app.use(errorHandler)
        })

        it('Email sent on error', (done) => {
            chai.request(app)
            .get('/mailerror')
            .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
            .end((_err, _res) => {
                fs.readFile(`${logsFolder}logs.log`, (err, data) => {
                    if (err) throw err
                    expect(data.includes('Message sent'))
                    done()
                })
            })
        })
    })
})