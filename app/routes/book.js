                        
const { v4: uuidv4 } = require('uuid')

const InvalidArgumentError = require('../error')
const { logger } = require('../loggers')
const { getBooks, getBook, addBook, updateBook, deleteBook } = require('../models/book')


const router = require('express').Router()
/** 
* @swagger
* components:
*   schemas:
*     Book:
*       type: object
*       required:
*         - title
*         - author
*         - price
*         - year_published
*       properties:
*         id:
*           type: string
*           description: 'The auto-generated UUID of the book'
*         author:
*           type: string
*           description: 'The author of the book'
*         price:
*           type: integer
*           description: 'The price of the book'
*         description:
*           type: string
*           description: 'The description of the book'
*         year_published:
*           type: integer
*           description: 'The year the book was published'
*   responses:
*     "400":
*       description: Missing API key
*       contents:
*         application/json
*     "401":
*       description: 'Unauthorized - incorrect API key or incorrect format. Please use: Basic API_KEY'
*       contents:
*         application/json
*
*/ 

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: API to manage books
 */

/** 
 * @swagger
 *   /:
 *     get:
 *       summary: Get all books
 *       tags: [Books]
 *       responses:
 *         "200":
 *           description: The list of books
 *           contents:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Book'
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 */
router.get('/', async (req, res) => {
    const {
        limit, offset, sortBy
    } = req.query
    const desc = req.query.desc !== undefined ? true : false

    let books
    try {
        books = await getBooks({ limit, offset, sortBy, desc })
    } catch (e) {
        logger.error(e)
        if (e instanceof InvalidArgumentError) return res.status(400).json({ message: e.message })
        return res.sendStatus(500)
    }

    if (books === undefined) return res.sendStatus(500)

    res.json(books)

})

router.get('/:bookId', async (req, res) => {
    const bookId = req.params.bookId

    let book
    try {
        book = await getBook({ bookId })
    } catch (e) {
        logger.error(e)
        return res.sendStatus(500)
    }

    if (book === undefined) return res.sendStatus(500)
    if (book === null) return res.sendStatus(404)

    res.json(book)
})

router.post('/', async (req, res) => {
    const {
        author,
        price,
        description,
        year_published
    } = req.body

    let resp
    const id = uuidv4()
    try {        
        resp = await addBook({ id, author, price, description, year_published })
    } catch (e) {
        logger.error(e)
        if (e instanceof InvalidArgumentError) return res.status(400).json({ message: e.message })
        return res.sendStatus(500)
    }

    if (resp === undefined) return res.sendStatus(500)
    res.status(201).json({ id, message: 'Book has been created' })
})

router.patch('/:bookId', async (req, res) => {
    const bookId = req.params.bookId
    if (bookId === undefined) return res.status(404).json({ message: 'BookId is missing' })

    const newAttributes = req.body
    delete newAttributes.id

    let resp
    try {
        resp = await updateBook({ bookId, newAttributes })
    } catch (e) {
        logger.error(e)
        if (e instanceof InvalidArgumentError) return res.status(400).json({ message: e.message })
        return res.sendStatus(500)
    }

    if (resp.rowCount === 0) return res.sendStatus(404)
    if (resp === undefined) return res.sendStatus(500)
    res.sendStatus(204)
})

router.delete('/:bookId', async  (req, res) => {
    const bookId = req.params.bookId
    let resp
    try {
        resp = await deleteBook({ bookId })
    } catch (e) {
        logger.error(e)
        return res.sendStatus(500)
    }
    if (resp.rowCount === 0) return res.sendStatus(404)
    if (resp === undefined) return res.sendStatus(500)
    res.sendStatus(204)
})

module.exports = router