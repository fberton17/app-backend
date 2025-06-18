const express = require('express');
const router = express.Router();
const ChatLog = require('../models/chatlog');
const Producto = require('../models/product');
const Usuario = require('../models/user');
const { verificarToken } = require('../middleware/auth');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function formatearPreferencias(preferencias) {
  if (!preferencias) return 'sin preferencias registradas';

  const { sabores = [], dieta = [], alergias = [], bebidas = [] } = preferencias;

  return `
- Sabores: ${sabores.join(', ') || 'ninguno'}
- Dieta: ${dieta.join(', ') || 'ninguna'}
- Alergias: ${alergias.join(', ') || 'ninguna'}
- Bebidas: ${bebidas.join(', ') || 'ninguna'}
  `.trim();
}

/**
 * Construye el prompt dinámico con productos actuales
 */
async function generarPromptConProductos(mensajeUsuario, usuarioId) {
  const productos = await Producto.find({ disponible: true });
  const usuario = await Usuario.findById(usuarioId);
  const textoPreferencias = formatearPreferencias(usuario?.preferencias);

  if (productos.length === 0) {
    return `No hay productos disponibles. El usuario dijo: "${mensajeUsuario}". Preferencias: ${textoPreferencias}. Respondé con empatía.`;
  }

  const lista = productos.map(p => `- ${p.nombre} ($${p.precio})`).join('\n');

  return `
Sos un asistente amigable que recomienda productos de una cantina universitaria.

Preferencias del usuario:
${textoPreferencias}

Estos son los productos disponibles:
${lista}

El usuario escribió: "${mensajeUsuario}"

Recomendale algo que pueda gustarle. Sé breve, claro y simpático.
`.trim();
}

/**
 * Genera una respuesta desde OpenAI (GPT-3.5)
 */
async function generarRespuestaIA(mensajeUsuario, usuarioId) {
  const prompt = await generarPromptConProductos(mensajeUsuario, usuarioId);

  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  });

  return completion.choices[0].message.content;
}

/**
 * POST /api/chat — Enviar mensaje al chatbot y guardar respuesta
 */
router.post('/', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { mensajeUsuario } = req.body;

    if (!mensajeUsuario) {
      return res.status(400).json({ mensaje: 'Falta el mensaje del usuario' });
    }

    const respuestaIA = await generarRespuestaIA(mensajeUsuario, usuarioId);

    const log = new ChatLog({ usuario: usuarioId, mensajeUsuario, respuestaIA });
    await log.save();

    res.json({ respuestaIA });
  } catch (error) {
    console.error('❌ Error al generar respuesta IA:', error.message);
    res.status(500).json({ mensaje: 'Error al generar respuesta IA' });
  }
});

/**
 * GET /api/chat — Obtener historial de mensajes del usuario autenticado
 */
router.get('/', verificarToken, async (req, res) => {
  try {
    const historial = await ChatLog.find({ usuario: req.usuario.id }).sort({ fecha: -1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener historial' });
  }
});

module.exports = router;
