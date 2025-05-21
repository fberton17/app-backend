const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

// Obtener todos los productos disponibles
router.get('/', async (req, res) => {
  const productos = await Producto.find({ disponible: true });
  res.json(productos);
});

// Agregar producto (admin)
router.post('/', async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el producto' });
  }
});

// Actualizar producto
router.put('/:id', async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch {
    res.status(400).json({ mensaje: 'Error al actualizar el producto' });
  }
});

// Eliminar producto
router.delete('/:id', async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch {
    res.status(400).json({ mensaje: 'Error al eliminar' });
  }
});

module.exports = router;
