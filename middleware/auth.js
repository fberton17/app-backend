const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Verifica si el token es válido
function verificarToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ mensaje: 'Token inválido o expirado' });
  }
}

// Middleware para verificar rol específico
function permitirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para acceder a esta ruta' });
    }
    next();
  };
}

module.exports = { verificarToken, permitirRol };
