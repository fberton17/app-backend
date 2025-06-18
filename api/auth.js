const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/user');
const { verificarToken, permitirRol } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID auto-generado del usuario
 *         nombre:
 *           type: string
 *           description: Nombre del usuario
 *         email:
 *           type: string
 *           description: Correo electrónico del usuario
 *           format: email
 *         password:
 *           type: string
 *           description: Contraseña del usuario (encriptada)
 *         rol:
 *           type: string
 *           description: Rol del usuario en el sistema
 *           enum: [estudiante, admin]
 *           default: estudiante
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *               rol:
 *                 type: string
 *                 enum: [estudiante, admin]
 *                 default: estudiante
 *                 description: Rol del usuario
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       400:
 *         description: Ya existe un usuario con ese correo electrónico
 *       500:
 *         description: Error del servidor
 */
router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ mensaje: 'Ya existe un usuario con ese email' });

    const hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = new Usuario({ nombre, email, password: hash, rol });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión en la aplicación
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT para autenticación
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID del usuario
 *                     nombre:
 *                       type: string
 *                       description: Nombre del usuario
 *                     rol:
 *                       type: string
 *                       description: Rol del usuario
 *       401:
 *         description: Contraseña incorrecta
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      console.log('Login fallido: usuario no encontrado');
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) {
      console.log('Login fallido: contraseña incorrecta');
      return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    console.log('Login exitoso:', usuario.email, '| Rol:', usuario.rol);
    res.json({ token, usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (err) {
    console.error('Error en el servidor al hacer login:', err);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});


/**
 * @swagger
 * /api/auth/usuario:
 *   get:
 *     summary: Obtener información del usuario autenticado
 *     tags: [Autenticación]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información del usuario obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/usuario', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select('-password');
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.json(usuario);
  } catch (err) {
    console.error('Error en endpoint GET /usuario:', err);
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

// Listar todos los usuarios (para prueba)
router.get('/usuarios-debug', async (req, res) => {
  try {
    const usuarios = await Usuario.find(); // sin .select('-password')
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
});

// Actualizar preferencias del usuario autenticado
router.put('/usuario/preferencias', verificarToken, async (req, res) => {
  try {
    const userId = req.usuario.id; // desde token
    const { preferencias } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      userId,
      { preferencias },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ success: false, mensaje: 'Usuario no encontrado' });
    }

    res.json({ success: true, mensaje: 'Preferencias actualizadas', data: usuario.preferencias });
  } catch (err) {
    console.error('Error al actualizar preferencias:', err);
    res.status(500).json({ success: false, mensaje: 'Error del servidor' });
  }
});

module.exports = router;

