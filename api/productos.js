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
 * /api/productos/todos:
 *   get:
 *     summary: Obtener todos los productos (disponibles y no disponibles)
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos los productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 */
router.get('/todos', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ 
      mensaje: 'Error al obtener los productos', 
      error: err.message 
    });
  }
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
    res.status(400).json({ mensaje: 'Error al crear el producto', error: err.message });
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

/**
 * @swagger
 * /api/productos/{id}/disponibilidad:
 *   patch:
 *     summary: Actualizar el estado de disponibilidad de un producto (solo administradores)
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
 *             type: object
 *             required:
 *               - disponible
 *             properties:
 *               disponible:
 *                 type: boolean
 *                 description: Estado de disponibilidad del producto
 *     responses:
 *       200:
 *         description: El estado de disponibilidad fue actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Producto'
 *       400:
 *         description: Error al actualizar el estado de disponibilidad
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 *       404:
 *         description: Producto no encontrado
 */
router.put('/:id/disponibilidad', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const { disponible } = req.body;
    
    if (typeof disponible !== 'boolean') {
      return res.status(400).json({ 
        mensaje: 'El campo "disponible" debe ser un valor booleano (true/false)' 
      });
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id, 
      { disponible }, 
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({ 
        mensaje: 'Producto no encontrado',
        error: 'El producto con el ID proporcionado no existe'
      });
    }

    // Asegurar que la respuesta sea JSON con código 200
    return res.status(200).json({
      success: true,
      mensaje: 'Estado de disponibilidad actualizado correctamente',
      producto: producto
    });

  } catch (err) {
    return res.status(400).json({ 
      success: false,
      mensaje: 'Error al actualizar el estado de disponibilidad', 
      error: err.message 
    });
  }
});


/**
 * @swagger
 * /api/productos/menu-del-dia:
 *   get:
 *     summary: Obtener los productos con categoría "menu" creados hoy
 *     tags: [Productos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de menús del día disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Producto'
 *       500:
 *         description: Error al obtener los menús del día
 */
router.get('/menu-del-dia', verificarToken, async (req, res) => {
  try {
    const inicioDelDia = new Date();
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date();
    finDelDia.setHours(23, 59, 59, 999);

    const menus = await Producto.find({
      categoria: 'menu',
      creadoEn: { $gte: inicioDelDia, $lte: finDelDia },
      disponible: true
    });

    res.status(200).json(menus); // 👉 ahora devuelve directamente un array como el GET principal
  } catch (error) {
    console.error('Error al obtener menús del día:', error);
    res.status(500).json({ error: 'Error al obtener el menú del día' });
  }
});

module.exports = router;
