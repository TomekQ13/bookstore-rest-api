const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Bookstore CRUD REST API",
        version: "1.0.0",
        description:
          "This is a simple CRUD API application made with Express and documented with Swagger"
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: 'Development server'
        },
      ],
      components: {
        schemas: {
            Book: {
                type: 'object',
                required: ['title', 'author', 'price', 'year_published'],
                properties: {
                    author: {
                        type: 'string',
                        description: 'The author of the book'
                    },
                    price: {
                        type: 'integer',
                        description: 'The price of the book'
                    },
                    description: {
                        type: 'string',
                        description: 'The description of the book'
                    },
                    year_published: {
                        type: 'string',
                        description: 'The year the book was published'
                    }
                },
                example: {
                    author: 'John Doe',
                    price: 199,
                    description: 'This is a description of a book',
                    year_published: 2022
                }
            }
        },
        responses : {
            400: {
                description: 'Missing API key - include it in the Authorization header',
                contents: 'application/json'
            },
            401: {
                description: 'Unauthorized - incorrect API key or incorrect format',
                contents: 'application/json'
            },
            404: {
                description: 'Not found - the book was not found',
                contents: 'application/json'
            }
        },
        securitySchemes: {
            ApiKeyAuth: {
                type: 'apiKey',
                in: 'header',
                name: 'Authorization'
            }
          }
      },
      security: [{
        ApiKeyAuth: []
      }]

    },
    apis: ["./app/routes/book.js"],
}

module.exports = options
  
