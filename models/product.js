const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number, required: true },
  imagen: { type: String }, // URL de la imagen
  disponible: { type: Boolean, default: true },
  stock: { type: Number, default: 0 },
  categoria: { type: String, enum: ['bebida', 'comida', 'snack', 'menu'], required: true },
  creadoEn: { type: Date, default: Date.now },
  sabores: [String],
  dieta: [String],
  alergias: [String],

});

module.exports = mongoose.model('Producto', productoSchema);
