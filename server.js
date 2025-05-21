const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
