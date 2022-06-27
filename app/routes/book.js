const { v4: uuidv4 } = require('uuid')

const InvalidArgumentError = require('../error')
const { getBooks, getBook, addBook, updateBook, deleteBook } = require('../models/book')


const router = require('express').Router()

router.get('/', async (req, res) => {
    const {
        limit, offset, sortBy
    } = req.query
    const desc = req.query.desc !== undefined ? true : false

    let books
    try {
        books = await getBooks({ limit, offset, sortBy, desc })
    } catch (e) {
        console.error(e)
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
        console.error(e)
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
        console.error(e)
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
        console.error(e)
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
        console.error(e)
        return res.sendStatus(500)
    }
    if (resp.rowCount === 0) return res.sendStatus(404)
    if (resp === undefined) return res.sendStatus(500)
    res.sendStatus(204)
})

module.exports = router