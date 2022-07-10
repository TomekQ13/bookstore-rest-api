const client = require('../db')
const InvalidArgumentError = require('../error')
const { logger } = require('../loggers')

const bookAttributesArray = ['id', 'author', 'price', 'description', 'year_published', 'added_dttm']
const insertBookAttrbiutes = bookAttributesArray.slice(0, -1).join(', ')
const selectBookAttributes = bookAttributesArray.join(', ')

async function getBooks({ limit, offset, sortBy, desc }) {
    validate(limit !== undefined && isNaN(+limit) === true, 'Limit must be a number if defined')
    validate(offset !== undefined && isNaN(+offset) === true, 'Offset must be a number if defined')
    validate(sortBy !== undefined && bookAttributesArray.includes(sortBy) === false, 'sortBy must be a book attribute')
    validate(desc !== undefined && typeof desc !== 'boolean', 'desc must be a boolean if defined')

    let query = `
        select ${selectBookAttributes}
        from book
    `

    let bindVariables = []

    if (sortBy !== undefined) {
        query = query + ` order by ${sortBy}`
    } else {
        query = query + ` order by added_dttm`
    }

    if (desc !== false) {
        query = query + ` desc`
    }

    if (limit !== undefined) {
        query = query + ` limit $${bindVariables.length + 1}`
        bindVariables.push(+limit)
    }

    if (offset !== undefined) {
        query = query + ` offset $${bindVariables.length + 1}`
        bindVariables.push(+offset)
    }

    let results
    try {
        results = await client.query(query, bindVariables)
    } catch (e) {
        logger.error(e)
        return undefined
    }

    return results.rows
}

async function getBook({ bookId }) {
    if (typeof bookId !== 'string') return undefined

    const query = `
        select ${selectBookAttributes}
        from book
        where id = $1
    `

    let results
    try {
        results = await client.query(query, [bookId])
    } catch (e) {
        logger.error(e)
        return undefined
    }

    if (results.rowCount === 0) return null

    return results.rows[0]
}

function validate(expression, errorMessage) {
    if (expression) throw new InvalidArgumentError(errorMessage)
}

function makeValidation(attribute, value) {
    switch(attribute) {
        case 'author':
            validate(typeof value !== 'string' || value.length === 0, 'Author must be a string and longer than 0')
            break
        case 'price':
            validate(typeof value !== 'number' || value < 0, 'Price must be a number and must be larger or equal than 0')
            break
        case 'description':
            validate(value !== undefined && typeof value !== 'string', 'Description mmust be a string if exists')
            break
        case 'year_published':
            validate(typeof value !== 'number' || value < 0, 'Year must be larger than 0')
            break
        default:
            logger.error('Unknown attribute value')
    }
}

async function addBook({ id, author, price, description, year_published }) {
    if (typeof id !== 'string' || id.length === 0) throw new Error('Id must be a string and longer than 0')
    makeValidation('author', author)
    makeValidation('price', price)
    makeValidation('year_published', year_published)
    makeValidation('description', description)

    let resp
    try {
        resp = await client.query(`
            insert into book (${insertBookAttrbiutes})
            values ($1, $2, $3, $4, $5)
        `, [id, author, price, description, year_published])
    } catch (e) {
        logger.error(e)
        return undefined
    }

    return resp
}

async function updateBook({ bookId, newAttributes }) {
    if (typeof bookId !== 'string' || bookId.length === 0) throw new Error('Id must be a string and longer than 0')
    validate(typeof newAttributes !== 'object', 'New attibutes must be provided as an object')

    const validAttributes = Object.keys(newAttributes).filter(element => bookAttributesArray.includes(element))
    validate(validAttributes.length === 0, 'At least one valid attribute to update must be provided')

    let query = `update book set `
    let bindVariables = [bookId]
    validAttributes.forEach((attribute, i, keys) => {
        makeValidation(attribute, newAttributes[attribute])
        query = query + ` ${attribute} = $${i+2}`
        bindVariables.push(newAttributes[attribute])
        if (i < keys.length - 1) query = query + ', '
    })

    query = query + ` where id = $1 `
    let resp
    try {
        resp = await client.query(query, bindVariables)
    } catch (e) {
        logger.error(e)
        return undefined
    }

    return resp
}

async function deleteBook({ bookId }) {
    if (typeof bookId !== 'string') return undefined

    let resp
    try {
        resp = await client.query(`
            delete from book
            where id = $1
        `, [bookId])
    } catch (e) {
        logger.error(e)
        return undefined
    }
    return resp
}

module.exports = {
    getBook,
    getBooks,
    addBook,
    updateBook,
    deleteBook
}