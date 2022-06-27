const { expect } = require('chai')
const { Client } = require('pg')

const client = require('../app/db')

describe('Testing client', () => {
    it('Exported client is instanceof pg Client', () => {
        expect(client instanceof Client).to.true
    })
})