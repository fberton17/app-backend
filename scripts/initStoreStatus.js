const mongoose = require('mongoose');
require('dotenv').config();

const StoreStatus = require('../models/storeStatus');

async function initializeStoreStatus() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    // Verificar si ya existe un documento de estado
    const existingStatus = await StoreStatus.findOne();
    
    if (existingStatus) {
      console.log('El estado de la tienda ya está inicializado:', {
        isOpen: existingStatus.isOpen,
        lastUpdated: existingStatus.lastUpdated
      });
    } else {
      // Crear estado por defecto (cerrado)
      const defaultStatus = new StoreStatus({
        isOpen: false,
        updatedBy: null,
        notes: 'Estado inicial de la tienda'
      });
      
      await defaultStatus.save();
      console.log('Estado de la tienda inicializado exitosamente:', {
        isOpen: defaultStatus.isOpen,
        lastUpdated: defaultStatus.lastUpdated
      });
    }

    console.log('Inicialización completada');
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la función si el script se ejecuta directamente
if (require.main === module) {
  initializeStoreStatus();
}

module.exports = initializeStoreStatus; 