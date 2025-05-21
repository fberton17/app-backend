const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  productos: [
    {
      producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
      cantidad: { type: Number, required: true }
    }
  ],
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  total: { type: Number, required: true },
  metodoPago: { type: String, enum: ['efectivo', 'tarjeta', 'mercadopago'], required: true },
  fecha: { type: Date, default: Date.now },
  calificacion: {
    puntaje: { type: Number, min: 1, max: 5 },
    comentario: String
  }
});

module.exports = mongoose.model('Pedido', pedidoSchema);
