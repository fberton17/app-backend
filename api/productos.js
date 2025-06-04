const express = require('express');
const router = express.Router();
const Producto = require('../models/product');
const { verificarToken, permitirRol } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Producto:
 *       type: object
 *       required:
 *         - nombre
 *         - precio
 *         - categoria
 *       properties:
 *         _id:
 *           type: string
 *           description: ID auto-generado del producto
 *         nombre:
 *           type: string
 *           description: Nombre del producto
 *         descripcion:
 *           type: string
 *           description: Descripción del producto
 *         precio:
 *           type: number
 *           description: Precio del producto
 *         imagen:
 *           type: string
 *           description: URL de la imagen del producto
 *         disponible:
 *           type: boolean
 *           description: Indica si el producto está disponible
 *           default: true
 *         stock:
 *           type: number
 *           description: Cantidad disponible en inventario
 *           default: 0
 *         categoria:
 *           type: string
 *           description: Categoría del producto
 *           enum: [bebida, comida, snack]
 *         creadoEn:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del producto
 */

/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Obtener todos los productos disponibles
 *     tags: [Productos]
 *     responses:
 *       200:
 *         description: Lista de productos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 */
router.get('/', async (req, res) => {
  const productos = await Producto.find({ disponible: true });
  res.json(productos);
});

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto (solo administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *     responses:
 *       201:
 *         description: El producto fue creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Error al crear el producto
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.post('/', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const nuevo = new Producto(req.body);
    await nuevo.save();
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el producto' });
  }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar un producto (solo administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Producto'
 *     responses:
 *       200:
 *         description: El producto fue actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Error al actualizar el producto
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.put('/:id', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const actualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(actualizado);
  } catch {
    res.status(400).json({ mensaje: 'Error al actualizar el producto' });
  }
});

/**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto (solo administradores)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: El producto fue eliminado exitosamente
 *       400:
 *         description: Error al eliminar el producto
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.delete('/:id', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    await Producto.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Producto eliminado' });
  } catch {
    res.status(400).json({ mensaje: 'Error al eliminar' });
  }
});

module.exports = router;
