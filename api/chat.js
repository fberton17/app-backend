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
 * Genera una respuesta desde OpenAI (GPT-3.5)
 */
async function generarRespuestaIA(mensajeUsuario, usuarioId) {
  // 1. Obtener los últimos 5 mensajes del usuario
  const historial = await ChatLog.find({ usuario: usuarioId })
    .sort({ fecha: -1 }) // del más reciente al más antiguo
    .limit(5)
    .lean();

  // 2. Invertir para que estén en orden cronológico
  const historialOrdenado = historial.reverse();

  // 3. Convertir a formato de OpenAI
  const mensajesContexto = historialOrdenado.flatMap(entry => ([
    { role: 'user', content: entry.mensajeUsuario },
    { role: 'assistant', content: entry.respuestaIA }
  ]));

  // 4. Obtener productos y preferencias para el sistema
  const productos = await Producto.find({ disponible: true });
  const usuario = await Usuario.findById(usuarioId);
  const textoPreferencias = formatearPreferencias(usuario?.preferencias);

  const lista = productos.map(p => `- ${p.nombre} ($${p.precio})`).join('\n');

  const mensajeSistema = `
    Sos un asistente amigable que recomienda productos de una cantina universitaria. 

    Tenés que ayudar al usuario a elegir productos que estén disponibles actualmente en el menú, dando prioridad a sus preferencias personales.

    Siempre que sea posible:
    - Recomendá productos que coincidan con sus sabores preferidos, su dieta, y sus alergias.
    - Evitá sugerir productos que no respeten sus restricciones.
    - Si no hay coincidencias exactas, explicá por qué y sugerí lo más cercano posible.

    Respondé con empatía, de forma breve y clara.

    Intenta razonar que lo que estés recomendando realmente esté alineado con las preferencias del usuario,
    atende a que por ejemplo una milanesa no es dulce.

    Estas son las preferencias del usuario:
    ${textoPreferencias}

    Estos son los productos disponibles:
    ${lista}
    `.trim();


  // 5. Mensaje nuevo del usuario
  const mensajeActual = { role: 'user', content: mensajeUsuario };

  // 6. Enviar a OpenAI con todo el contexto
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: mensajeSistema },
      ...mensajesContexto,
      mensajeActual
    ],
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
