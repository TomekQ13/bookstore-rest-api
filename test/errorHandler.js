const { expect } = require('chai')
const chai = require('chai')
const chaiHttp = require('chai-http')

const app = require("../app/app")
const { errorHandler } = require("../app/errorHandler")

chai.use(chaiHttp)

describe('Testing error hanlder', () => {
    const errorMessage = 'Custom error to test error handler'
    before(() => {
        app.get('/errorhandler', (req, res) => {
            throw new Error(errorMessage)
        })

        app.use(errorHandler)
    })

    it('Correct response after error received', (done) => {
        chai.request(app)
        .get('/errorhandler')
        .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
        .end((_err, res) => {
            expect(res).to.have.status(500)
            expect(res.body.message).to.equal('There was an internal server error. Please try again.')
            done()
        })
    })


})