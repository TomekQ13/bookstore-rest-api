const client = require("../db")
const { logger } = require("../loggers")

async function isApiKeyValid({ apiKey }) {
    if (typeof apiKey !== 'string') return undefined

    let resp
    try {
        resp = await client.query(`
            select 1
            from api_key
            where api_key = $1
                and valid_to_dttm > now()
        `, [apiKey])
    } catch (e) {
        logger.error(e)
        return undefined
    }

    if (resp.rowCount === 0) return false
    return true
}

module.exports = isApiKeyValid