const mongoose = require('mongoose');
require('dotenv').config();
const Producto = require('../models/product');

// Lista de productos
const productos = [
  {
    nombre: 'Hamburguesa Completa',
    descripcion: 'Con lechuga, tomate y mayonesa',
    precio: 280,
    categoria: 'comida'
  },
  {
    nombre: 'Pizza Muzzarella',
    descripcion: 'Porción individual de pizza con muzzarella',
    precio: 250,
    categoria: 'comida'
  },
  {
    nombre: 'Milanesa con Puré',
    descripcion: 'Milanesa de carne con puré de papas',
    precio: 320,
    categoria: 'comida'
  },
  {
    nombre: 'Sandwich de Pollo',
    descripcion: 'Con lechuga, tomate y aderezo especial',
    precio: 260,
    categoria: 'comida'
  },
  {
    nombre: 'Ensalada César',
    descripcion: 'Lechuga, pollo, croutones, queso y aderezo césar',
    precio: 290,
    categoria: 'comida'
  },
  {
    nombre: 'Tostado Jamón y Queso',
    descripcion: 'Sandwich caliente con jamón y queso',
    precio: 220,
    categoria: 'comida'
  },
  {
    nombre: 'Gaseosa 500ml',
    descripcion: 'Coca-Cola, Sprite o Fanta',
    precio: 150,
    categoria: 'bebida'
  },
  {
    nombre: 'Agua Mineral 500ml',
    descripcion: 'Con o sin gas',
    precio: 120,
    categoria: 'bebida'
  },
  {
    nombre: 'Café con Leche',
    descripcion: 'Café con leche y dos medialunas',
    precio: 200,
    categoria: 'bebida'
  },
  {
    nombre: 'Empanadas (2u)',
    descripcion: 'Carne o pollo',
    precio: 240,
    categoria: 'comida'
  },
  {
    nombre: 'Porción Papas Fritas',
    descripcion: 'Papas fritas con sal',
    precio: 180,
    categoria: 'snack'
  },
  {
    nombre: 'Yogur con Granola',
    descripcion: 'Yogur natural con granola y miel',
    precio: 210,
    categoria: 'snack'
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    //await Producto.deleteMany(); // Opcional: limpiar colección antes
    await Producto.insertMany(productos);
    console.log('Productos insertados correctamente');

    mongoose.disconnect();
  } catch (err) {
    console.error('Error al insertar productos:', err);
  }
})();
