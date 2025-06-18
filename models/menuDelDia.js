const mongoose = require('mongoose');

const MenuDelDiaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  precio: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuDelDia', MenuDelDiaSchema);
