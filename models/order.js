const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  // Información del usuario/cliente
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  clienteNombre: { type: String, required: true },
  clienteEmail: { type: String, required: true },
  
  // Productos del pedido con información completa
  productos: [
    {
      productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
      productoNombre: { type: String, required: true },
      productoDescripcion: { type: String },
      productoPrecio: { type: Number, required: true },
      productoImagen: { type: String },
      productoCategoria: { type: String, required: true },
      cantidad: { type: Number, required: true },
      subtotal: { type: Number, required: true }
    }
  ],
  
  // Información del pedido
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'],
    default: 'pendiente'
  },

  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta', 'mercadopago'], required: true },
  fecha: { type: Date, default: Date.now },
  
  // Calificación opcional
  calificacion: {
    puntaje: { type: Number, min: 1, max: 5 },
    comentario: String
  }
});


module.exports = mongoose.model('Pedido', pedidoSchema);
