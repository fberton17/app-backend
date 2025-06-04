const express = require('express');
const router = express.Router();
const Pedido = require('../models/order');
const { verificarToken, permitirRol } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Pedido:
 *       type: object
 *       required:
 *         - usuario
 *         - productos
 *       properties:
 *         _id:
 *           type: string
 *           description: ID auto-generado del pedido
 *         usuario:
 *           type: string
 *           description: ID del usuario que realizó el pedido
 *         productos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               producto:
 *                 type: string
 *                 description: ID del producto
 *               cantidad:
 *                 type: number
 *                 description: Cantidad del producto
 *         estado:
 *           type: string
 *           description: Estado del pedido
 *           enum: [pendiente, en_proceso, completado, cancelado]
 *           default: pendiente
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del pedido
 */

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Crear un nuevo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productos
 *             properties:
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     producto:
 *                       type: string
 *                       description: ID del producto
 *                     cantidad:
 *                       type: number
 *                       description: Cantidad del producto
 *     responses:
 *       201:
 *         description: El pedido fue creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Error al crear el pedido
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 */
router.post('/', verificarToken, permitirRol('estudiante', 'admin'), async (req, res) => {
  try {
    const nuevoPedido = new Pedido({ ...req.body, usuario: req.usuario.id });
    await nuevoPedido.save();
    res.status(201).json(nuevoPedido);
  } catch (err) {
    res.status(400).json({ mensaje: 'Error al crear el pedido' });
  }
});

/**
 * @swagger
 * /api/pedidos/usuario:
 *   get:
 *     summary: Obtener todos los pedidos del usuario autenticado
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 */
router.get('/usuario', verificarToken, permitirRol('estudiante', 'admin'), async (req, res) => {
  const pedidos = await Pedido.find({ usuario: req.usuario.id }).populate('productos.producto');
  res.json(pedidos);
});

/**
 * @swagger
 * /api/pedidos/{id}/estado:
 *   put:
 *     summary: Actualizar el estado de un pedido (solo administradores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, en_proceso, completado, cancelado]
 *     responses:
 *       200:
 *         description: Estado del pedido actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.put('/:id/estado', verificarToken, permitirRol('admin'), async (req, res) => {
  const { estado } = req.body;
  const actualizado = await Pedido.findByIdAndUpdate(req.params.id, { estado }, { new: true });
  res.json(actualizado);
});

module.exports = router;
