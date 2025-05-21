const express = require('express');
const router = express.Router();
const Pedido = require('../models/order');
const { verificarToken, permitirRol } = require('../middleware/auth');

// Crear pedido (usuario autenticado)
router.post('/', verificarToken, permitirRol('estudiante', 'admin'), async (req, res) => {
  try {
    const nuevoPedido = new Pedido({ ...req.body, usuario: req.usuario.id });
    await nuevoPedido.save();
    res.status(201).json(nuevoPedido);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el pedido' });
  }
});

// Pedidos del usuario logueado
router.get('/usuario', verificarToken, permitirRol('estudiante', 'admin'), async (req, res) => {
  const pedidos = await Pedido.find({ usuario: req.usuario.id }).populate('productos.producto');
  res.json(pedidos);
});

// Cambiar estado (solo admin)
router.put('/:id/estado', verificarToken, permitirRol('admin'), async (req, res) => {
  const { estado } = req.body;
  const actualizado = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true });
  res.json(actualizado);
});

module.exports = router;
