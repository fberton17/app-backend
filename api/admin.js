const express = require('express');
const router = express.Router();
const StoreStatus = require('../models/storeStatus');
const { verificarToken, permitirRol } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     StoreStatus:
 *       type: object
 *       properties:
 *         isOpen:
 *           type: boolean
 *           description: Estado de la tienda (true = abierta, false = cerrada)
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Fecha de la última actualización del estado
 *         updatedBy:
 *           type: string
 *           description: ID del usuario que actualizó el estado
 *         notes:
 *           type: string
 *           description: Notas adicionales sobre el cambio de estado
 */

/**
 * @swagger
 * /api/admin/store/status:
 *   get:
 *     summary: Obtener el estado actual de la tienda
 *     tags: [Admin - Tienda]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado actual de la tienda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreStatus'
 *       401:
 *         description: No autorizado
 */
router.get('/store/status', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    let storeStatus = await StoreStatus.findOne();
    
    if (!storeStatus) {
      // Crear estado por defecto si no existe
      storeStatus = new StoreStatus({
        isOpen: false,
        updatedBy: req.usuario.id
      });
      await storeStatus.save();
    }
    
    res.json(storeStatus);
  } catch (error) {
    console.error('Error al obtener estado de la tienda:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el estado de la tienda',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/store/open:
 *   post:
 *     summary: Abrir la tienda
 *     tags: [Admin - Tienda]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notas opcionales sobre la apertura de la tienda
 *     responses:
 *       200:
 *         description: Tienda abierta exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreStatus'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/store/open', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    
    let storeStatus = await StoreStatus.findOne();
    
    if (!storeStatus) {
      storeStatus = new StoreStatus({
        isOpen: true,
        updatedBy: req.usuario.id,
        notes: notes || ''
      });
    } else {
      storeStatus.isOpen = true;
      storeStatus.lastUpdated = new Date();
      storeStatus.updatedBy = req.usuario.id;
      storeStatus.notes = notes || '';
    }
    
    await storeStatus.save();
    
    res.json({
      mensaje: 'Tienda abierta exitosamente',
      storeStatus
    });
  } catch (error) {
    console.error('Error al abrir la tienda:', error);
    res.status(500).json({
      mensaje: 'Error al abrir la tienda',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/store/close:
 *   post:
 *     summary: Cerrar la tienda
 *     tags: [Admin - Tienda]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Notas opcionales sobre el cierre de la tienda
 *     responses:
 *       200:
 *         description: Tienda cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoreStatus'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/store/close', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    
    let storeStatus = await StoreStatus.findOne();
    
    if (!storeStatus) {
      storeStatus = new StoreStatus({
        isOpen: false,
        updatedBy: req.usuario.id,
        notes: notes || ''
      });
    } else {
      storeStatus.isOpen = false;
      storeStatus.lastUpdated = new Date();
      storeStatus.updatedBy = req.usuario.id;
      storeStatus.notes = notes || '';
    }
    
    await storeStatus.save();
    
    res.json({
      mensaje: 'Tienda cerrada exitosamente',
      storeStatus
    });
  } catch (error) {
    console.error('Error al cerrar la tienda:', error);
    res.status(500).json({
      mensaje: 'Error al cerrar la tienda',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/store/public-status:
 *   get:
 *     summary: Obtener el estado actual de la tienda (público)
 *     tags: [Admin - Tienda]
 *     responses:
 *       200:
 *         description: Estado actual de la tienda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isOpen:
 *                   type: boolean
 *                   description: Estado de la tienda (true = abierta, false = cerrada)
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *                   description: Fecha de la última actualización del estado
 *                 mensaje:
 *                   type: string
 *                   description: Mensaje descriptivo del estado
 */
router.get('/store/public-status', async (req, res) => {
  try {
    let storeStatus = await StoreStatus.findOne();
    
    if (!storeStatus) {
      // Crear estado por defecto si no existe
      storeStatus = new StoreStatus({
        isOpen: false,
        updatedBy: null
      });
      await storeStatus.save();
    }
    
    const mensaje = storeStatus.isOpen 
      ? 'La tienda está abierta y aceptando pedidos'
      : 'La tienda está cerrada actualmente';
    
    res.json({
      isOpen: storeStatus.isOpen,
      lastUpdated: storeStatus.lastUpdated,
      mensaje
    });
  } catch (error) {
    console.error('Error al obtener estado público de la tienda:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el estado de la tienda',
      error: error.message
    });
  }
});

module.exports = router; 