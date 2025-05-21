const express = require('express');
const router = express.Router();
const ChatLog = require('../models/ChatLog');

// Simula respuesta IA
function generarRespuestaIA(mensaje) {
  return `Simulando IA: recibí tu mensaje "${mensaje}"`;
}

router.post('/', async (req, res) => {
  const { usuario, mensajeUsuario } = req.body;
  const respuestaIA = generarRespuestaIA(mensajeUsuario);

  const log = new ChatLog({ usuario, mensajeUsuario, respuestaIA });
  await log.save();

  res.json({ respuestaIA });
});

module.exports = router;
