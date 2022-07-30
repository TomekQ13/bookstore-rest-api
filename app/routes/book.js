                        
const { v4: uuidv4 } = require('uuid')

const InvalidArgumentError = require('../error')
const { logger } = require('../loggers')
const { getBooks, getBook, addBook, updateBook, deleteBook } = require('../models/book')
const checkApiKey = require('../auth')

const router = require('express').Router()
router.use(checkApiKey)

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: API to manage books
 */

/** 
 * @swagger
 *   /book:
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

/** 
 * @swagger
 *   /book/{id}:
 *     get:
 *       summary: Get a book by id
 *       tags: [Books]
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: Id of a book
 *       responses:
 *         "200":
 *           description: The book
 *           contents:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Book'
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "404":
 *           $ref: '#/components/responses/404'
 */
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

/** 
 * @swagger
 *   /book:
 *     post:
 *       summary: Create a book
 *       tags: [Books]
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       responses:
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "201":
 *           description: Book created successfully
 *           contents:
 *             application/json
 */
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
/** 
 * @swagger
 *   /book/{id}:
 *     patch:
 *       summary: Create a book
 *       tags: [Books]
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: Id of a book
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *               required:
 *       responses:
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "204":
 *           description: Book updated successfully
 *           contents:
 *             application/json
 */
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

/** 
 * @swagger
 *   /book/{id}:
 *     delete:
 *       summary: Delete a book
 *       tags: [Books]
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: Id of a book
 *       responses:
 *         "400":
 *           $ref: '#/components/responses/400'
 *         "401":
 *           $ref: '#/components/responses/401'
 *         "204":
 *           description: Book deleted successfully
 *           contents:
 *             application/json
 */
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