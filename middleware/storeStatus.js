const StoreStatus = require('../models/storeStatus');

/**
 * Middleware para verificar si la tienda está abierta
 * Solo permite crear pedidos cuando la tienda está abierta
 */
const verificarTiendaAbierta = async (req, res, next) => {
  try {
    // Buscar el estado actual de la tienda
    let storeStatus = await StoreStatus.findOne();
    
    // Si no existe un documento de estado, crear uno por defecto (cerrado)
    if (!storeStatus) {
      storeStatus = new StoreStatus({
        isOpen: false,
        updatedBy: req.usuario ? req.usuario.id : null
      });
      await storeStatus.save();
    }
    
    // Si la tienda está cerrada, rechazar la solicitud
    if (!storeStatus.isOpen) {
      return res.status(403).json({
        mensaje: 'La tienda está cerrada actualmente. No se pueden recibir nuevos pedidos.',
        tiendaAbierta: false,
        ultimaActualizacion: storeStatus.lastUpdated
      });
    }
    
    // Si la tienda está abierta, continuar
    req.storeStatus = storeStatus;
    next();
  } catch (error) {
    console.error('Error al verificar estado de la tienda:', error);
    res.status(500).json({
      mensaje: 'Error interno del servidor al verificar el estado de la tienda',
      error: error.message
    });
  }
};

/**
 * Middleware para obtener el estado actual de la tienda
 * No bloquea la solicitud, solo agrega información del estado
 */
const obtenerEstadoTienda = async (req, res, next) => {
  try {
    let storeStatus = await StoreStatus.findOne();
    
    if (!storeStatus) {
      storeStatus = new StoreStatus({
        isOpen: false,
        updatedBy: req.usuario ? req.usuario.id : null
      });
      await storeStatus.save();
    }
    
    req.storeStatus = storeStatus;
    next();
  } catch (error) {
    console.error('Error al obtener estado de la tienda:', error);
    next();
  }
};

module.exports = {
  verificarTiendaAbierta,
  obtenerEstadoTienda
}; 