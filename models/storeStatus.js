const mongoose = require('mongoose');

const storeStatusSchema = new mongoose.Schema({
  isOpen: {
    type: Boolean,
    default: false,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índice para asegurar que solo haya un documento de estado
storeStatusSchema.index({}, { unique: true });

module.exports = mongoose.model('StoreStatus', storeStatusSchema); 