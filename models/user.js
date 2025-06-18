const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  nombre: String,
  email: { type: String, unique: true },
  password: String,
  rol: { type: String, enum: ['estudiante', 'admin'], default: 'estudiante' },
  preferencias: {
    sabores: [String],
    dieta: [String],
    alergias: [String],
    bebidas: [String]
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);
