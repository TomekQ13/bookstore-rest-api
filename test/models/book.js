const { expect } = require('chai')
const client = require('../../app/db')
const InvalidArgumentError = require('../../app/error')

const {
    getBook,
    getBooks,
    addBook,
    updateBook,
    deleteBook
} = require('../../app/models/book')

describe('Testing models book', () => {
    async function cleanup(id) {
        await client.query(`
            delete from book
            where id = $1
        `, [id])
    }

    describe('Testing addBook', () => {
        describe('Adding correct book', () => {
            const testingBook = {
                id: 'testingBook1',
                author: 'testingAuthor',
                price: 999,
                description: 'testing description',
                year_published: 1111
            }

            before(async () => {
                await cleanup(testingBook.id)
            })

            after(async () => {
                await cleanup(testingBook.id)
            })

            it('Selected book is equal to testing book', async () => {
                await addBook(testingBook)
                const resp = await client.query(`
                    select id, author, price, description, year_published
                    from book
                    where id = $1                
                `, [testingBook.id])
                expect(resp.rows.length).to.equal(1)
                const book = resp.rows[0]
                expect(book).to.deep.equal(testingBook)
            })

        })

        describe('Adding book with no Id', () => {
            const testingBook = {
                author: 'testingAuthor',
                price: 999,
                description: 'testing description',
                year_published: 1111
            }

            before(async () => {
                await cleanup(testingBook.id)
            })

            after(async () => {
                await cleanup(testingBook.id)
            })

            it('Coorect error message', async () => {
                let err = 0
                try {
                    await addBook(testingBook) 
                } catch (e) {
                    err = 1
                    expect(e.message = 'Id must be a string and longer than 0')
                }
                expect(err).to.equal(1)
            })
        })

        function makeNegativeAddBookTestCase({
            testingBook, testCaseTitle, itTitle
        }) {
            describe(testCaseTitle, () => {
                before(async () => {
                    await cleanup(testingBook.id)
                })
    
                after(async () => {
                    await cleanup(testingBook.id)
                })

                it(itTitle, async () => {
                    let err = 0
                    try {
                        await addBook(testingBook)
                    } catch (e) {
                        err = 1
                        expect(e instanceof InvalidArgumentError)
                    }
                    expect(err).to.equal(1)
                })
            })
        }

        makeNegativeAddBookTestCase({
            testingBook: {
            id: 'testingBook1',
            price: 999,
            description: 'testing description',
            year_published: 1111
        },
        testCaseTitle: 'Adding book with no author',
        itTitle: 'Correct error type'
        })
        makeNegativeAddBookTestCase({
            testingBook: {
            id: 'testingBook1',
            author: 'testingAuthor',
            price: -999,
            description: 'testing description',
            year_published: 1111
        },
        testCaseTitle: 'Adding book with negative price',
        itTitle: 'Correct error type'
        })
        makeNegativeAddBookTestCase({
            testingBook: {
            id: 'testingBook1',
            author: 'testingAuthor',
            price: 999,
            description: 'testing description'
        },
        testCaseTitle: 'Adding book without year_published',
        itTitle: 'Correct error type'
        })
        makeNegativeAddBookTestCase({
            testingBook: {
            id: 'testingBook1',
            author: undefined,
            price: 999,
            description: 'testing description'
        },
        testCaseTitle: 'Adding book with undefined author',
        itTitle: 'Correct error type'
        })
    })

    describe('Testing getBook', () => {
        const testingBook = {
            id: 'testingBook1',
            author: 'testingAuthor',
            price: 999,
            description: 'testing description',
            year_published: 1111
        }

        before(async () => {
            await cleanup(testingBook.id)
            await cleanup('testingBookThatDoesNotExist')
        })

        after(async () => {
            await cleanup(testingBook.id)
        })

        describe('Testing getting correct book', () => {
            it('Returned book is equal to testing book', async  () => {
                await addBook(testingBook)
                const book = await getBook({ bookId: testingBook.id })
                delete book.added_dttm
                expect(book).to.deep.equal(testingBook)
            })
        })

        describe('Testing getting book that does not exist', () => {
            it('Null is returned', async () => {
                const book = await getBook({ bookId: 'testingBookThatDoesNotExist' })
                expect(book).to.equal(null)
            })
        })
    })

    describe('Testing updateBook', () => {
        const testingBook = {
            id: 'testingBook1',
            author: 'testingAuthor',
            price: 999,
            description: 'testing description',
            year_published: 1111
        }

        
        before(async () => {
            await cleanup(testingBook.id)
            await addBook(testingBook)
        })

        after(async () => {
            await cleanup(testingBook.id)
        })

        describe('Updating book correctly', () => {
            const newPrice = 1999
            it('Correct response', async () => {
                const resp = await updateBook({
                    bookId: testingBook.id,
                    newAttributes: {
                        price: newPrice
                    }
                })
                expect(resp.rowCount).to.equal(1)
            })

            it('Book in the db has an updated price', async () => {
                const book = await getBook({ bookId: testingBook.id })
                expect(book.price).to.equal(newPrice)
            })
        })

        describe('Testing update with empty attributes', () => {
            it('Correct error', async () => {
                let err = 0
                try {
                    await updateBook({
                        bookId: testingBook.id,
                        newAttributes: {}
                    })
                } catch (e) {
                    err = 1
                    expect(e instanceof InvalidArgumentError)
                }
                expect(err).to.equal(1)
            })
        })

        describe('Update with a parameter that does not exist', () => {
            before(async () => {
                await cleanup(testingBook.id)
                await addBook(testingBook)
            })

            it('Correct error message', async () => {
                let err = 0
                try {
                    await updateBook({
                        bookId: testingBook.id,
                        newAttributes: {
                            weirdAttribute: 1234
                        }
                    })
                } catch (e) {
                    err = 1
                    expect(e instanceof InvalidArgumentError)
                }
                expect(err).to.equal(1)
            })

            it('Book remains unchanged', async () => {
                const book = await getBook({ bookId: testingBook.id })
                delete book.added_dttm
                expect(book).to.deep.equal(testingBook)
            })
        })

        describe('Update with multiple parameters and some that do not exist', () => {
            const newPrice = 9999
            const newAuthor = 'newAuthor'
            const newDescription = 'new description'

            before(async () => {
                await cleanup(testingBook.id)
                await addBook(testingBook)
            })

            after(async () => {
                await cleanup(testingBook.id)
            })

            it('Correct response', async () => {
                const resp = await updateBook({
                    bookId: testingBook.id,
                    newAttributes: {
                        price: newPrice,
                        author: newAuthor,
                        description: newDescription,
                        weirdAttribute: '123123132131'
                    }
                })
                expect(resp.rowCount).to.equal(1)
            })

            it('Book attributes were properly update', async () => {
                const book = await getBook({ bookId: testingBook.id })
                expect(book.price).to.equal(newPrice)
                expect(book.author).to.equal(newAuthor)
                expect(book.description).to.equal(newDescription)
                expect(book.year_published).to.equal(testingBook.year_published)
            })
        })
    })

    describe('Testing deleteBook', () => {
        const testingBook = {
            id: 'testingBook1',
            author: 'testingAuthor',
            price: 999,
            description: 'testing description',
            year_published: 1111
        }

        before(async () => {
            await cleanup(testingBook.id)
            await addBook(testingBook)
        })

        after(async () => {
            await cleanup(testingBook.id)
        })

        describe('Correct delete', () => {
            it('Correct response', async () => {
                const resp = await deleteBook({ bookId: testingBook.id })
                expect(resp.rowCount).to.equal(1)
            })

            it('Book does not exist', async () => {
                const book = await getBook({ bookId: testingBook.id })
                expect(book).to.equal(null)
            })
        })

        describe('Delete a book that does not exist', () => {
            async function getCount() {
                const count = await client.query(`
                    select count(*) as  count
                    from book
                `)
                return count.rows[0].count
            }

            it('Count before deleting is equal to count after deleting', async () => {
                const countBefore = await getCount()
                await deleteBook({ bookId: 'doesNotExist' })
                const countAfter = await getCount()
                expect(countAfter).to.equal(countBefore)
            })
        })


    })

    describe('Testing getBooks', () => {
        const testingBook1 = {
            id: 'testingBook1',
            author: 'testingAuthor1',
            price: 111,
            description: 'testing description',
            year_published: 1997
        }
        const testingBook2 = {
            id: 'testingBook2',
            author: 'testingAuthor2',
            price: 222,
            year_published: 1111
        }
        const testingBook3 = {
            id: 'testingBook3',
            author: 'testingAuthor3',
            price: 333,
            year_published: 2022
        }

        before(async () => {
            await Promise.all([
                cleanup(testingBook1.id),
                cleanup(testingBook2.id),
                cleanup(testingBook3.id)
            ])
            await Promise.all([
                addBook(testingBook1),
                addBook(testingBook2),
                addBook(testingBook3)
            ])
        })

        after(async () => {
            await Promise.all([
                cleanup(testingBook1.id),
                cleanup(testingBook2.id),
                cleanup(testingBook3.id)
            ])
        })

        describe('Testing if books are returned', () => {
            let books
            before(async () => {
                books = await getBooks({})
            })

            it('Book1 is the same as testing' , async () => {
                const book1 = books.filter(book => book.id === testingBook1.id)[0]
                delete book1.added_dttm
                expect(book1).to.deep.equal(testingBook1)
            })
            it('Book2 is the same as testing' , async () => {
                const book2 = books.filter(book => book.id === testingBook2.id)[0]
                delete book2.added_dttm
                delete book2.description
                expect(book2).to.deep.equal(testingBook2)
            })
            it('Book3 is the same as testing' , async () => {
                book3 = books.filter(book => book.id === testingBook3.id)[0]
                delete book3.added_dttm
                delete book3.description
                expect(book3).to.deep.equal(testingBook3)
            })
        })

        describe('Testing limit', () => {
            it('Correct number of results was returned', async () => {
                const limit = 2
                const books = await getBooks({ limit })
                expect(books.length).to.equal(limit)
            })

            it('Correct number of results was returned', async () => {
                const limit = 1
                const books = await getBooks({ limit })
                expect(books.length).to.equal(limit)
            })
        })

        describe('Testing sorting ascending', () => {
            it('Lowest price is returned',  async () => {
                const books = await getBooks({
                    sortBy: 'price',
                    desc: false
                })
                const minPrice = await client.query(`
                    select min(price) as minprice
                    from book
                `)
                expect(books[0].price).to.equal(minPrice.rows[0].minprice)
            })
        })

        describe('Testing sorting descending', () => {
            it('Lowest price is returned',  async () => {
                const books = await getBooks({
                    sortBy: 'price',
                    desc: true
                })
                const maxPrice = await client.query(`
                    select max(price) as maxprice
                    from book
                `)
                expect(books[0].price).to.equal(maxPrice.rows[0].maxprice)
            })
        })

        describe('Testing offset', () => {
            const limit = 1
            it('Correct year_published returned', async () => {
                const books = await getBooks({
                    limit,
                    sortBy: 'year_published',
                    desc: true,
                    offset: 1
                })
                const yearPublished = await client.query(`
                    select year_published
                    from book
                    order by year_published desc
                    limit $1 offset 1
                `, [limit])
                expect(books[0].year_published).to.equal(yearPublished.rows[0].year_published)
            })
        })


    })


})