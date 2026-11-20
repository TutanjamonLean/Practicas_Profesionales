/**
 * BiblioTech - Servidor backend
 *
 * Centraliza la lógica de negocio y expone una API REST para el frontend.
 * También sirve las páginas estáticas de ../frontend.
 *
 * Los datos se cargan una sola vez desde data/semilla.json y viven en memoria
 * (arrays y objetos). Al reiniciar el servidor se vuelve a la semilla.
 *
 * Uso:
 *   npm install
 *   npm start        -> http://localhost:8080
 *   npm test         -> pruebas de la API
 */

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const pkg = require('./package.json');

const app = express();

const PORT = Number(process.env.PORT) || 8080;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const COOKIE_NAME = 'biblio_sesion';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

// Orígenes autorizados para CORS. Si queda vacío se permite cualquier origen
// (cómodo para el prototipo local). En producción conviene definirlo, por
// ejemplo: BIBLIO_ORIGENES=http://localhost:5500,http://127.0.0.1:5500
const ORIGENES_PERMITIDOS = (process.env.BIBLIO_ORIGENES || '')
  .split(',')
  .map((origen) => origen.trim())
  .filter(Boolean);

// ---------------------------------------------------------------------------
// Datos en memoria
// ---------------------------------------------------------------------------

const SEMILLA = require('./data/semilla.json');

/**
 * Copia profunda de la semilla: todas las operaciones trabajan sobre estas
 * estructuras en memoria y los cambios se pierden al reiniciar el servidor.
 */
let datos = structuredClone(SEMILLA);

// Compatibilidad con archivos de datos anteriores a la funcionalidad de reseñas.
if (!Array.isArray(datos.resenias)) datos.resenias = [];

// ---------------------------------------------------------------------------
// Utilidades de fechas y datos
// ---------------------------------------------------------------------------

function hoy() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function dosDigitos(n) {
  return String(n).padStart(2, '0');
}

function formatearFecha(fecha) {
  return `${dosDigitos(fecha.getDate())}/${dosDigitos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/** Convierte DD/MM/YYYY a Date (medianoche local). */
function parsearFecha(texto) {
  if (!texto) return null;
  const [dia, mes, anio] = String(texto).split('/').map(Number);
  if (!dia || !mes || !anio) return null;
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setHours(0, 0, 0, 0);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Convierte YYYY-MM-DD (input date) a Date. */
function parsearISOFecha(texto) {
  if (!texto) return null;
  const [anio, mes, dia] = String(texto).split('-').map(Number);
  if (!anio || !mes || !dia) return null;
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setHours(0, 0, 0, 0);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function sumarDias(fecha, dias) {
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function diferenciaDias(desde, hasta) {
  return Math.round((hasta.getTime() - desde.getTime()) / 86400000);
}

function libroPorId(id) {
  return datos.libros.find((libro) => libro.id === Number(id)) || null;
}

/** Libro visible en catálogo: existe y no fue eliminado lógicamente. */
function libroActivoPorId(id) {
  const libro = libroPorId(id);
  return libro && !libro.eliminado ? libro : null;
}

function socioPorNro(nroSocio) {
  return datos.usuarios.find(
    (usuario) => usuario.rol === 'socio' && String(usuario.nroSocio) === String(nroSocio)
  ) || null;
}

function siguienteId(lista) {
  return lista.reduce((maximo, item) => Math.max(maximo, Number(item.id) || 0), 0) + 1;
}

/** Nombre que puede mostrarse en pantallas de terceros (protege a menores). */
function nombreVisible(usuario) {
  if (!usuario) return 'Socio desconocido';
  return usuario.esMenor ? usuario.nombre : `${usuario.nombre} ${usuario.apellido}`;
}

/** Datos de usuario sin contraseña ni dirección (la dirección solo va al propio usuario). */
function usuarioPublico(usuario, incluirDireccion = false) {
  const base = {
    id: usuario.id,
    usuario: usuario.usuario,
    rol: usuario.rol,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
    email: usuario.email,
    nroSocio: usuario.nroSocio || null,
    legajo: usuario.legajo || null,
    esMenor: Boolean(usuario.esMenor)
  };
  if (incluirDireccion) base.direccion = usuario.direccion || null;
  return base;
}

function libroPublico(libro) {
  return {
    id: libro.id,
    titulo: libro.titulo,
    autor: libro.autor,
    genero: libro.genero,
    anio: libro.anio,
    disponibles: libro.disponibles,
    totalEjemplares: libro.totalEjemplares,
    soloSala: Boolean(libro.soloSala),
    descripcion: libro.descripcion || '',
    estado: libro.soloSala ? 'solo-sala' : libro.disponibles > 0 ? 'disponible' : 'sin-stock'
  };
}

function libroResumen(libro) {
  if (!libro) return null;
  return {
    id: libro.id,
    titulo: libro.titulo,
    autor: libro.autor,
    genero: libro.genero,
    anio: libro.anio
  };
}

/**
 * Reseña lista para mostrar. El autor se expone con la misma regla de
 * privacidad que el resto del sistema: los menores aparecen solo por su nombre.
 */
function reseniaDetalle(resenia, usuario) {
  const socio = socioPorNro(resenia.nroSocio);
  return {
    id: resenia.id,
    libroId: resenia.libroId,
    puntuacion: resenia.puntuacion,
    comentario: resenia.comentario,
    fecha: resenia.fecha,
    autor: nombreVisible(socio),
    propia: Boolean(
      usuario &&
      usuario.rol === 'socio' &&
      String(usuario.nroSocio) === String(resenia.nroSocio)
    )
  };
}

function estaVencido(prestamo) {
  if (prestamo.estado !== 'activo') return false;
  const vencimiento = parsearFecha(prestamo.fechaDevolucion);
  return Boolean(vencimiento && vencimiento < hoy());
}

function diasAtraso(prestamo) {
  const vencimiento = parsearFecha(prestamo.fechaDevolucion);
  if (!vencimiento) return 0;
  const diferencia = diferenciaDias(vencimiento, hoy());
  return diferencia > 0 ? diferencia : 0;
}

function prestamoDetalle(prestamo) {
  const libro = libroPorId(prestamo.libroId);
  const socio = socioPorNro(prestamo.nroSocio);
  return {
    id: prestamo.id,
    solicitudId: prestamo.solicitudId || null,
    nroSocio: prestamo.nroSocio,
    nombreVisible: nombreVisible(socio),
    libro: libroResumen(libro),
    fechaRetiro: prestamo.fechaRetiro,
    fechaDevolucion: prestamo.fechaDevolucion,
    fechaDevolucionReal: prestamo.fechaDevolucionReal || null,
    estado: prestamo.estado,
    vencido: estaVencido(prestamo),
    diasAtraso: diasAtraso(prestamo)
  };
}

function solicitudDetalle(solicitud) {
  const libro = libroPorId(solicitud.libroId);
  const socio = socioPorNro(solicitud.nroSocio);
  return {
    id: solicitud.id,
    nroSocio: solicitud.nroSocio,
    nombreVisible: nombreVisible(socio),
    libro: libroResumen(libro),
    fechaSolicitud: solicitud.fechaSolicitud,
    fechaRetiro: solicitud.fechaRetiro,
    fechaDevolucion: solicitud.fechaDevolucion,
    estado: solicitud.estado
  };
}

// ---------------------------------------------------------------------------
// Errores de la API
// ---------------------------------------------------------------------------

class ErrorHTTP extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
  }
}

/**
 * Normaliza un texto de entrada quitando espacios en los extremos.
 * @param {unknown} valor
 * @returns {string}
 */
function textoLimpio(valor) {
  return String(valor ?? '').trim();
}

/**
 * Valida un número entero dentro de un rango. Si no viene, devuelve el valor
 * por defecto (útil para campos opcionales como el año).
 */
function enteroEnRango(valor, { minimo, maximo, defecto = null, campo }) {
  if (valor === undefined || valor === null || valor === '') return defecto;

  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < minimo || numero > maximo) {
    throw new ErrorHTTP(
      400,
      'DATO_INVALIDO',
      `${campo} debe ser un número entero entre ${minimo} y ${maximo}.`
    );
  }
  return numero;
}

// ---------------------------------------------------------------------------
// Sesiones y autorización
// ---------------------------------------------------------------------------

const sesiones = new Map();

function tokenDePeticion(req) {
  const cookies = String(req.headers.cookie || '')
    .split(';')
    .map((parte) => parte.trim())
    .filter(Boolean);
  const encontrada = cookies.find((cookie) => cookie.startsWith(`${COOKIE_NAME}=`));
  if (!encontrada) return null;
  const valor = encontrada.slice(COOKIE_NAME.length + 1);
  try {
    return decodeURIComponent(valor);
  } catch {
    // Una cookie manipulada o mal codificada equivale a no tener sesión.
    return null;
  }
}

function usuarioDeSesion(req) {
  const token = tokenDePeticion(req);
  if (!token) return null;
  const sesion = sesiones.get(token);
  if (!sesion) return null;
  if (sesion.expira < Date.now()) {
    sesiones.delete(token);
    return null;
  }
  return datos.usuarios.find((usuario) => usuario.id === sesion.usuarioId) || null;
}

/**
 * Atributos de la cookie de sesión según el protocolo de la petición.
 *
 * En HTTP (desarrollo local) se usa SameSite=Lax. Cuando la petición llega
 * por HTTPS (por ejemplo, en Render) se usa SameSite=None; Secure, que es lo
 * que exigen los navegadores para enviar la cookie cuando el frontend y el
 * backend están publicados en dominios distintos.
 */
function atributosCookie(req) {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  const porHttps = req.secure || proto === 'https';

  return porHttps
    ? 'HttpOnly; Path=/; SameSite=None; Secure'
    : 'HttpOnly; Path=/; SameSite=Lax';
}

function crearSesion(req, res, usuario) {
  const token = crypto.randomUUID();
  sesiones.set(token, {
    usuarioId: usuario.id,
    expira: Date.now() + DURACION_SESION_MS
  });
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; ${atributosCookie(req)}; Max-Age=${DURACION_SESION_MS / 1000}`
  );
}

function autenticar(req, res, next) {
  const usuario = usuarioDeSesion(req);
  if (!usuario) {
    return res.status(401).json({
      codigo: 'NO_AUTENTICADO',
      mensaje: 'Iniciá sesión para continuar.'
    });
  }
  req.usuario = usuario;
  next();
}

function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        codigo: 'NO_AUTENTICADO',
        mensaje: 'Iniciá sesión para continuar.'
      });
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        codigo: 'SIN_PERMISO',
        mensaje: 'No tenés permiso para realizar esta acción.'
      });
    }
    next();
  };
}

// ---------------------------------------------------------------------------
// Middlewares generales
// ---------------------------------------------------------------------------

app.disable('x-powered-by');

// CORS: permite ejecutar el frontend como proyecto separado (por ejemplo, con
// Live Server en otro puerto). Si BIBLIO_ORIGENES está definido, solo se
// habilitan los orígenes listados.
app.use((req, res, next) => {
  const origen = req.headers.origin;
  const permitido = origen && (
    ORIGENES_PERMITIDOS.length === 0 || ORIGENES_PERMITIDOS.includes(origen)
  );

  if (permitido) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '100kb' }));

// Log de tiempos de respuesta para la API
app.use((req, res, next) => {
  const inicio = process.hrtime.bigint();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test' && req.path.startsWith('/api')) {
      const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms.toFixed(1)} ms)`);
    }
  });
  next();
});

// ---------------------------------------------------------------------------
// API REST
// ---------------------------------------------------------------------------

const api = express.Router();

api.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

api.get('/health', (req, res) => {
  res.json({
    estado: 'ok',
    version: pkg.version,
    hora: new Date().toISOString(),
    uptimeSegundos: Math.round(process.uptime())
  });
});

api.get('/config', (req, res) => {
  res.json({
    version: pkg.version,
    diasPrestamo: datos.config.diasPrestamo,
    maxPrestamos: datos.config.maxPrestamos,
    nombreBiblioteca: datos.config.nombreBiblioteca
  });
});

// --- Autenticación ---

api.post('/auth/login', (req, res) => {
  const { usuario, clave } = req.body || {};
  if (!usuario || !clave) {
    throw new ErrorHTTP(400, 'DATOS_INCOMPLETOS', 'Ingresá usuario y contraseña.');
  }

  const encontrado = datos.usuarios.find(
    (u) => u.usuario === String(usuario).trim() && u.clave === clave
  );

  if (!encontrado) {
    throw new ErrorHTTP(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos.');
  }

  crearSesion(req, res, encontrado);
  res.json({ usuario: usuarioPublico(encontrado, true) });
});

api.post('/auth/logout', autenticar, (req, res) => {
  const token = tokenDePeticion(req);
  if (token) sesiones.delete(token);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${atributosCookie(req)}; Max-Age=0`);
  res.status(204).end();
});

api.get('/auth/me', autenticar, (req, res) => {
  res.json({ usuario: usuarioPublico(req.usuario, true) });
});

// --- Catálogo ---

api.get('/libros', autenticar, (req, res) => {
  const buscar = String(req.query.buscar || '').toLowerCase().trim();
  const genero = String(req.query.genero || '').toLowerCase().trim();
  const soloDisponibles = req.query.disponible === '1' || req.query.disponible === 'true';

  let listado = datos.libros.filter((libro) => !libro.eliminado);

  if (buscar) {
    listado = listado.filter((libro) =>
      `${libro.titulo} ${libro.autor} ${libro.genero}`.toLowerCase().includes(buscar)
    );
  }
  if (genero) {
    listado = listado.filter((libro) => libro.genero.toLowerCase() === genero);
  }
  if (soloDisponibles) {
    listado = listado.filter((libro) => libro.disponibles > 0 && !libro.soloSala);
  }

  res.json({
    total: listado.length,
    libros: listado.map(libroPublico)
  });
});

/**
 * Ranking público de libros más pedidos. Se usa en el inicio, antes de
 * iniciar sesión, por lo que solo expone datos bibliográficos.
 * Debe declararse antes de /libros/:id para que "populares" no sea un id.
 */
api.get('/libros/populares', (req, res) => {
  const conteos = new Map();

  function sumar(libroId, campo) {
    const clave = Number(libroId);
    if (!conteos.has(clave)) {
      conteos.set(clave, { vecesPrestado: 0, vecesSolicitado: 0 });
    }
    conteos.get(clave)[campo] += 1;
  }

  datos.prestamos.forEach((prestamo) => sumar(prestamo.libroId, 'vecesPrestado'));
  datos.solicitudes
    .filter((solicitud) => solicitud.estado !== 'rechazada')
    .forEach((solicitud) => sumar(solicitud.libroId, 'vecesSolicitado'));

  const libros = datos.libros
    .filter((libro) => !libro.eliminado)
    .map((libro) => {
      const conteo = conteos.get(libro.id) || { vecesPrestado: 0, vecesSolicitado: 0 };
      return {
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor,
        genero: libro.genero,
        anio: libro.anio,
        descripcion: libro.descripcion || '',
        vecesPrestado: conteo.vecesPrestado,
        vecesSolicitado: conteo.vecesSolicitado,
        totalPedidos: conteo.vecesPrestado + conteo.vecesSolicitado
      };
    })
    .sort((a, b) => {
      const diferencia = b.totalPedidos - a.totalPedidos;
      return diferencia !== 0 ? diferencia : a.titulo.localeCompare(b.titulo, 'es');
    })
    .slice(0, 6)
    .map(({ totalPedidos, ...libro }) => libro);

  res.json({ total: libros.length, libros });
});

api.get('/libros/:id', autenticar, (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');
  res.json({ libro: libroPublico(libro) });
});

// --- Reseñas de socios ---

api.get('/libros/:id/resenias', autenticar, (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  const resenias = datos.resenias
    .filter((resenia) => resenia.libroId === libro.id)
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((resenia) => reseniaDetalle(resenia, req.usuario));

  const promedio = resenias.length > 0
    ? Number((resenias.reduce((total, resenia) => total + resenia.puntuacion, 0) / resenias.length).toFixed(1))
    : 0;

  res.json({ total: resenias.length, promedio, resenias });
});

api.post('/libros/:id/resenias', autenticar, autorizar('socio'), (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  const puntuacion = Number(req.body?.puntuacion);
  const comentario = String(req.body?.comentario || '').trim();

  if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
    throw new ErrorHTTP(400, 'PUNTUACION_INVALIDA', 'Elegí una puntuación de 1 a 5 estrellas.');
  }
  if (!comentario) {
    throw new ErrorHTTP(400, 'COMENTARIO_VACIO', 'Escribí un comentario para tu reseña.');
  }
  if (comentario.length > 1000) {
    throw new ErrorHTTP(400, 'COMENTARIO_LARGO', 'La reseña no puede superar los 1000 caracteres.');
  }

  let resenia = datos.resenias.find(
    (item) =>
      item.libroId === libro.id &&
      String(item.nroSocio) === String(req.usuario.nroSocio)
  );
  const creada = !resenia;

  if (resenia) {
    resenia.puntuacion = puntuacion;
    resenia.comentario = comentario;
    resenia.fecha = formatearFecha(hoy());
  } else {
    resenia = {
      id: siguienteId(datos.resenias),
      libroId: libro.id,
      nroSocio: req.usuario.nroSocio,
      puntuacion,
      comentario,
      fecha: formatearFecha(hoy())
    };
    datos.resenias.push(resenia);
  }

  res.status(creada ? 201 : 200).json({ resenia: reseniaDetalle(resenia, req.usuario) });
});

api.post('/libros', autenticar, autorizar('bibliotecario'), (req, res) => {
  const { titulo, autor, genero, anio, totalEjemplares, soloSala, descripcion } = req.body || {};
  const tituloLimpio = textoLimpio(titulo);
  const autorLimpio = textoLimpio(autor);
  const generoLimpio = textoLimpio(genero);

  if (!tituloLimpio || !autorLimpio || !generoLimpio) {
    throw new ErrorHTTP(400, 'DATOS_INCOMPLETOS', 'Título, autor y género son obligatorios.');
  }

  const total = enteroEnRango(totalEjemplares, {
    minimo: 1,
    maximo: 1000,
    defecto: 1,
    campo: 'La cantidad de ejemplares'
  });
  const anioLimpio = enteroEnRango(anio, {
    minimo: 1000,
    maximo: 2100,
    campo: 'El año'
  });

  const libro = {
    id: siguienteId(datos.libros),
    titulo: tituloLimpio,
    autor: autorLimpio,
    genero: generoLimpio,
    anio: anioLimpio,
    disponibles: total,
    totalEjemplares: total,
    soloSala: Boolean(soloSala),
    descripcion: textoLimpio(descripcion),
    eliminado: false
  };

  datos.libros.push(libro);
  res.status(201).json({ libro: libroPublico(libro) });
});

api.put('/libros/:id', autenticar, autorizar('bibliotecario'), (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  const { titulo, autor, genero, anio, descripcion, soloSala } = req.body || {};
  const tituloLimpio = textoLimpio(titulo);
  const autorLimpio = textoLimpio(autor);
  const generoLimpio = textoLimpio(genero);

  if (!tituloLimpio || !autorLimpio || !generoLimpio) {
    throw new ErrorHTTP(400, 'DATOS_INCOMPLETOS', 'Título, autor y género son obligatorios.');
  }

  const anioLimpio = enteroEnRango(anio, {
    minimo: 1000,
    maximo: 2100,
    campo: 'El año'
  });

  libro.titulo = tituloLimpio;
  libro.autor = autorLimpio;
  libro.genero = generoLimpio;
  libro.anio = anioLimpio;
  libro.descripcion = textoLimpio(descripcion);
  if (Object.prototype.hasOwnProperty.call(req.body || {}, 'soloSala')) {
    libro.soloSala = Boolean(soloSala);
  }

  res.json({ libro: libroPublico(libro) });
});

api.delete('/libros/:id', autenticar, autorizar('bibliotecario'), (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  libro.eliminado = true;

  // Las reservas pendientes de un libro eliminado ya no pueden concretarse.
  const pendientes = datos.solicitudes.filter(
    (solicitud) => solicitud.libroId === libro.id && solicitud.estado === 'pendiente'
  );
  pendientes.forEach((solicitud) => {
    solicitud.estado = 'rechazada';
  });

  res.json({
    libro: libroPublico(libro),
    eliminado: true,
    solicitudesRechazadas: pendientes.length
  });
});

api.post('/libros/:id/ejemplares', autenticar, autorizar('bibliotecario'), (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  const cantidad = enteroEnRango(req.body?.cantidad, {
    minimo: 1,
    maximo: 1000,
    defecto: 1,
    campo: 'La cantidad'
  });
  libro.totalEjemplares += cantidad;
  libro.disponibles += cantidad;

  res.json({ libro: libroPublico(libro), cantidadAgregada: cantidad });
});

api.post('/libros/:id/baja', autenticar, autorizar('bibliotecario'), (req, res) => {
  const libro = libroActivoPorId(req.params.id);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');
  if (libro.totalEjemplares <= 0) {
    throw new ErrorHTTP(409, 'SIN_EJEMPLARES', 'El libro no tiene ejemplares para quitar.');
  }

  libro.totalEjemplares -= 1;
  if (libro.disponibles > 0) libro.disponibles -= 1;
  if (libro.disponibles > libro.totalEjemplares) libro.disponibles = libro.totalEjemplares;

  res.json({ libro: libroPublico(libro), motivo: req.body?.motivo || 'Ejemplar deteriorado' });
});

// --- Solicitudes de préstamo ---

function contarCompromisos(nroSocio) {
  const activos = datos.prestamos.filter(
    (prestamo) => prestamo.nroSocio === nroSocio && prestamo.estado === 'activo'
  ).length;
  const pendientes = datos.solicitudes.filter(
    (solicitud) => solicitud.nroSocio === nroSocio && solicitud.estado === 'pendiente'
  ).length;
  return activos + pendientes;
}

function normalizarFechaRetiro(valor) {
  if (!valor) return hoy();

  const comoISO = parsearISOFecha(valor);
  if (comoISO) return comoISO;

  const comoLocal = parsearFecha(valor);
  if (comoLocal) return comoLocal;

  throw new ErrorHTTP(400, 'FECHA_INVALIDA', 'La fecha de retiro no es válida.');
}

api.post('/solicitudes', autenticar, autorizar('socio'), (req, res) => {
  const { libroId, fechaRetiro } = req.body || {};
  const libro = libroActivoPorId(libroId);
  if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');

  if (libro.soloSala) {
    throw new ErrorHTTP(
      409,
      'LIBRO_SOLO_SALA',
      'Este ejemplar pertenece a una colección única: solo puede consultarse en sala.'
    );
  }

  if (libro.disponibles <= 0) {
    throw new ErrorHTTP(409, 'SIN_STOCK', 'No hay ejemplares disponibles de este libro.');
  }

  const maximo = datos.config.maxPrestamos || 3;
  if (contarCompromisos(req.usuario.nroSocio) >= maximo) {
    throw new ErrorHTTP(
      409,
      'CUPO_EXCEDIDO',
      `Ya tenés ${maximo} préstamos activos o pendientes. No podés reservar otro libro.`
    );
  }

  const retiro = normalizarFechaRetiro(fechaRetiro);
  if (retiro < hoy()) {
    throw new ErrorHTTP(400, 'FECHA_INVALIDA', 'La fecha de retiro no puede ser anterior a hoy.');
  }

  const devolucion = sumarDias(retiro, datos.config.diasPrestamo || 14);

  const solicitud = {
    id: siguienteId(datos.solicitudes),
    nroSocio: req.usuario.nroSocio,
    libroId: libro.id,
    fechaSolicitud: formatearFecha(hoy()),
    fechaRetiro: formatearFecha(retiro),
    fechaDevolucion: formatearFecha(devolucion),
    estado: 'pendiente'
  };

  datos.solicitudes.push(solicitud);
  libro.disponibles -= 1;

  res.status(201).json({
    solicitud: solicitudDetalle(solicitud),
    libro: libroPublico(libro)
  });
});

api.get('/solicitudes', autenticar, autorizar('bibliotecario'), (req, res) => {
  const estado = String(req.query.estado || 'pendiente');
  const listado = datos.solicitudes
    .filter((solicitud) => solicitud.estado === estado)
    .slice()
    .sort((a, b) => {
      // La reserva más reciente (último orden de llegada) va primero.
      const fechaA = parsearFecha(a.fechaSolicitud);
      const fechaB = parsearFecha(b.fechaSolicitud);
      const diferencia = (fechaB ? fechaB.getTime() : 0) - (fechaA ? fechaA.getTime() : 0);
      return diferencia !== 0 ? diferencia : b.id - a.id;
    })
    .map(solicitudDetalle);

  res.json({ total: listado.length, solicitudes: listado });
});

api.get('/solicitudes/mias', autenticar, autorizar('socio'), (req, res) => {
  const propias = datos.solicitudes
    .filter((solicitud) => solicitud.nroSocio === req.usuario.nroSocio)
    .slice()
    .sort((a, b) => b.id - a.id)
    .map(solicitudDetalle);

  res.json({ total: propias.length, solicitudes: propias });
});

api.get('/solicitudes/:id', autenticar, (req, res) => {
  const solicitud = datos.solicitudes.find((s) => s.id === Number(req.params.id));
  if (!solicitud) throw new ErrorHTTP(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada.');

  if (req.usuario.rol === 'socio' && solicitud.nroSocio !== req.usuario.nroSocio) {
    throw new ErrorHTTP(403, 'SIN_PERMISO', 'No podés consultar solicitudes de otros socios.');
  }

  res.json({ solicitud: solicitudDetalle(solicitud) });
});

function aprobarSolicitud(req, res) {
  const solicitud = datos.solicitudes.find((s) => s.id === Number(req.params.id));
  if (!solicitud) throw new ErrorHTTP(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada.');
  if (solicitud.estado !== 'pendiente') {
    throw new ErrorHTTP(409, 'SOLICITUD_NO_PENDIENTE', 'La solicitud ya fue procesada.');
  }

  const prestamo = {
    id: siguienteId(datos.prestamos),
    solicitudId: solicitud.id,
    nroSocio: solicitud.nroSocio,
    libroId: solicitud.libroId,
    fechaRetiro: solicitud.fechaRetiro,
    fechaDevolucion: solicitud.fechaDevolucion,
    estado: 'activo',
    fechaDevolucionReal: null
  };

  datos.prestamos.push(prestamo);
  solicitud.estado = 'aprobada';

  res.json({
    prestamo: prestamoDetalle(prestamo),
    solicitud: solicitudDetalle(solicitud)
  });
}

function rechazarSolicitud(req, res) {
  const solicitud = datos.solicitudes.find((s) => s.id === Number(req.params.id));
  if (!solicitud) throw new ErrorHTTP(404, 'SOLICITUD_NO_ENCONTRADA', 'Solicitud no encontrada.');
  if (solicitud.estado !== 'pendiente') {
    throw new ErrorHTTP(409, 'SOLICITUD_NO_PENDIENTE', 'La solicitud ya fue procesada.');
  }

  solicitud.estado = 'rechazada';
  const libro = libroPorId(solicitud.libroId);
  if (libro) {
    libro.disponibles = Math.min(libro.totalEjemplares, libro.disponibles + 1);
  }

  res.json({ solicitud: solicitudDetalle(solicitud) });
}

// Actualización de estado con el método HTTP correspondiente.
api.patch('/solicitudes/:id', autenticar, autorizar('bibliotecario'), (req, res) => {
  const estado = String(req.body?.estado || '').toLowerCase();
  if (estado === 'aprobada') return aprobarSolicitud(req, res);
  if (estado === 'rechazada') return rechazarSolicitud(req, res);
  throw new ErrorHTTP(
    400,
    'ESTADO_INVALIDO',
    'El estado debe ser "aprobada" o "rechazada".'
  );
});

// Alias de acción conservados por compatibilidad.
api.post('/solicitudes/:id/aprobar', autenticar, autorizar('bibliotecario'), aprobarSolicitud);
api.post('/solicitudes/:id/rechazar', autenticar, autorizar('bibliotecario'), rechazarSolicitud);

// --- Préstamos ---

api.get('/prestamos/mios', autenticar, autorizar('socio'), (req, res) => {
  const propios = datos.prestamos.filter(
    (prestamo) => prestamo.nroSocio === req.usuario.nroSocio
  );

  const activos = propios.filter((prestamo) => prestamo.estado === 'activo').map(prestamoDetalle);
  const devueltos = propios.filter((prestamo) => prestamo.estado === 'devuelto').map(prestamoDetalle);

  res.json({
    activos,
    devueltos,
    sanciones: activos.filter((prestamo) => prestamo.vencido)
  });
});

api.get('/prestamos', autenticar, autorizar('bibliotecario'), (req, res) => {
  const activos = datos.prestamos
    .filter((prestamo) => prestamo.estado === 'activo')
    .map(prestamoDetalle);
  res.json({ total: activos.length, prestamos: activos });
});

api.get('/prestamos/vencidos', autenticar, autorizar('bibliotecario', 'director'), (req, res) => {
  const vencidos = datos.prestamos
    .filter((prestamo) => estaVencido(prestamo))
    .map(prestamoDetalle);

  res.json({
    total: vencidos.length,
    generadoEn: new Date().toISOString(),
    prestamos: vencidos
  });
});

api.get('/reportes/morosos', autenticar, autorizar('bibliotecario', 'director'), (req, res) => {
  const vencidos = datos.prestamos
    .filter(estaVencido)
    .map(prestamoDetalle)
    .sort((a, b) => b.diasAtraso - a.diasAtraso);

  const porSocio = new Map();
  vencidos.forEach((prestamo) => {
    const clave = String(prestamo.nroSocio);
    if (!porSocio.has(clave)) {
      porSocio.set(clave, {
        nroSocio: prestamo.nroSocio,
        nombreVisible: prestamo.nombreVisible,
        prestamosVencidos: 0,
        diasAtrasoMaximo: 0,
        titulos: []
      });
    }

    const socio = porSocio.get(clave);
    socio.prestamosVencidos += 1;
    socio.diasAtrasoMaximo = Math.max(socio.diasAtrasoMaximo, prestamo.diasAtraso);
    if (prestamo.libro) socio.titulos.push(prestamo.libro.titulo);
  });

  const socios = [...porSocio.values()].sort(
    (a, b) => b.diasAtrasoMaximo - a.diasAtrasoMaximo
  );

  res.json({
    generadoEn: new Date().toISOString(),
    totalSocios: socios.length,
    totalPrestamos: vencidos.length,
    socios,
    vencidos
  });
});

api.get('/prestamos/proximos', autenticar, autorizar('bibliotecario'), (req, res) => {
  const limite = hoy();
  const proximos = datos.prestamos
    .filter((prestamo) => {
      if (prestamo.estado !== 'activo') return false;
      const vencimiento = parsearFecha(prestamo.fechaDevolucion);
      return vencimiento && vencimiento <= limite;
    })
    .map(prestamoDetalle);

  res.json({ total: proximos.length, prestamos: proximos });
});

function registrarDevolucion(req, res) {
  const prestamo = datos.prestamos.find((p) => p.id === Number(req.params.id));
  if (!prestamo) throw new ErrorHTTP(404, 'PRESTAMO_NO_ENCONTRADO', 'Préstamo no encontrado.');
  if (prestamo.estado !== 'activo') {
    throw new ErrorHTTP(409, 'PRESTAMO_NO_ACTIVO', 'El préstamo no está activo.');
  }

  prestamo.estado = 'devuelto';
  prestamo.fechaDevolucionReal = formatearFecha(hoy());

  const libro = libroPorId(prestamo.libroId);
  if (libro) {
    libro.disponibles = Math.min(libro.totalEjemplares, libro.disponibles + 1);
  }

  res.json({ prestamo: prestamoDetalle(prestamo) });
}

// Actualización de estado con el método HTTP correspondiente.
api.patch('/prestamos/:id', autenticar, autorizar('bibliotecario'), (req, res) => {
  const estado = String(req.body?.estado || '').toLowerCase();
  if (estado !== 'devuelto') {
    throw new ErrorHTTP(400, 'ESTADO_INVALIDO', 'El estado debe ser "devuelto".');
  }
  registrarDevolucion(req, res);
});

// Alias de acción conservado por compatibilidad.
api.post('/prestamos/:id/devolucion', autenticar, autorizar('bibliotecario'), registrarDevolucion);

// --- Notificaciones ---

api.post('/notificaciones', autenticar, autorizar('bibliotecario'), (req, res) => {
  const { nroSocio, libroId, motivo } = req.body || {};
  const socio = socioPorNro(nroSocio);
  if (!socio) throw new ErrorHTTP(404, 'SOCIO_NO_ENCONTRADO', 'Socio no encontrado.');

  let libroIdFinal = null;
  if (libroId !== undefined && libroId !== null && libroId !== '') {
    const libro = libroActivoPorId(libroId);
    if (!libro) throw new ErrorHTTP(404, 'LIBRO_NO_ENCONTRADO', 'Libro no encontrado.');
    libroIdFinal = libro.id;
  }

  const notificacion = {
    id: siguienteId(datos.notificaciones),
    nroSocio: socio.nroSocio,
    libroId: libroIdFinal,
    motivo: textoLimpio(motivo) || 'Notificación de la biblioteca',
    fecha: formatearFecha(hoy()),
    leida: false
  };

  datos.notificaciones.push(notificacion);
  res.status(201).json({ notificacion });
});

api.get('/notificaciones/mias', autenticar, autorizar('socio'), (req, res) => {
  const propias = datos.notificaciones
    .filter((notificacion) => notificacion.nroSocio === req.usuario.nroSocio)
    .map((notificacion) => ({
      ...notificacion,
      libro: libroResumen(libroPorId(notificacion.libroId))
    }))
    .sort((a, b) => b.id - a.id);

  res.json({
    total: propias.length,
    sinLeer: propias.filter((notificacion) => !notificacion.leida).length,
    notificaciones: propias
  });
});

function marcarNotificacionLeida(req, res) {
  const notificacion = datos.notificaciones.find((n) => n.id === Number(req.params.id));
  if (!notificacion) {
    throw new ErrorHTTP(404, 'NOTIFICACION_NO_ENCONTRADA', 'Notificación no encontrada.');
  }
  if (notificacion.nroSocio !== req.usuario.nroSocio) {
    throw new ErrorHTTP(403, 'SIN_PERMISO', 'No podés modificar notificaciones de otro socio.');
  }

  notificacion.leida = true;
  res.json({ notificacion });
}

// Actualización con el método HTTP correspondiente.
api.patch('/notificaciones/:id', autenticar, autorizar('socio'), (req, res) => {
  if (req.body?.leida !== true) {
    throw new ErrorHTTP(400, 'DATOS_INVALIDOS', 'El campo "leida" debe ser true.');
  }
  marcarNotificacionLeida(req, res);
});

// Alias de acción conservado por compatibilidad.
api.post('/notificaciones/:id/leida', autenticar, autorizar('socio'), marcarNotificacionLeida);

// --- Tablero del director ---

api.get('/dashboard', autenticar, autorizar('director'), (req, res) => {
  const socios = datos.usuarios.filter((usuario) => usuario.rol === 'socio');
  const activos = datos.prestamos.filter((prestamo) => prestamo.estado === 'activo');
  const vencidos = activos.filter(estaVencido);
  const librosActivos = datos.libros.filter((libro) => !libro.eliminado);

  const enSala = librosActivos
    .filter((libro) => libro.soloSala)
    .reduce((total, libro) => total + libro.totalEjemplares, 0);

  const disponiblesPrestamo = librosActivos
    .filter((libro) => !libro.soloSala)
    .reduce((total, libro) => total + libro.disponibles, 0);

  const conteoGeneros = {};
  datos.prestamos.forEach((prestamo) => {
    const libro = libroPorId(prestamo.libroId);
    if (!libro || libro.eliminado) return;
    const genero = libro.genero;
    conteoGeneros[genero] = (conteoGeneros[genero] || 0) + 1;
  });

  const categorias = Object.entries(conteoGeneros)
    .map(([genero, prestamos]) => ({ genero, prestamos }))
    .sort((a, b) => b.prestamos - a.prestamos)
    .slice(0, 5);

  const faltantes = librosActivos
    .filter((libro) => !libro.soloSala && libro.disponibles <= 1)
    .sort((a, b) => a.disponibles - b.disponibles)
    .map((libro) => ({
      id: libro.id,
      titulo: libro.titulo,
      autor: libro.autor,
      disponibles: libro.disponibles,
      totalEjemplares: libro.totalEjemplares
    }));

  res.json({
    generadoEn: new Date().toISOString(),
    indicadores: {
      sociosActivos: socios.length,
      sociosConPrestamos: new Set(activos.map((prestamo) => prestamo.nroSocio)).size,
      prestamosVigentes: activos.length,
      prestamosVencidos: vencidos.length,
      titulosCatalogo: librosActivos.length,
      ejemplaresTotales: librosActivos.reduce((total, libro) => total + libro.totalEjemplares, 0),
      ejemplaresEnSala: enSala,
      disponiblesPrestamo
    },
    categorias,
    faltantes
  });
});

// Cualquier otra ruta /api/* no existe
api.use((req, res) => {
  res.status(404).json({ codigo: 'RUTA_NO_ENCONTRADA', mensaje: 'Recurso no encontrado.' });
});

app.use('/api', api);

// ---------------------------------------------------------------------------
// Protección de páginas y frontend estático
// ---------------------------------------------------------------------------

const RUTA_INICIO_POR_ROL = {
  socio: '/pages/catalogo.html',
  bibliotecario: '/pages/panel-bibliotecario.html',
  director: '/pages/tablero-director.html'
};

const ROLES_POR_PAGINA = {
  '/catalogo.html': null,
  '/libro.html': null,
  '/reserva.html': ['socio'],
  '/confirmacion.html': ['socio'],
  '/historial.html': ['socio'],
  '/panel-bibliotecario.html': ['bibliotecario'],
  '/reportes.html': ['bibliotecario'],
  '/tablero-director.html': ['director']
};

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (!req.path.startsWith('/pages/')) return next();

  const archivo = req.path.replace('/pages', '');
  if (archivo === '/login.html') return next();

  const usuario = usuarioDeSesion(req);
  if (!usuario) {
    // Conserva la ruta original (con query) para volver después del login.
    return res.redirect(`/pages/login.html?volver=${encodeURIComponent(req.originalUrl)}`);
  }

  const roles = ROLES_POR_PAGINA[archivo];
  if (roles && !roles.includes(usuario.rol)) {
    return res.redirect(RUTA_INICIO_POR_ROL[usuario.rol] || '/');
  }

  next();
});

app.use(express.static(FRONTEND_DIR, { index: 'index.html' }));

app.use((req, res) => {
  res.status(404).send('404 - Página no encontrada');
});

// ---------------------------------------------------------------------------
// Manejo central de errores
// ---------------------------------------------------------------------------

app.use((error, req, res, next) => {
  if (error instanceof ErrorHTTP) {
    return res.status(error.status).json({ codigo: error.codigo, mensaje: error.message });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      codigo: 'JSON_INVALIDO',
      mensaje: 'El cuerpo de la petición no es JSON válido.'
    });
  }

  console.error(error);
  res.status(500).json({
    codigo: 'ERROR_INTERNO',
    mensaje: 'Ocurrió un error inesperado en el servidor.'
  });
});

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    // En Render la URL pública llega por variable de entorno; en local se usa
    // localhost. Es solo informativo, no afecta el funcionamiento.
    const urlPublica = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;

    console.log('');
    console.log('  BiblioTech backend en marcha');
    console.log(`  Frontend: ${urlPublica}`);
    console.log(`  API:      ${urlPublica}/api`);
    console.log('  Datos:    en memoria (se reinician al detener el servidor)');
    console.log('  Ctrl+C para detener el servidor');
    console.log('');
  });
}

module.exports = app;
