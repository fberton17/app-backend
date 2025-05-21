const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/user');
require('dotenv').config();

const usuarios = [
  {
    nombre: 'Felipe Berton',
    email: 'fberton@correo.um.edu.uy',
    password: 'test1234',
    rol: 'admin'
  },
  {
    nombre: 'Belen Ferreiro',
    email: 'bferreiro@correo.um.edu.uy',
    password: 'test1234',
    rol: 'estudiante'
  }
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado a MongoDB');

    for (const user of usuarios) {
      const yaExiste = await Usuario.findOne({ email: user.email });
      if (!yaExiste) {
        const hash = await bcrypt.hash(user.password, 10);
        await Usuario.create({ ...user, password: hash });
        console.log(`✔ Usuario creado: ${user.email}`);
      } else {
        console.log(`⚠ Usuario ya existe: ${user.email}`);
      }
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error al insertar usuarios:', err);
  }
})();
