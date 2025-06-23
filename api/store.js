const express = require('express');
const router = express.Router();
const StoreStatus = require('../models/storeStatus');

/**
 * @swagger
 * /api/store/status:
 *   get:
 *     summary: Obtener el estado actual de la tienda (público)
 *     tags: [Tienda]
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
 *       500:
 *         description: Error interno del servidor
 */
router.get('/status', async (req, res) => {
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
    console.error('Error al obtener estado de la tienda:', error);
    res.status(500).json({
      mensaje: 'Error al obtener el estado de la tienda',
      error: error.message
    });
  }
});

module.exports = router; 