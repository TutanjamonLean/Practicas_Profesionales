/**
 * BiblioTech - Cliente de la API
 *
 * Este archivo concentra la comunicación con el backend, el manejo de sesión,
 * la navbar por rol y utilidades compartidas por todas las páginas.
 */

// ============================================
// COMUNICACIÓN CON LA API
// ============================================

// Permite apuntar a un backend en otro host/puerto (por ejemplo, al abrir el
// frontend con Live Server). Por defecto usa el mismo origen.
const API_BASE = (() => {
  if (window.BIBLIO_API_URL) return window.BIBLIO_API_URL;
  if (window.location.protocol === 'file:') return 'http://localhost:8080/api';
  if (window.location.port && window.location.port !== '8080') {
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  return '/api';
})();

// ============================================
// INDICADOR GLOBAL DE CARGA
// ============================================

let peticionesActivas = 0;

function barraDeCarga() {
  let barra = document.getElementById('biblio-cargando');
  if (!barra) {
    barra = document.createElement('div');
    barra.id = 'biblio-cargando';
    barra.setAttribute('role', 'progressbar');
    barra.setAttribute('aria-label', 'Cargando datos');
    barra.setAttribute('aria-hidden', 'true');
    (document.body || document.documentElement).appendChild(barra);
  }
  return barra;
}

function iniciarCarga() {
  peticionesActivas += 1;
  const barra = barraDeCarga();
  barra.classList.add('activo');
  barra.setAttribute('aria-hidden', 'false');
}

function finalizarCarga() {
  peticionesActivas = Math.max(0, peticionesActivas - 1);
  if (peticionesActivas > 0) return;

  const barra = document.getElementById('biblio-cargando');
  if (!barra) return;
  barra.classList.remove('activo');
  barra.setAttribute('aria-hidden', 'true');
}

/**
 * Realiza una petición a la API.
 * @param {string} ruta - Ruta relativa, por ejemplo "/libros".
 * @param {Object} opciones - { metodo, cuerpo, ... }
 * @returns {Promise<any>}
 */
async function api(ruta, opciones = {}) {
  const { metodo = 'GET', cuerpo, headers, ...resto } = opciones;
  const config = {
    method: metodo,
    credentials: 'include',
    ...resto
  };

  if (cuerpo !== undefined) {
    config.headers = { 'Content-Type': 'application/json', ...(headers || {}) };
    config.body = JSON.stringify(cuerpo);
  } else if (headers) {
    config.headers = headers;
  }

  iniciarCarga();

  try {
    let respuesta;
    try {
      respuesta = await fetch(`${API_BASE}${ruta}`, config);
    } catch (error) {
      const errorRed = new Error(
        'No se pudo conectar con el servidor. Verificá que el backend esté en marcha.'
      );
      errorRed.codigo = 'ERROR_RED';
      throw errorRed;
    }

    let datos = null;
    const texto = await respuesta.text();
    if (texto) {
      try {
        datos = JSON.parse(texto);
      } catch (error) {
        datos = null;
      }
    }

    if (!respuesta.ok) {
      const error = new Error(
        (datos && datos.mensaje) || `Error ${respuesta.status} al comunicarse con el servidor`
      );
      error.status = respuesta.status;
      error.codigo = datos ? datos.codigo : null;
      throw error;
    }

    return datos;
  } finally {
    finalizarCarga();
  }
}

// ============================================
// SESIÓN
// ============================================

let cacheSesion;

/**
 * Devuelve el usuario de la sesión actual, o null si no hay sesión.
 * @param {boolean} forzar - Ignora la caché y consulta al servidor.
 */
async function obtenerSesion(forzar = false) {
  if (cacheSesion !== undefined && !forzar) return cacheSesion;

  try {
    const respuesta = await api('/auth/me');
    cacheSesion = respuesta.usuario;
  } catch (error) {
    if (error.status === 401) {
      cacheSesion = null;
    } else {
      throw error;
    }
  }

  return cacheSesion;
}

function limpiarSesion() {
  cacheSesion = null;
}

/**
 * Inicia sesión contra el servidor. El rol se obtiene de la cuenta, no se elige.
 * @param {string} usuario
 * @param {string} clave
 * @returns {Promise<Object>}
 */
async function iniciarSesion(usuario, clave) {
  const respuesta = await api('/auth/login', {
    metodo: 'POST',
    cuerpo: { usuario, clave }
  });
  cacheSesion = respuesta.usuario;
  return respuesta.usuario;
}

async function cerrarSesion() {
  if (!confirmarAccion('¿Estás seguro de que querés cerrar sesión?')) {
    return;
  }

  try {
    await api('/auth/logout', { metodo: 'POST' });
  } catch (error) {
    // Aunque falle la petición, cerramos la sesión local.
  } finally {
    limpiarSesion();
    window.location.href = '/index.html';
  }
}

const RUTA_INICIO_POR_ROL = {
  socio: '/pages/catalogo.html',
  bibliotecario: '/pages/panel-bibliotecario.html',
  director: '/pages/tablero-director.html'
};

function rutaInicio(rol) {
  return RUTA_INICIO_POR_ROL[rol] || '/index.html';
}

/**
 * Exige una sesión (y opcionalmente un rol) antes de continuar.
 * Redirige al login o al inicio del rol si no corresponde.
 * @param {...string} roles
 * @returns {Promise<Object|null>} Usuario o null si redirigió.
 */
async function requerirSesion(...roles) {
  const usuario = await obtenerSesion(true);

  if (!usuario) {
    window.location.replace('/pages/login.html');
    return null;
  }

  if (roles.length > 0 && !roles.includes(usuario.rol)) {
    window.location.replace(rutaInicio(usuario.rol));
    return null;
  }

  return usuario;
}

// ============================================
// NAVBAR DINÁMICO
// ============================================

const NAV_CONFIG = {
  visitante: ['inicio', 'login'],
  socio: ['inicio', 'catalogo', 'historial', 'logout'],
  bibliotecario: ['inicio', 'panelBibliotecario', 'reportes', 'logout'],
  director: ['inicio', 'tableroDirector', 'logout']
};

const NAV_LABELS = {
  inicio: { texto: 'Inicio', href: '/index.html' },
  login: { texto: 'Iniciar sesión', href: '/pages/login.html' },
  catalogo: { texto: 'Catálogo', href: '/pages/catalogo.html' },
  historial: { texto: 'Mi historial', href: '/pages/historial.html' },
  panelBibliotecario: { texto: 'Panel bibliotecario', href: '/pages/panel-bibliotecario.html' },
  reportes: { texto: 'Reportes', href: '/pages/reportes.html' },
  tableroDirector: { texto: 'Tablero del director', href: '/pages/tablero-director.html' },
  logout: { texto: 'Cerrar sesión', href: '#', accion: 'logout' }
};

/**
 * Renderiza la barra de navegación según el rol del usuario.
 */
function renderizarNavbar() {
  const nav = document.querySelector('.nav-principal');
  if (!nav) return;

  const usuario = cacheSesion;
  const rol = usuario ? usuario.rol : 'visitante';
  const permitidos = NAV_CONFIG[rol] || NAV_CONFIG.visitante;

  nav.innerHTML = '';

  permitidos.forEach((clave) => {
    const config = NAV_LABELS[clave];
    if (!config) return;

    const enlace = document.createElement('a');
    enlace.textContent = config.texto;

    if (config.accion === 'logout') {
      enlace.href = '#';
      enlace.addEventListener('click', (evento) => {
        evento.preventDefault();
        cerrarSesion();
      });
    } else {
      enlace.href = config.href;
    }

    nav.appendChild(enlace);
  });

  if (usuario) {
    const saludo = document.createElement('span');
    saludo.className = 'nav-usuario';
    saludo.textContent = `Hola, ${usuario.nombre}`;
    nav.appendChild(saludo);
  }

  // Marcar enlace activo
  const rutaActual = window.location.pathname;
  nav.querySelectorAll('a').forEach((enlace) => {
    if (enlace.getAttribute('href') === rutaActual) {
      enlace.classList.add('activo');
    }
  });
}

// ============================================
// UTILIDADES
// ============================================

/**
 * Pide confirmación antes de ejecutar una acción que modifica datos.
 * @param {string} mensaje
 * @returns {boolean}
 */
function confirmarAccion(mensaje) {
  return window.confirm(mensaje);
}

/** Escapa texto para insertarlo como HTML. */
function escaparHtml(valor) {
  return String(valor ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Convierte DD/MM/YYYY a Date (medianoche local). */
function parsearFecha(texto) {
  if (!texto) return null;
  const [dia, mes, anio] = String(texto).split('/').map(Number);
  if (!dia || !mes || !anio) return null;
  const fecha = new Date(anio, mes - 1, dia);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function formatearFecha(fecha) {
  const dos = (n) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/** Fecha de hoy en formato YYYY-MM-DD (hora local). */
function hoyISO() {
  const hoy = new Date();
  const dos = (n) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}

function estaVencido(prestamo) {
  if (!prestamo || prestamo.estado !== 'activo') return false;
  const vencimiento = parsearFecha(prestamo.fechaDevolucion);
  if (!vencimiento) return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return vencimiento < hoy;
}

function diasAtraso(prestamo) {
  const vencimiento = parsearFecha(prestamo.fechaDevolucion);
  if (!vencimiento) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dias = Math.round((hoy - vencimiento) / 86400000);
  return dias > 0 ? dias : 0;
}

/**
 * Muestra un aviso en la página.
 * @param {string} mensaje
 * @param {'exito'|'error'|'info'} tipo
 * @param {HTMLElement|null} contenedor
 */
function mostrarAviso(mensaje, tipo = 'info', contenedor = null) {
  const destino = contenedor || document.querySelector('main');
  if (!destino) return;

  destino.querySelectorAll('.aviso-dinamico').forEach((aviso) => aviso.remove());

  const aviso = document.createElement('div');
  aviso.className = `aviso aviso-${tipo} aviso-dinamico`;
  aviso.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  aviso.setAttribute('aria-live', tipo === 'error' ? 'assertive' : 'polite');
  aviso.innerHTML = `<strong>${tipo === 'error' ? 'Error:' : tipo === 'exito' ? 'Éxito:' : 'Aviso:'}</strong> ${escaparHtml(mensaje)}`;

  destino.insertBefore(aviso, destino.firstChild);
  setTimeout(() => aviso.remove(), 6000);
}

// ============================================
// INICIALIZACIÓN COMÚN
// ============================================

async function inicializarPagina() {
  await obtenerSesion();
  renderizarNavbar();

  // Mostrar la versión del sistema donde la página la requiera
  try {
    const config = await api('/config');
    document.querySelectorAll('[data-version]').forEach((elemento) => {
      elemento.textContent = config.version;
    });
  } catch (error) {
    // Si falla, no es crítico para la página.
  }
}

// Exponer funciones globalmente para el código de cada página
window.BiblioTech = {
  api,
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
  limpiarSesion,
  requerirSesion,
  renderizarNavbar,
  rutaInicio,
  mostrarAviso,
  confirmarAccion,
  escaparHtml,
  parsearFecha,
  formatearFecha,
  hoyISO,
  estaVencido,
  diasAtraso
};

document.addEventListener('DOMContentLoaded', inicializarPagina);
