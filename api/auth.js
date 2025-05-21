const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET;

// Registro
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

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, usuario.password);
    if (!valid) return res.status(401).json({ mensaje: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, usuario: { id: usuario._id, nombre: usuario.nombre, rol: usuario.rol } });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error en el servidor' });
  }
});

module.exports = router;
