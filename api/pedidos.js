const express = require('express');
const router = express.Router();
const Pedido = require('../models/order');
const { verificarToken, permitirRol } = require('../middleware/auth');
const { verificarTiendaAbierta } = require('../middleware/storeStatus');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductoEnPedido:
 *       type: object
 *       properties:
 *         producto:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               description: ID del producto
 *             nombre:
 *               type: string
 *               description: Nombre del producto
 *             descripcion:
 *               type: string
 *               description: Descripción del producto
 *             precio:
 *               type: number
 *               description: Precio del producto
 *             imagen:
 *               type: string
 *               description: URL de la imagen del producto
 *             categoria:
 *               type: string
 *               description: Categoría del producto
 *         cantidad:
 *           type: number
 *           description: Cantidad del producto
 *         subtotal:
 *           type: number
 *           description: Subtotal del producto (precio * cantidad)
 *     Pedido:
 *       type: object
 *       required:
 *         - usuario
 *         - productos
 *         - total
 *         - metodoPago
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
 *             $ref: '#/components/schemas/ProductoEnPedido'
 *         estado:
 *           type: string
 *           description: Estado del pedido
 *           enum: [pendiente, confirmado, preparando, listo, entregado, cancelado]
 *           default: pendiente
 *         total:
 *           type: number
 *           description: Total del pedido
 *         metodoPago:
 *           type: string
 *           description: Método de pago utilizado
 *           enum: [efectivo, tarjeta, mercadopago]
 *         fecha:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del pedido
 *         calificacion:
 *           type: object
 *           properties:
 *             puntaje:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: Puntaje de la calificación
 *             comentario:
 *               type: string
 *               description: Comentario de la calificación
 */

/**
 * @swagger
 * /api/pedidos/debug-productos:
 *   get:
 *     summary: Endpoint de debug para verificar productos
 *     tags: [Pedidos]
 *     responses:
 *       200:
 *         description: Información de debug de productos
 */
router.get('/debug-productos', async (req, res) => {
  try {
    const Producto = require('../models/product');
    
    // IDs de productos que aparecen en los pedidos
    const productIds = [
      "682e5e2b9fe25fb8987357b4",
      "682e5e2b9fe25fb8987357b7", 
      "682e5e2b9fe25fb8987357bb"
    ];
    
    console.log('Buscando productos con IDs:', productIds);
    
    // Buscar cada producto individualmente
    const productosEncontrados = [];
    for (const id of productIds) {
      const producto = await Producto.findById(id);
      console.log(`Producto ${id}:`, producto ? producto.nombre : 'NO ENCONTRADO');
      productosEncontrados.push({
        id: id,
        encontrado: !!producto,
        producto: producto
      });
    }
    
    // Buscar todos los productos en la base de datos
    const todosLosProductos = await Producto.find({}).limit(5);
    
    res.json({
      productosEspecificos: productosEncontrados,
      totalProductosEnBD: await Producto.countDocuments({}),
      primerosProductos: todosLosProductos,
      mensaje: 'Debug de productos completado'
    });
  } catch (err) {
    console.error('Error en debug productos:', err);
    res.status(500).json({ 
      mensaje: 'Error en debug productos',
      error: err.message 
    });
  }
});

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
 *               - total
 *               - metodoPago
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
 *               total:
 *                 type: number
 *                 description: Total del pedido
 *               metodoPago:
 *                 type: string
 *                 enum: [efectivo, tarjeta, mercadopago]
 *                 description: Método de pago
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
 *       403:
 *         description: Tienda cerrada - No se pueden recibir nuevos pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                   description: Mensaje explicando que la tienda está cerrada
 *                 tiendaAbierta:
 *                   type: boolean
 *                   description: Estado de la tienda (siempre false en este caso)
 *                 ultimaActualizacion:
 *                   type: string
 *                   format: date-time
 *                   description: Fecha de la última actualización del estado de la tienda
 */
router.post('/', verificarToken, permitirRol('estudiante', 'admin'), verificarTiendaAbierta, async (req, res) => {
  try {
    const { productos, total, metodoPago } = req.body;

    // Validar campos requeridos
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ mensaje: 'Se requiere al menos un producto' });
    }

    if (!total || typeof total !== 'number' || total <= 0) {
      return res.status(400).json({ mensaje: 'El total es requerido y debe ser mayor a 0' });
    }

    if (!metodoPago || !['efectivo', 'tarjeta', 'mercadopago'].includes(metodoPago)) {
      return res.status(400).json({ mensaje: 'Método de pago válido requerido (efectivo, tarjeta, mercadopago)' });
    }

    // Obtener información del usuario
    const Usuario = require('../models/user');
    const usuario = await Usuario.findById(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Obtener información de los productos
    const Producto = require('../models/product');
    const productosCompletos = [];
    
    for (const item of productos) {
      if (!item.producto || !item.cantidad || item.cantidad <= 0) {
        return res.status(400).json({ mensaje: 'Cada producto debe tener un ID válido y cantidad mayor a 0' });
      }
      
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(400).json({ mensaje: `Producto con ID ${item.producto} no encontrado` });
      }
      
      productosCompletos.push({
        productoId: producto._id,
        productoNombre: producto.nombre,
        productoDescripcion: producto.descripcion,
        productoPrecio: producto.precio,
        productoImagen: producto.imagen,
        productoCategoria: producto.categoria,
        cantidad: item.cantidad,
        subtotal: producto.precio * item.cantidad
      });
    }

    const nuevoPedido = new Pedido({
      usuario: req.usuario.id,
      clienteNombre: usuario.nombre,
      clienteEmail: usuario.email,
      productos: productosCompletos,
      total,
      metodoPago,
      estado: 'pendiente'
    });

    await nuevoPedido.save();
    
    res.status(201).json(nuevoPedido);
  } catch (err) {
    console.error('Error al crear pedido:', err);
    res.status(400).json({ 
      mensaje: 'Error al crear el pedido',
      error: err.message 
    });
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
  try {
    const pedidos = await Pedido.find({ usuario: req.usuario.id }).sort({ fecha: -1 });
    
    // Importar modelos para obtener información faltante
    const Usuario = require('../models/user');
    const Producto = require('../models/product');
    
    // Formatear la respuesta manejando tanto pedidos nuevos como antiguos
    const pedidosFormateados = await Promise.all(pedidos.map(async (pedido, pedidoIndex) => {
      // Convertir el pedido a objeto plano para acceder a las propiedades
      const pedidoObj = pedido.toObject();
      
      // Obtener información del usuario
      let usuarioInfo;
      if (pedidoObj.clienteNombre && pedidoObj.clienteEmail) {
        // Pedido nuevo con información completa
        usuarioInfo = {
          _id: pedidoObj.usuario,
          nombre: pedidoObj.clienteNombre,
          email: pedidoObj.clienteEmail
        };
      } else {
        // Pedido antiguo, necesitamos buscar el usuario
        const usuario = await Usuario.findById(pedidoObj.usuario);
        usuarioInfo = {
          _id: pedidoObj.usuario,
          nombre: usuario ? usuario.nombre : 'Usuario no encontrado',
          email: usuario ? usuario.email : 'N/A'
        };
      }
      
      // Obtener información de productos
      const productosFormateados = await Promise.all(pedidoObj.productos.map(async (item, itemIndex) => {
        // Los pedidos antiguos usan 'producto' como campo para el ID
        const productoId = item.producto;
        
        let productoInfo;
        if (item.productoNombre && item.productoPrecio) {
          // Producto con información completa (pedido nuevo)
          productoInfo = {
            _id: productoId,
            nombre: item.productoNombre,
            descripcion: item.productoDescripcion || '',
            precio: item.productoPrecio,
            imagen: item.productoImagen || '',
            categoria: item.productoCategoria || ''
          };
        } else {
          // Producto antiguo, necesitamos buscar la información
          const producto = await Producto.findById(productoId);
          
          productoInfo = {
            _id: productoId,
            nombre: producto ? producto.nombre : 'Producto no encontrado',
            descripcion: producto ? producto.descripcion : '',
            precio: producto ? producto.precio : 0,
            imagen: producto ? producto.imagen : '',
            categoria: producto ? producto.categoria : ''
          };
        }
        
        return {
          producto: productoInfo,
          cantidad: item.cantidad,
          subtotal: item.subtotal || (productoInfo.precio * item.cantidad)
        };
      }));
      
      return {
        _id: pedidoObj._id,
        usuario: usuarioInfo,
        productos: productosFormateados,
        estado: pedidoObj.estado,
        total: pedidoObj.total,
        metodoPago: pedidoObj.metodoPago,
        fecha: pedidoObj.fecha,
        calificacion: pedidoObj.calificacion
      };
    }));
    
    res.json(pedidosFormateados);
  } catch (err) {
    console.error('Error al obtener pedidos del usuario:', err);
    res.status(500).json({ 
      mensaje: 'Error al obtener los pedidos',
      error: err.message 
    });
  }
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
 *                 enum: [pendiente, confirmado, preparando, listo, entregado, cancelado]
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
  try {
  const { estado } = req.body;
    
    // Validar estado válido
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        mensaje: 'Estado inválido. Estados válidos: ' + estadosValidos.join(', ') 
      });
    }

    const actualizado = await Pedido.findByIdAndUpdate(
      req.params.id, 
      { estado }, 
      { new: true }
    );

    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Formatear la respuesta usando la información ya almacenada
    const respuestaFormateada = {
      _id: actualizado._id,
      usuario: {
        _id: actualizado.usuario,
        nombre: actualizado.clienteNombre,
        email: actualizado.clienteEmail
      },
      productos: actualizado.productos.map(item => ({
        producto: {
          _id: item.productoId,
          nombre: item.productoNombre,
          descripcion: item.productoDescripcion,
          precio: item.productoPrecio,
          imagen: item.productoImagen,
          categoria: item.productoCategoria
        },
        cantidad: item.cantidad,
        subtotal: item.subtotal
      })),
      estado: actualizado.estado,
      total: actualizado.total,
      metodoPago: actualizado.metodoPago,
      fecha: actualizado.fecha,
      calificacion: actualizado.calificacion
    };

    res.json(respuestaFormateada);
  } catch (err) {
    console.error('Error al actualizar estado del pedido:', err);
    res.status(400).json({ 
      mensaje: 'Error al actualizar el estado del pedido',
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/pedidos/{id}/cancelar:
 *   put:
 *     summary: Cancelar un pedido (solo administradores)
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
 *     responses:
 *       200:
 *         description: Pedido cancelado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       400:
 *         description: Error al cancelar el pedido
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 *       404:
 *         description: Pedido no encontrado
 */
router.put('/:id/cancelar', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Verificar que el pedido no esté ya cancelado
    if (pedido.estado === 'cancelado') {
      return res.status(400).json({ mensaje: 'El pedido ya está cancelado' });
    }

    // Verificar que el pedido no esté entregado
    if (pedido.estado === 'entregado') {
      return res.status(400).json({ mensaje: 'No se puede cancelar un pedido que ya fue entregado' });
    }

    // Actualizar el estado a cancelado
    const pedidoCancelado = await Pedido.findByIdAndUpdate(
      req.params.id, 
      { estado: 'cancelado' }, 
      { new: true }
    );

    // Formatear la respuesta usando la información ya almacenada
    const respuestaFormateada = {
      _id: pedidoCancelado._id,
      usuario: {
        _id: pedidoCancelado.usuario,
        nombre: pedidoCancelado.clienteNombre,
        email: pedidoCancelado.clienteEmail
      },
      productos: pedidoCancelado.productos.map(item => ({
        producto: {
          _id: item.productoId,
          nombre: item.productoNombre,
          descripcion: item.productoDescripcion,
          precio: item.productoPrecio,
          imagen: item.productoImagen,
          categoria: item.productoCategoria
        },
        cantidad: item.cantidad,
        subtotal: item.subtotal
      })),
      estado: pedidoCancelado.estado,
      total: pedidoCancelado.total,
      metodoPago: pedidoCancelado.metodoPago,
      fecha: pedidoCancelado.fecha,
      calificacion: pedidoCancelado.calificacion
    };

    res.json({
      mensaje: 'Pedido cancelado exitosamente',
      pedido: respuestaFormateada
    });
  } catch (err) {
    console.error('Error al cancelar pedido:', err);
    res.status(400).json({ 
      mensaje: 'Error al cancelar el pedido',
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos (solo administradores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, confirmado, preparando, listo, entregado, cancelado]
 *         description: Filtrar por estado del pedido
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Número máximo de pedidos a retornar
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *     responses:
 *       200:
 *         description: Lista de todos los pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pedidos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pedido'
 *                 total:
 *                   type: integer
 *                   description: Total de pedidos
 *                 pagina:
 *                   type: integer
 *                   description: Página actual
 *                 totalPaginas:
 *                   type: integer
 *                   description: Total de páginas
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.get('/', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const { estado, limit = 50, page = 1 } = req.query;
    
    // Construir filtro básico
    const filtro = {};
    if (estado) {
      filtro.estado = estado;
    }
    
    // Calcular paginación básica
    const limite = parseInt(limit) || 50;
    const pagina = parseInt(page) || 1;
    const skip = (pagina - 1) * limite;
    
    // Obtener pedidos
    const pedidos = await Pedido.find(filtro)
      .sort({ fecha: -1 })
      .limit(limite)
      .skip(skip);
    
    // Contar total para paginación
    const total = await Pedido.countDocuments(filtro);
    const totalPaginas = Math.ceil(total / limite);
    
    // Importar modelos para obtener información faltante
    const Usuario = require('../models/user');
    const Producto = require('../models/product');
    
    // Formatear la respuesta manejando tanto pedidos nuevos como antiguos
    const pedidosFormateados = await Promise.all(pedidos.map(async (pedido, pedidoIndex) => {
      // Convertir el pedido a objeto plano para acceder a las propiedades
      const pedidoObj = pedido.toObject();
      
      // Obtener información del usuario
      let usuarioInfo;
      if (pedidoObj.clienteNombre && pedidoObj.clienteEmail) {
        // Pedido nuevo con información completa
        usuarioInfo = {
          _id: pedidoObj.usuario,
          nombre: pedidoObj.clienteNombre,
          email: pedidoObj.clienteEmail
        };
      } else {
        // Pedido antiguo, necesitamos buscar el usuario
        const usuario = await Usuario.findById(pedidoObj.usuario);
        usuarioInfo = {
          _id: pedidoObj.usuario,
          nombre: usuario ? usuario.nombre : 'Usuario no encontrado',
          email: usuario ? usuario.email : 'N/A'
        };
      }
      
      // Obtener información de productos
      const productosFormateados = await Promise.all(pedidoObj.productos.map(async (item, itemIndex) => {
        // Los pedidos antiguos usan 'producto' como campo para el ID
        const productoId = item.producto;
        
        let productoInfo;
        if (item.productoNombre && item.productoPrecio) {
          // Producto con información completa (pedido nuevo)
          productoInfo = {
            _id: productoId,
            nombre: item.productoNombre,
            descripcion: item.productoDescripcion || '',
            precio: item.productoPrecio,
            imagen: item.productoImagen || '',
            categoria: item.productoCategoria || ''
          };
        } else {
          // Producto antiguo, necesitamos buscar la información
          const producto = await Producto.findById(productoId);
          
          productoInfo = {
            _id: productoId,
            nombre: producto ? producto.nombre : 'Producto no encontrado',
            descripcion: producto ? producto.descripcion : '',
            precio: producto ? producto.precio : 0,
            imagen: producto ? producto.imagen : '',
            categoria: producto ? producto.categoria : ''
          };
        }
        
        return {
          producto: productoInfo,
          cantidad: item.cantidad,
          subtotal: item.subtotal || (productoInfo.precio * item.cantidad)
        };
      }));
      
      return {
        _id: pedidoObj._id,
        usuario: usuarioInfo,
        productos: productosFormateados,
        estado: pedidoObj.estado,
        total: pedidoObj.total,
        metodoPago: pedidoObj.metodoPago,
        fecha: pedidoObj.fecha,
        calificacion: pedidoObj.calificacion
      };
    }));
    
    // Devolver respuesta
    res.json({
      pedidos: pedidosFormateados,
      total,
      pagina,
      totalPaginas,
      limite,
      mensaje: 'Pedidos obtenidos correctamente'
    });
  } catch (err) {
    console.error('Error al obtener pedidos:', err);
    res.status(500).json({ 
      mensaje: 'Error al obtener los pedidos',
      error: err.message 
    });
  }
});

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Obtener un pedido específico por ID
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
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pedido'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No tienes permisos para ver este pedido
 *       404:
 *         description: Pedido no encontrado
 */
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate('productos.producto')
      .populate('usuario', 'nombre email');

    if (!pedido) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    // Verificar permisos: solo el propietario del pedido o un admin puede verlo
    if (pedido.usuario._id.toString() !== req.usuario.id && req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'No tienes permisos para ver este pedido' });
    }

    // Formatear la respuesta
    const respuestaFormateada = {
      _id: pedido._id,
      usuario: {
        _id: pedido.usuario._id,
        nombre: pedido.usuario.nombre,
        email: pedido.usuario.email
      },
      productos: pedido.productos.map(item => ({
        producto: {
          _id: item.producto._id,
          nombre: item.producto.nombre,
          descripcion: item.producto.descripcion,
          precio: item.producto.precio,
          imagen: item.producto.imagen,
          categoria: item.producto.categoria
        },
        cantidad: item.cantidad,
        subtotal: item.producto.precio * item.cantidad
      })),
      estado: pedido.estado,
      total: pedido.total,
      metodoPago: pedido.metodoPago,
      fecha: pedido.fecha,
      calificacion: pedido.calificacion
    };

    res.json(respuestaFormateada);
  } catch (err) {
    console.error('Error al obtener pedido:', err);
    res.status(500).json({ 
      mensaje: 'Error al obtener el pedido',
      error: err.message 
    });
  }
});



/**
 * @swagger
 * /api/pedidos:
 *   get:
 *     summary: Obtener todos los pedidos (solo administradores)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de pedidos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Pedido'
 *       401:
 *         description: No autorizado - No se proporcionó un token válido
 *       403:
 *         description: Prohibido - No es un administrador
 */
router.get('/', verificarToken, permitirRol('admin'), async (req, res) => {
  try {
    const pedidos = await Pedido.find().populate('productos.producto').populate('usuario', 'nombre email');
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
  }
});

module.exports = router;
