const express = require('express');
const router = express.Router();
const MenuDelDia = require('../models/menuDelDia');



// Obtener todos los menús del día
router.get('/', async (req, res) => {
  try {
    const menus = await MenuDelDia.find();
    res.json(menus);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener menús del día' });
  }
});

// Crear un nuevo menú del día (opcional para administración)
router.post('/', async (req, res) => {
  try {
    const count = await MenuDelDia.countDocuments();
    const nombre = `Menú ${count + 1} - ${req.body.nombre}`;
    const nuevoMenu = new MenuDelDia({
      nombre,
      descripcion: req.body.descripcion,
      precio: req.body.precio
    });
    const guardado = await nuevoMenu.save();
    res.status(201).json(guardado);
  } catch (err) {
    res.status(400).json({ error: 'Error al guardar el menú' });
  }
});


module.exports = router;
