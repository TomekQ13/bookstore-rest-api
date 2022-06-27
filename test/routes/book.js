const chai = require('chai')
const { expect } = require('chai')
const chaiHttp = require('chai-http')

const app = require('../../app/app')
const client = require('../../app/db')
const { getBook } = require('../../app/models/book')

chai.use(chaiHttp)

describe('Testing API endpoints', () => {
    const testingBook1 = {
        author: 'testingAuthor1',
        price: 111,
        description: 'testing description',
        year_published: 1997
    }
    const testingBook2 = {
        author: 'testingAuthor2',
        year_published: 1111
    }
    const testingBook3 = {
        author: 'testingAuthor3',
        price: 333,
        year_published: 2022
    }
    const testingBook4 = {
        author: 'testingAuthor4',
        price: 444,
        year_published: 2002
    }


    async function cleanup() {
        await client.query(`
            delete from book
            where author in ($1, $2, $3)
        `, [testingBook1.author, testingBook2.author, testingBook3.author])

    }

    after(async () => {
        await cleanup()
    })

    function addBook({ testingBook, endCallback }) {
        chai.request(app)
        .post('/book')
        .send(testingBook)
        .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
        .end(endCallback)
    }

    describe('Testing POST book', () => {
        before(async () => {
            await cleanup()
        })

        describe('Test adding correct book', () => {
            it('Correct response status', (done) => {
                addBook({ 
                    testingBook: testingBook1,
                    endCallback: (_err, res) => {
                        expect(res).to.have.status(201)
                        expect(res.body).to.have.property('id')
                        testingBook1.id = res.body.id
                        done()
                    }
                 })
            })

            it('Created book is equal to the testing book', async () => {
                const book = await getBook({ bookId: testingBook1.id })
                delete book.added_dttm
                expect(testingBook1).to.deep.equal(book)
            })
        })

        describe('Testing adding book without a price', () => {
            let countBefore
            before(async () => {
                const resp = await client.query(`
                    select count(*) as count
                    from book
                `)
                countBefore = resp.rows[0].count
            })

            it('Correct response status', (done) => {
                addBook({ 
                    testingBook: testingBook2,
                    endCallback: (_err, res) => {
                        expect(res).to.have.status(400)
                        done()
                    }
                 })
            })

            it('Count after is equal to count before = no new books created', async () => {
                const resp = await client.query(`
                    select count(*) as count
                    from book
                `)
                expect(resp.rows[0].count).to.equal(countBefore)
            })
        })
    })

    describe('Testing GET book', () => {
        describe('Testing getting book that exists', () => {
            it('Fetched book is equal to testing book', (done) => {
                chai.request(app)
                .get(`/book/${testingBook1.id}`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    delete res.body.added_dttm
                    expect(res.body).to.deep.equal(testingBook1)
                    done()
                })
            })
        })
        
        describe('Testing getting book that does not exist', () => {
            it('Correct response code', (done) => {
                chai.request(app)
                .get('/book/doesnotexist')
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    expect(res).to.have.status(404)
                    done()
                })
            })
        })
    })

    describe('Testing GET multiple books', () => {
        before(async () => {
            await Promise.all([
                addBook({ testingBook: testingBook3 }),
                addBook({ testingBook: testingBook4 })
            ])
        })

        describe('Test limit', () => {
            it('Correct number of books fetched', (done) => {
                chai.request(app)
                .get('/book?limit=2')
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    expect(res.body.length).to.equal(2)
                    done()
                })
            })
        })

        describe('Testing sortBy', () => {
            describe('Testing ascending', () => {
                let author
                before(async () => {
                    const resp = await client.query(`
                        select author
                        from book
                        order by author
                    `)
                    author = resp.rows[0].author
                })

                it('Author is equal to the selected author', (done) => {
                    chai.request(app)
                    .get(`/book?sortBy=author&limit=1`)
                    .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                    .end((_err, res) => {
                        expect(res.body.length).to.equal(1)
                        expect(res.body[0].author).to.equal(author)
                        done()
                    })
                })
            })

            describe('Testing descending', () => {
                let author
                before(async () => {
                    const resp = await client.query(`
                        select author
                        from book
                        order by author desc
                    `)
                    author = resp.rows[0].author
                })

                it('Author is equal to the selected author', (done) => {
                    chai.request(app)
                    .get(`/book?sortBy=author&limit=2&desc`)
                    .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                    .end((_err, res) => {
                        expect(res.body.length).to.equal(2)
                        expect(res.body[0].author).to.equal(author)
                        done()
                    })
                })
            })
        })

        describe('Test offset', () => {
            let price
            before(async () => {
                const resp = await client.query(`
                    select price
                    from book
                    order by price
                    limit 1 offset 1
                `)
                price = resp.rows[0].price
            })

            it('Selected price is equal to second lowest price', (done) => {
                chai.request(app)
                .get(`/book?sortBy=price&offset=1&limit=1`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    expect(res.body[0].price).to.equal(price)
                    done()
                })
            })
        })
    })

    describe('Testing PATCH book', () => {
        describe('Updating an existing book', () => {
            it('Correct response code', (done) => {
                const newPrice = 222
                const newDescription = 'this is updated description'
                chai.request(app)
                .patch(`/book/${testingBook1.id}`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .send({
                    price: newPrice,
                    description: newDescription
                })
                .end((_err, res) => {
                    expect(res).to.have.status(204)
                    testingBook1.price = newPrice
                    testingBook1.description = newDescription
                    done()
                })
            })

            it('Book is equal to updated book', async () => {
                const book = await getBook({ bookId: testingBook1.id })
                delete book.added_dttm
                expect(book).to.deep.equal(testingBook1)
            })
        })

        describe('Testing updating a book that does not exist', () => {
            it('Correct response code', (done) => {
                const newPrice = 222
                const newDescription = 'this is updated description'
                chai.request(app)
                .patch(`/book/doesnotexist`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .send({
                    price: newPrice,
                    description: newDescription
                })
                .end((_err, res) => {
                    expect(res).to.have.status(404)
                    testingBook1.price = newPrice
                    testingBook1.description = newDescription
                    done()
                })
            })
        })

        describe('Testing updating id', () => {
            it('Correct response code', (done) => {
                const year_published = 2222
                chai.request(app)
                .patch(`/book/${testingBook1.id}`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .send({
                    year_published: year_published,
                    id: 'changedId'
                })
                .end((_err, res) => {
                    expect(res).to.have.status(204)
                    testingBook1.year_published = year_published
                    done()
                })
            })

            it('Id remains unchanged', async () => {
                const book = await getBook({ bookId: testingBook1.id })
                expect(book).to.not.equal(null)
            })
        })

    })

    
    describe('Testing DELETE book', () => {
        describe('Deleting an existing book', () => {
            it('Correct response code', (done) => {
                chai.request(app)
                .delete(`/book/${testingBook1.id}`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    expect(res).to.have.status(204)
                    done()
                })
            })

            it('Book does not exist', async () => {
                const book = await getBook({ bookId: testingBook1.id })
                expect(book).to.equal(null)
            })
        })

        describe('Deleting a book that does not exist', () => {
            let countBefore
            before(async () => {
                const resp = await client.query(`
                    select count(*) as count
                    from book
                `)
                countBefore = resp.rows[0].count
            })

            it('Correct response code', (done) => {
                chai.request(app)
                .delete(`/book/doesnotexist`)
                .set('Authorization', `Basic ${process.env.TESTING_API_KEY}`)
                .end((_err, res) => {
                    expect(res).to.have.status(404)
                    done()
                })
            })

            it('Count in the book table remains unchanged', async () => {
                const resp = await client.query(`
                    select count(*) as count
                    from book
                `)
                expect(resp.rows[0].count).to.equal(countBefore)
            })
        })
    })

    describe('Testing API Key', () => {
        describe('Testing request without a key', () => {
            it('Correct response code', (done) => {
                chai.request(app)
                .get('/book')
                .end((_err, res) => {
                    expect(res).to.have.status(400)
                    done()
                })
            })
            
        })

        describe('Testing request with invalid key', () => {
            it('Correct response code', (done) => {
                chai.request(app)
                .get('/book')
                .set('Authorization', `Basic DoesNotExist1234`)
                .end((_err, res) => {
                    expect(res).to.have.status(401)
                    done()
                })
            })
            
        })
    })


})
