const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');

// Crear nuevo pedido
router.post('/', async (req, res) => {
  try {
    const nuevoPedido = new Pedido(req.body);
    await nuevoPedido.save();
    res.status(201).json(nuevoPedido);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el pedido' });
  }
});

// Obtener pedidos de un usuario
router.get('/usuario/:id', async (req, res) => {
  const pedidos = await Pedido.find({ usuario: req.params.id }).populate('productos.producto');
  res.json(pedidos);
});

// Cambiar estado del pedido
router.put('/:id/estado', async (req, res) => {
  const { estado } = req.body;
  const actualizado = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true });
  res.json(actualizado);
});

module.exports = router;
