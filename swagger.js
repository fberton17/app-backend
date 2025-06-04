const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Información de metadatos sobre nuestra API
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Backend de la Aplicación',
      version: '1.0.0',
      description: 'Documentación de la API para el Backend de la Aplicación',
      contact: {
        name: 'Soporte API'
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Servidor de desarrollo'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  // Ruta a los documentos de la API
  apis: ['./api/*.js', './server.js']
};

// Inicializar swagger-jsdoc
const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = { swaggerUi, swaggerDocs };
