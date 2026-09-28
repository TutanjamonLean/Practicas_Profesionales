/**
 * BiblioTech - Hito 3: JavaScript principal
 * Funcionalidades: carga de datos, autenticación, navbar dinámico, localStorage
 */

// ============================================
// CONFIGURACIÓN Y UTILIDADES BASE
// ============================================

const RUTA_BASE = (() => {
  const path = window.location.pathname;
  // Si estamos en una página dentro de /pages/, subir un nivel
  if (path.includes('/pages/')) {
    return '../';
  }
  // Si estamos en la raíz o en subcarpetas de la raíz
  const depth = path.split('/').filter(p => p).length;
  return depth > 0 ? '../'.repeat(depth) : './';
})();

const RUTAS = {
  datos: `${RUTA_BASE}data/datos.json`,
  index: `${RUTA_BASE}index.html`,
  login: `${RUTA_BASE}pages/login.html`,
  catalogo: `${RUTA_BASE}pages/catalogo.html`,
  reserva: `${RUTA_BASE}pages/reserva.html`,
  confirmacion: `${RUTA_BASE}pages/confirmacion.html`,
  historial: `${RUTA_BASE}pages/historial.html`,
  panelBibliotecario: `${RUTA_BASE}pages/panel-bibliotecario.html`,
  tableroDirector: `${RUTA_BASE}pages/tablero-director.html`
};

// ============================================
// GESTIÓN DE DATOS (JSON + LOCALSTORAGE)
// ============================================

let cacheDatos = null;

/**
 * Obtiene los datos combinados: JSON inicial + localStorage
 * @returns {Promise<Object>} Datos completos de la aplicación
 */
async function obtenerDatos() {
  if (cacheDatos) return cacheDatos;

  try {
    const response = await fetch(RUTAS.datos);
    if (!response.ok) throw new Error('No se pudo cargar datos.json');
    const datosIniciales = await response.json();

    // Combinar con localStorage
    const prestamosLS = JSON.parse(localStorage.getItem('biblio_prestamos') || '[]');
    const solicitudesLS = JSON.parse(localStorage.getItem('biblio_solicitudes') || '[]');
    const devolucionesLS = JSON.parse(localStorage.getItem('biblio_devoluciones') || '[]');
    const morososLS = JSON.parse(localStorage.getItem('biblio_morosos') || '[]');
    const librosLS = JSON.parse(localStorage.getItem('biblio_libros') || '[]');

    cacheDatos = {
      ...datosIniciales,
      usuarios: datosIniciales.usuarios,
      libros: librosLS.length > 0 ? librosLS : datosIniciales.libros,
      prestamos: [...datosIniciales.prestamos, ...prestamosLS],
      solicitudesPendientes: [...datosIniciales.solicitudesPendientes, ...solicitudesLS],
      devolucionesHoy: [...datosIniciales.devolucionesHoy, ...devolucionesLS],
      sociosMorosos: [...datosIniciales.sociosMorosos, ...morososLS]
    };

    return cacheDatos;
  } catch (error) {
    console.error('Error cargando datos:', error);
    return {
      usuarios: [], libros: [], prestamos: [],
      solicitudesPendientes: [], devolucionesHoy: [], sociosMorosos: []
    };
  }
}

/**
 * Invalida el cache para forzar recarga
 */
function invalidarCache() {
  cacheDatos = null;
}

/**
 * Guarda un array en localStorage
 * @param {string} clave - Clave de localStorage
 * @param {Array} datos - Datos a guardar
 */
function guardarEnLS(clave, datos) {
  localStorage.setItem(clave, JSON.stringify(datos));
  invalidarCache();
}

/**
 * Agrega un elemento a un array en localStorage
 * @param {string} clave - Clave de localStorage
 * @param {Object} elemento - Elemento a agregar
 */
function agregarAListaLS(clave, elemento) {
  const lista = JSON.parse(localStorage.getItem(clave) || '[]');
  lista.push(elemento);
  guardarEnLS(clave, lista);
}

/**
 * Actualiza un elemento en un array de localStorage
 * @param {string} clave - Clave de localStorage
 * @param {Function} predicado - Función para encontrar el elemento
 * @param {Object} nuevosDatos - Datos a actualizar
 */
function actualizarEnLS(clave, predicado, nuevosDatos) {
  const lista = JSON.parse(localStorage.getItem(clave) || '[]');
  const idx = lista.findIndex(predicado);
  if (idx !== -1) {
    lista[idx] = { ...lista[idx], ...nuevosDatos };
    guardarEnLS(clave, lista);
  }
}

/**
 * Elimina un elemento de un array en localStorage
 * @param {string} clave - Clave de localStorage
 * @param {Function} predicado - Función para encontrar el elemento
 */
function eliminarDeLS(clave, predicado) {
  const lista = JSON.parse(localStorage.getItem(clave) || '[]');
  const filtrados = lista.filter(item => !predicado(item));
  guardarEnLS(clave, filtrados);
}

// ============================================
// AUTENTICACIÓN Y SESIÓN
// ============================================

const USUARIO_ACTUAL_KEY = 'biblio_usuario_actual';

/**
 * Inicia sesión de un usuario
 * @param {string} usuario - Nombre de usuario
 * @param {string} clave - Contraseña
 * @param {string} rol - Rol seleccionado
 * @returns {Promise<Object|null>} Usuario autenticado o null
 */
async function login(usuario, clave, rol) {
  const datos = await obtenerDatos();
  const user = datos.usuarios.find(u =>
    u.usuario === usuario && u.clave === clave && u.rol === rol
  );

  if (user) {
    // No guardar la clave en localStorage por seguridad
    const { clave: _, ...userSafe } = user;
    localStorage.setItem(USUARIO_ACTUAL_KEY, JSON.stringify(userSafe));
    return userSafe;
  }
  return null;
}

/**
 * Cierra la sesión actual
 */
function logout() {
  localStorage.removeItem(USUARIO_ACTUAL_KEY);
  const enPages = window.location.pathname.includes('/pages/');
  window.location.href = enPages ? '../index.html' : 'index.html';
}

/**
 * Obtiene el usuario actualmente logueado
 * @returns {Object|null} Usuario actual o null
 */
function obtenerUsuarioActual() {
  const data = localStorage.getItem(USUARIO_ACTUAL_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Verifica si hay un usuario logueado con el rol especificado
 * @param {...string} roles - Roles permitidos
 * @returns {boolean}
 */
function tieneRol(...roles) {
  const user = obtenerUsuarioActual();
  return user && roles.includes(user.rol);
}

/**
 * Redirige si no está autenticado o no tiene el rol
 * @param {...string} rolesPermitidos - Roles que pueden acceder
 */
function requerirAuth(...rolesPermitidos) {
  const user = obtenerUsuarioActual();
  if (!user || !rolesPermitidos.includes(user.rol)) {
    const enPages = window.location.pathname.includes('/pages/');
    window.location.href = enPages ? 'login.html' : 'pages/login.html';
    return false;
  }
  return true;
}

// ============================================
// NAVBAR DINÁMICO SEGÚN ROL
// ============================================

const NAV_CONFIG = {
  visitante: ['inicio', 'login', 'catalogo'],
  socio: ['inicio', 'catalogo', 'historial', 'logout'],
  bibliotecario: ['inicio', 'panelBibliotecario', 'logout'],
  director: ['inicio', 'tableroDirector', 'logout']
};

const NAV_LABELS = {
  inicio: { texto: 'Inicio', href: 'index.html', esRaiz: true },
  login: { texto: 'Iniciar sesión', href: 'pages/login.html' },
  catalogo: { texto: 'Catálogo', href: 'pages/catalogo.html' },
  historial: { texto: 'Mi historial', href: 'pages/historial.html' },
  panelBibliotecario: { texto: 'Panel bibliotecario', href: 'pages/panel-bibliotecario.html' },
  tableroDirector: { texto: 'Tablero del director', href: 'pages/tablero-director.html' },
  logout: { texto: 'Cerrar sesión', href: '#', accion: 'logout' }
};

/**
 * Renderiza la barra de navegación según el usuario logueado
 */
function renderizarNavbar() {
  const nav = document.querySelector('.nav-principal');
  if (!nav) return;

  const user = obtenerUsuarioActual();
  const rol = user?.rol || 'visitante';
  const permitidos = NAV_CONFIG[rol] || NAV_CONFIG.visitante;

  // Limpiar TODOS los enlaces existentes (el HTML tiene hardcodeados, los reemplazamos todos)
  nav.innerHTML = '';

  // Agregar enlaces según rol
  permitidos.forEach(key => {
    const config = NAV_LABELS[key];
    if (!config) return;

    const a = document.createElement('a');
    a.textContent = config.texto;

    if (config.accion === 'logout') {
      a.href = '#';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    } else {
      // Ajustar ruta según si estamos en pages/ o raíz
      const enPages = window.location.pathname.includes('/pages/');
      
      if (config.esRaiz) {
        // Para index.html (raíz)
        a.href = enPages ? '../index.html' : 'index.html';
      } else {
        // Para páginas en /pages/
        a.href = enPages ? config.href.replace('pages/', '') : config.href;
      }
    }

    nav.appendChild(a);
  });

  // Marcar enlace activo
  const paginaActual = window.location.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === paginaActual || (paginaActual === 'index.html' && href === '../index.html'))) {
      a.style.backgroundColor = '#c9a227';
      a.style.color = '#0d2b44';
    }
  });
}

/**
 * Muestra/oculta elementos según el rol del usuario
 * @param {string} selector - Selector CSS de los elementos
 * @param {string[]} roles - Roles que pueden ver el elemento
 */
function filtrarPorRol(selector, roles) {
  const user = obtenerUsuarioActual();
  const elementos = document.querySelectorAll(selector);
  const puedeVer = user && roles.includes(user.rol);

  elementos.forEach(el => {
    el.style.display = puedeVer ? '' : 'none';
  });
}

// ============================================
// FUNCIONES DE UTILIDAD PARA RENDERIZADO
// ============================================

/**
 * Formatea una fecha DD/MM/YYYY a objeto Date para comparaciones
 * @param {string} fechaStr - Fecha en formato DD/MM/YYYY
 * @returns {Date|null}
 */
function parsearFecha(fechaStr) {
  if (!fechaStr) return null;
  const [dia, mes, anio] = fechaStr.split('/').map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Verifica si un préstamo está vencido
 * @param {Object} prestamo - Objeto préstamo
 * @returns {boolean}
 */
function estaVencido(prestamo) {
  if (prestamo.estado !== 'activo' && prestamo.estado !== 'pendiente') return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = parsearFecha(prestamo.fechaDevolucion);
  return venc && venc < hoy;
}

/**
 * Obtiene el nombre del libro por ID
 * @param {Array} libros - Array de libros
 * @param {number} libroId - ID del libro
 * @returns {string}
 */
function obtenerTituloLibro(libros, libroId) {
  const libro = libros.find(l => l.id === libroId);
  return libro ? libro.titulo : 'Desconocido';
}

/**
 * Obtiene el autor del libro por ID
 * @param {Array} libros - Array de libros
 * @param {number} libroId - ID del libro
 * @returns {string}
 */
function obtenerAutorLibro(libros, libroId) {
  const libro = libros.find(l => l.id === libroId);
  return libro ? libro.autor : 'Desconocido';
}

/**
 * Genera un ID único simple
 * @returns {number}
 */
function generarId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/**
 * Muestra un mensaje de aviso en la página
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - 'exito' | 'error' | 'info'
 * @param {HTMLElement} contenedor - Elemento contenedor (opcional)
 */
function mostrarAviso(mensaje, tipo = 'info', contenedor = null) {
  const target = contenedor || document.querySelector('main');
  if (!target) return;

  // Remover avisos previos
  target.querySelectorAll('.aviso-dinamico').forEach(a => a.remove());

  const div = document.createElement('div');
  div.className = `aviso aviso-${tipo} aviso-dinamico`;
  div.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  div.innerHTML = `<strong>${tipo === 'error' ? 'Error:' : tipo === 'exito' ? 'Éxito:' : 'Aviso:'}</strong> ${mensaje}`;

  // Insertar al principio del main
  target.insertBefore(div, target.firstChild);

  // Auto-eliminar después de 5 segundos
  setTimeout(() => div.remove(), 5000);
}

// ============================================
// INICIALIZACIÓN COMÚN
// ============================================

/**
 * Inicializa la página: navbar, usuario, etc.
 */
async function inicializarPagina() {
  await obtenerDatos(); // Precargar datos
  renderizarNavbar();

  // Exponer funciones globalmente para uso en páginas
  window.BiblioTech = {
    obtenerDatos,
    invalidarCache,
    login,
    logout,
    obtenerUsuarioActual,
    tieneRol,
    requerirAuth,
    renderizarNavbar,
    filtrarPorRol,
    agregarAListaLS,
    actualizarEnLS,
    eliminarDeLS,
    mostrarAviso,
    parsearFecha,
    estaVencido,
    obtenerTituloLibro,
    obtenerAutorLibro,
    generarId,
    RUTAS
  };
}

// Auto-inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarPagina);