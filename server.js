const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { swaggerUi, swaggerDocs } = require('./swagger');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns the API status
 *     description: A simple endpoint to check if the API is running
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/', (req, res) => {
  res.json({ message: 'API running' });
});

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  
  // Capture response data
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`Response Status: ${res.statusCode}`);
    if (data) {
      try {
        // Try to parse as JSON for better formatting
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('Response Body:', parsedData);
      } catch (e) {
        // If it's not JSON, log as string
        console.log('Response Body:', data);
      }
    }
    originalSend.call(this, data);
  };
  
  next();
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch((err) => console.error('Error MongoDB:', err));

// Rutas
app.use('/api/auth', require('./api/auth'));
app.use('/api/productos', require('./api/productos'));
app.use('/api/pedidos', require('./api/pedidos'));
app.use('/api/admin', require('./api/admin'));
app.use('/api/chat', require('./api/chat'));
app.use('/api/menuDelDia', require('./api/menuDelDia'));
app.use('/api/store', require('./api/store'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
