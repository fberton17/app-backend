const express = require('express');
const router = express.Router();
const ChatLog = require('../models/chatlog');
const Producto = require('../models/product');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Construye el prompt dinámico con productos actuales
 */
async function generarPromptConProductos(mensajeUsuario) {
  const productos = await Producto.find({ disponible: true });

  if (productos.length === 0) {
    return `No hay productos disponibles. El usuario dijo: "${mensajeUsuario}". Respondé con empatía.`;
  }

  const lista = productos.map(p => `- ${p.nombre} ($${p.precio})`).join('\n');

  return `
Sos un asistente amigable que recomienda productos de una cantina universitaria.
Estos son los productos disponibles:

${lista}

El usuario escribió: "${mensajeUsuario}"

Recomendale algo que pueda gustarle. Sé breve, claro y simpático.
`.trim();
}

/**
 * Genera una respuesta desde OpenAI (GPT-3.5)
 */
async function generarRespuestaIA(mensajeUsuario) {
  const prompt = await generarPromptConProductos(mensajeUsuario);

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  });

  return completion.choices[0].message.content;
}

/**
 * POST /api/chat — Enviar mensaje al chatbot y guardar respuesta
 */
router.post('/', async (req, res) => {
  try {
    const { usuario, mensajeUsuario } = req.body;

    if (!usuario || !mensajeUsuario) {
      return res.status(400).json({ mensaje: 'Faltan campos obligatorios' });
    }

    const respuestaIA = await generarRespuestaIA(mensajeUsuario);

    const log = new ChatLog({ usuario, mensajeUsuario, respuestaIA });
    await log.save();

    res.json({ respuestaIA });
  } catch (error) {
    console.error('❌ Error al generar respuesta IA:', error.message);
    res.status(500).json({ mensaje: 'Error al generar respuesta IA' });
  }
});

/**
 * GET /api/chat/:idUsuario — Obtener historial de mensajes de un usuario
 */
router.get('/:idUsuario', async (req, res) => {
  try {
    const historial = await ChatLog.find({ usuario: req.params.idUsuario }).sort({ fecha: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial' });
  }
});

module.exports = router;
