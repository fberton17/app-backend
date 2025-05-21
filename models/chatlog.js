const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  mensajeUsuario: { type: String, required: true },
  respuestaIA: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatLog', chatLogSchema);
