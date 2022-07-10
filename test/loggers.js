const { format } = require('winston')
const chai = require('chai')
const chaiHttp = require('chai-http')
const fs = require('fs')
const { expect } = require('chai')
const expressWinston = require('express-winston')

const app = require('../app/app')
const { logger, logsFolder } = require('../app/loggers')

chai.use(chaiHttp)


describe('Testing loggers', () => {

    function cleanup() {
        fs.truncateSync(`${logsFolder}logs.log`)
        fs.truncateSync(`${logsFolder}requestInfo.log`)
        fs.truncateSync(`${logsFolder}requestWarnings.log`)
        fs.truncateSync(`${logsFolder}requestErrors.log`)
    }

    before(() => {
        cleanup()
    })

    describe('Testing logger', () => {
        before(() => {
            logger.format = format.combine(
                format.timestamp(),
                format.json()
            )
        })
        it('Info logger writes to a file', () => {
            const testMessage = 'This is a test info message !@#$%^&*('
            logger.info(testMessage)
            fs.readFile(`${logsFolder}logs.log`, (err, data) => {
                if (err) throw err
                const includes = data.includes(`"level":"info","message":"${testMessage}"`)
                expect(includes).to.true
            })
        })

        it('Warning logger writes to a file', () => {
            const testMessage = 'This is a test warning message !@#$%^&*('
            logger.warn(testMessage)
            fs.readFile(`${logsFolder}logs.log`, (err, data) => {
                if (err) throw err
                const includes = data.includes(`"level":"warn","message":"${testMessage}"`)
                expect(includes).to.true
            })
        })

        it('Warning logger writes to a file', () => {
            const testMessage = 'This is an error message !@#$%^&*('
            logger.error(testMessage)
            fs.readFile(`${logsFolder}logs.log`, (err, data) => {
                if (err) throw err
                const includes = data.includes(`"level":"error","message":"${testMessage}"`)
                expect(includes).to.true
            })
        })
    })

    describe('Testing request logger', () => {
        it('Warning request is logged to a file', (done) => {
            chai.request(app)
            .get('/book/doesnotexist')
            .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
            .end((_err, _res) => {
                fs.readFile(`${logsFolder}requestWarnings.log`, (err, data) => {
                    if (err) throw err
                    const includes = data.includes(`url: '/book/doesnotexist'`)
                    expect(includes).to.true
                    done()
                })
            })
        })

        it('Error request is logged to a file', (done) => {
            const errorMessage = 'this is a testing error message from an endpoint'
            app.get('/testingErrorRoute', (req, res) => {
                res.status(500).json({errorMessage})
            })

            chai.request(app)
            .get('/testingErrorRoute')
            .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
            .end((_err, _res) => {
                fs.readFile(`${logsFolder}requestErrors.log`, (err, data) => {
                    if (err) throw err
                    const includes = data.includes(errorMessage)
                    expect(includes).to.true
                    done()
                })
            })
        })

        it('Info request is logged to a file', (done) => {
            chai.request(app)
            .get('/book')
            .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
            .end((_err, _res) => {
                fs.readFile(`${logsFolder}requestInfo.log`, (err, data) => {
                    if (err) throw err
                    const includes = data.includes(`url: '/book'`)
                    expect(includes).to.true
                    done()
                })
            })
        })
    })

    describe('Testing error logger', () => {
        const errorMessage = 'This is a thrown error message'
        before(() => {
            app.get('/testingThrowError', (req, res) => {
                throw new Error(errorMessage)
            })

            app.use(expressWinston.errorLogger({
                winstonInstance: logger
            }))

            try {
                chai.request(app)
                .get('/testingThrowError')
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, _res) => {
                })
            } catch {
                return
            }
        })

        it('Error logger logs a message to a file', (done) => {
            fs.readFile(`${logsFolder}logs.log`, (err, data) => {
                if (err) throw err
                const includes = data.includes(errorMessage)
                expect(includes).to.true
                done()
            })
        })
    })
})