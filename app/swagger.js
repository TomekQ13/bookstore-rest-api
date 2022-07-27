const options = {
    definition: {
      openapi: "3.0.1",
      info: {
        title: "Bookstore CRUD REST API",
        version: "1.0.0",
        description:
          "This is a simple CRUD API application made with Express and documented with Swagger"
      },
      servers: [
        {
          url: "http://localhost:3000/book",
          description: 'Development server'
        },
      ],
      components: {
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
  
