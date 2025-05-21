const express = require('express');
const router = express.Router();
const Producto = require('../models/product');
const { verificarToken, permitirRol } = require('../middleware/auth');

// Ver productos públicos
router.get('/', async (req, res) => {
  const productos = await Producto.find({ disponible: true });
  res.json(productos);
});

// Crear producto (solo admin)
router.post('/', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el producto' });
  }
});

// Editar producto (solo admin)
router.put('/:id', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch {
    res.status(400).json({ mensaje: 'Error al actualizar el producto' });
  }
});

// Eliminar producto (solo admin)
router.delete('/:id', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch {
    res.status(400).json({ mensaje: 'Error al eliminar' });
  }
});

module.exports = router;
