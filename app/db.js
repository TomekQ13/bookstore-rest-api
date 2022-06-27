const { Client } = require('pg')

const client = new Client({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST
})

client.connect()
client.query('select now()').then(
    res => console.log('Connected to the db ' + res.rows[0].now)
)

module.exports = client