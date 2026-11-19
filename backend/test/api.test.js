/**
 * Pruebas de integración de la API de BiblioTech.
 *
 * El backend trabaja con datos en memoria: cada ejecución parte de la semilla
 * y no modifica archivos.
 * Ejecutar con: npm test
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

// Se deriva de la semilla para que agregar libros no rompa las pruebas.
const DATOS_INICIALES = require('../data/semilla.json');
const TOTAL_LIBROS_INICIAL = DATOS_INICIALES.libros.filter((libro) => !libro.eliminado).length;

const app = require('../index.js');

let servidor;
let base;
let cookie = null;

/**
 * Realiza una petición a la API de prueba.
 * @returns {Promise<{status:number, data:any, headers:Headers}>}
 */
async function pedir(ruta, { metodo = 'GET', cuerpo, conCookie = true, redirigir = true } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (conCookie && cookie) headers.Cookie = cookie;

  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    redirect: redirigir ? 'follow' : 'manual'
  });

  const cookiesNuevas = typeof respuesta.headers.getSetCookie === 'function'
    ? respuesta.headers.getSetCookie()
    : [];
  if (cookiesNuevas.length > 0) {
    cookie = cookiesNuevas[0].split(';')[0];
  }

  const texto = await respuesta.text();
  let data = null;
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch (error) {
      data = texto;
    }
  }

  return { status: respuesta.status, data, headers: respuesta.headers };
}

async function login(usuario, clave = '1234') {
  const respuesta = await pedir('/api/auth/login', {
    metodo: 'POST',
    cuerpo: { usuario, clave }
  });
  assert.equal(respuesta.status, 200, `login de ${usuario} debería ser 200`);
  return respuesta.data.usuario;
}

test('API BiblioTech', async (t) => {
  await new Promise((resolve) => {
    servidor = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${servidor.address().port}`;

  t.after(() => {
    servidor.close();
  });

  await t.test('health responde y no requiere sesión', async () => {
    const respuesta = await pedir('/api/health', { conCookie: false });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.data.estado, 'ok');
    assert.equal(respuesta.data.version, '2.0.0');
  });

  await t.test('el catálogo requiere sesión', async () => {
    cookie = null;
    const respuesta = await pedir('/api/libros', { conCookie: false });
    assert.equal(respuesta.status, 401);
    assert.equal(respuesta.data.codigo, 'NO_AUTENTICADO');
  });

  await t.test('login inválido devuelve 401', async () => {
    const respuesta = await pedir('/api/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario: 'mgarcia', clave: 'incorrecta' }
    });
    assert.equal(respuesta.status, 401);
    assert.equal(respuesta.data.codigo, 'CREDENCIALES_INVALIDAS');
  });

  await t.test('login de socio y consulta de sesión', async () => {
    const usuario = await login('mgarcia');
    assert.equal(usuario.nombre, 'Mariana');
    assert.equal(usuario.rol, 'socio');
    assert.equal(usuario.clave, undefined);

    const sesion = await pedir('/api/auth/me');
    assert.equal(sesion.status, 200);
    assert.equal(sesion.data.usuario.nroSocio, '1001');
  });

  await t.test('el socio consulta sus reservas para ver el ticket', async () => {
    const reservas = await pedir('/api/solicitudes/mias');
    assert.equal(reservas.status, 200);
    assert.ok(reservas.data.total >= 1);
    assert.ok(reservas.data.solicitudes.every((solicitud) => solicitud.nroSocio === '1001'));

    const ids = reservas.data.solicitudes.map((solicitud) => solicitud.id);
    const idsOrdenados = ids.slice().sort((a, b) => b - a);
    assert.deepEqual(ids, idsOrdenados, 'las reservas propias deben venir de la más reciente a la más antigua');
  });

  await t.test('el catálogo devuelve todos los libros activos', async () => {
    const respuesta = await pedir('/api/libros');
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.data.total, TOTAL_LIBROS_INICIAL);
    assert.ok(respuesta.data.libros.find((libro) => libro.id === 4));
    assert.equal(respuesta.data.libros.find((libro) => libro.id === 6).estado, 'solo-sala');
  });

  await t.test('reserva válida y luego rechazo por cupo de 3', async () => {
    const antes = await pedir('/api/libros/5');
    const reserva = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 5 }
    });
    assert.equal(reserva.status, 201);
    assert.equal(reserva.data.solicitud.estado, 'pendiente');
    assert.equal(reserva.data.libro.disponibles, antes.data.libro.disponibles - 1);

    const cuarta = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 9 }
    });
    assert.equal(cuarta.status, 409);
    assert.equal(cuarta.data.codigo, 'CUPO_EXCEDIDO');
  });

  await t.test('una colección única no se puede reservar', async () => {
    await login('lbenitez');
    const respuesta = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 6 }
    });
    assert.equal(respuesta.status, 409);
    assert.equal(respuesta.data.codigo, 'LIBRO_SOLO_SALA');
  });

  await t.test('un libro sin stock no se puede reservar', async () => {
    // Se agota el último ejemplar disponible y el siguiente intento debe fallar.
    const primera = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 7 }
    });
    assert.equal(primera.status, 201);

    const segunda = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 7 }
    });
    assert.equal(segunda.status, 409);
    assert.equal(segunda.data.codigo, 'SIN_STOCK');
  });

  await t.test('el panel enmascara a los socios menores', async () => {
    await login('blopez');

    const solicitudes = await pedir('/api/solicitudes');
    assert.equal(solicitudes.status, 200);

    const aprobadas = await pedir('/api/solicitudes?estado=aprobada');
    assert.equal(aprobadas.status, 200);
    const fechas = aprobadas.data.solicitudes.map((solicitud) => {
      const [dia, mes, anio] = solicitud.fechaSolicitud.split('/');
      return `${anio}${mes}${dia}`;
    });
    assert.deepEqual(
      fechas,
      fechas.slice().sort().reverse(),
      'las solicitudes deben venir de la más reciente a la más antigua'
    );

    const delMenor = solicitudes.data.solicitudes.find((solicitud) => solicitud.nroSocio === '1003');
    assert.ok(delMenor, 'debe aparecer la solicitud del socio menor');
    assert.equal(delMenor.nombreVisible, 'Lucía');
    assert.equal(Object.prototype.hasOwnProperty.call(delMenor, 'apellido'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(delMenor, 'direccion'), false);
    assert.equal(JSON.stringify(solicitudes.data).includes('Benítez'), false);

    const prestamos = await pedir('/api/prestamos');
    assert.equal(prestamos.status, 200);
    assert.equal(JSON.stringify(prestamos.data).includes('Benítez'), false);
  });

  await t.test('aprobar una solicitud genera el préstamo sin duplicar stock', async () => {
    const solicitudes = await pedir('/api/solicitudes');
    const solicitud = solicitudes.data.solicitudes.find(
      (item) => item.nroSocio === '1001' && item.libro.id === 5
    );
    assert.ok(solicitud, 'debe existir la solicitud de Mariana');

    const antes = await pedir('/api/libros/5');
    const aprobacion = await pedir(`/api/solicitudes/${solicitud.id}/aprobar`, { metodo: 'POST' });
    assert.equal(aprobacion.status, 200);
    assert.equal(aprobacion.data.prestamo.estado, 'activo');
    assert.equal(aprobacion.data.prestamo.libro.id, 5);

    const catalogo = await pedir('/api/libros/5');
    assert.equal(
      catalogo.data.libro.disponibles,
      antes.data.libro.disponibles,
      'el stock ya estaba reservado'
    );
  });

  await t.test('registrar devolución repone el stock y cierra el préstamo', async () => {
    const prestamos = await pedir('/api/prestamos');
    const prestamo = prestamos.data.prestamos.find(
      (item) => item.nroSocio === '1001' && item.libro.id === 5
    );
    assert.ok(prestamo);

    const antes = await pedir('/api/libros/5');
    const devolucion = await pedir(`/api/prestamos/${prestamo.id}/devolucion`, { metodo: 'POST' });
    assert.equal(devolucion.status, 200);
    assert.equal(devolucion.data.prestamo.estado, 'devuelto');
    assert.ok(devolucion.data.prestamo.fechaDevolucionReal);

    const catalogo = await pedir('/api/libros/5');
    assert.equal(
      catalogo.data.libro.disponibles,
      Math.min(antes.data.libro.disponibles + 1, antes.data.libro.totalEjemplares)
    );
  });

  await t.test('rechazar una solicitud repone el stock', async () => {
    const solicitudes = await pedir('/api/solicitudes');
    const solicitud = solicitudes.data.solicitudes.find((item) => item.nroSocio === '1003');
    assert.ok(solicitud);

    const antes = await pedir(`/api/libros/${solicitud.libro.id}`);
    const rechazo = await pedir(`/api/solicitudes/${solicitud.id}/rechazar`, { metodo: 'POST' });
    assert.equal(rechazo.status, 200);
    assert.equal(rechazo.data.solicitud.estado, 'rechazada');

    const catalogo = await pedir(`/api/libros/${solicitud.libro.id}`);
    assert.equal(
      catalogo.data.libro.disponibles,
      Math.min(antes.data.libro.disponibles + 1, antes.data.libro.totalEjemplares)
    );
  });

  await t.test('alta y baja de ejemplares actualizan el inventario', async () => {
    const antes = await pedir('/api/libros/1');

    const alta = await pedir('/api/libros/1/ejemplares', {
      metodo: 'POST',
      cuerpo: { cantidad: 1 }
    });
    assert.equal(alta.status, 200);
    assert.equal(alta.data.libro.totalEjemplares, antes.data.libro.totalEjemplares + 1);
    assert.equal(alta.data.libro.disponibles, antes.data.libro.disponibles + 1);

    const baja = await pedir('/api/libros/1/baja', {
      metodo: 'POST',
      cuerpo: { motivo: 'Deteriorado' }
    });
    assert.equal(baja.status, 200);
    assert.equal(baja.data.libro.totalEjemplares, antes.data.libro.totalEjemplares);
    assert.equal(baja.data.libro.disponibles, antes.data.libro.disponibles);
  });

  await t.test('notificación al moroso y lectura por parte del socio', async () => {
    const notificacion = await pedir('/api/notificaciones', {
      metodo: 'POST',
      cuerpo: {
        nroSocio: '1002',
        libroId: 8,
        motivo: 'Préstamo vencido: Pedro Páramo.'
      }
    });
    assert.equal(notificacion.status, 201);

    await login('psuarez');
    const misNotificaciones = await pedir('/api/notificaciones/mias');
    assert.equal(misNotificaciones.status, 200);
    assert.ok(misNotificaciones.data.total >= 1);

    const sinLeer = misNotificaciones.data.notificaciones.find((item) => !item.leida);
    assert.ok(sinLeer);

    const lectura = await pedir(`/api/notificaciones/${sinLeer.id}/leida`, { metodo: 'POST' });
    assert.equal(lectura.status, 200);
    assert.equal(lectura.data.notificacion.leida, true);
  });

  await t.test('reporte de vencidos con datos en vivo', async () => {
    await login('blopez');
    const reporte = await pedir('/api/prestamos/vencidos');
    assert.equal(reporte.status, 200);
    assert.ok(reporte.data.total >= 1);
    assert.ok(reporte.data.generadoEn);

    const vencido = reporte.data.prestamos.find((prestamo) => prestamo.nroSocio === '1002');
    assert.ok(vencido);
    assert.ok(vencido.diasAtraso > 0);

    const morosos = await pedir('/api/reportes/morosos');
    assert.equal(morosos.status, 200);
    assert.ok(morosos.data.totalSocios >= 1);
    assert.equal(morosos.data.totalPrestamos, morosos.data.vencidos.length);

    const socioMoroso = morosos.data.socios.find((socio) => socio.nroSocio === '1002');
    assert.ok(socioMoroso);
    assert.ok(socioMoroso.prestamosVencidos >= 1);
    assert.ok(socioMoroso.diasAtrasoMaximo > 0);
    assert.ok(Array.isArray(socioMoroso.titulos));
  });

  await t.test('tablero del director y control de permisos', async () => {
    await login('dperez');
    const tablero = await pedir('/api/dashboard');
    assert.equal(tablero.status, 200);
    assert.equal(tablero.data.indicadores.titulosCatalogo, TOTAL_LIBROS_INICIAL);
    assert.ok(Array.isArray(tablero.data.categorias));
    assert.ok(Array.isArray(tablero.data.faltantes));

    await login('mgarcia');
    const prohibido = await pedir('/api/dashboard');
    assert.equal(prohibido.status, 403);
    assert.equal(prohibido.data.codigo, 'SIN_PERMISO');
  });

  await t.test('el bibliotecario agrega un libro nuevo al catálogo', async () => {
    await login('blopez');
    const creacion = await pedir('/api/libros', {
      metodo: 'POST',
      cuerpo: {
        titulo: 'Libro de prueba automatizada',
        autor: 'Equipo BiblioTech',
        genero: 'ensayo',
        anio: 2026,
        totalEjemplares: 2,
        descripcion: 'Registro creado por las pruebas de integración.'
      }
    });

    assert.equal(creacion.status, 201);
    assert.equal(creacion.data.libro.titulo, 'Libro de prueba automatizada');
    assert.equal(creacion.data.libro.totalEjemplares, 2);
    assert.equal(creacion.data.libro.disponibles, 2);

    const catalogo = await pedir('/api/libros');
    assert.equal(catalogo.data.total, TOTAL_LIBROS_INICIAL + 1);
    assert.ok(catalogo.data.libros.some((libro) => libro.id === creacion.data.libro.id));
  });

  await t.test('las páginas están protegidas en el servidor', async () => {
    cookie = null;
    const sinSesion = await pedir('/pages/panel-bibliotecario.html', {
      conCookie: false,
      redirigir: false
    });
    assert.equal(sinSesion.status, 302);
    const destinoLogin = new URL(sinSesion.headers.get('location'), 'http://localhost');
    assert.equal(destinoLogin.pathname, '/pages/login.html');
    assert.equal(destinoLogin.searchParams.get('volver'), '/pages/panel-bibliotecario.html');

    const sinSesionLibro = await pedir('/pages/libro.html?id=1', {
      conCookie: false,
      redirigir: false
    });
    assert.equal(sinSesionLibro.status, 302);
    const destinoLibro = new URL(sinSesionLibro.headers.get('location'), 'http://localhost');
    assert.equal(destinoLibro.pathname, '/pages/login.html');
    assert.equal(destinoLibro.searchParams.get('volver'), '/pages/libro.html?id=1');

    const headSinSesion = await pedir('/pages/panel-bibliotecario.html', {
      metodo: 'HEAD',
      conCookie: false,
      redirigir: false
    });
    assert.equal(headSinSesion.status, 302);

    await login('mgarcia');
    const socioEnPanel = await pedir('/pages/panel-bibliotecario.html', { redirigir: false });
    assert.equal(socioEnPanel.status, 302);
    assert.equal(socioEnPanel.headers.get('location'), '/pages/catalogo.html');

    const socioEnReportes = await pedir('/pages/reportes.html', { redirigir: false });
    assert.equal(socioEnReportes.status, 302);
    assert.equal(socioEnReportes.headers.get('location'), '/pages/catalogo.html');

    await login('blopez');
    const bibliotecarioEnPanel = await pedir('/pages/panel-bibliotecario.html', { redirigir: false });
    assert.equal(bibliotecarioEnPanel.status, 200);

    const bibliotecarioEnReportes = await pedir('/pages/reportes.html', { redirigir: false });
    assert.equal(bibliotecarioEnReportes.status, 200);
  });

  await t.test('registrar un préstamo responde en menos de 3 segundos', async () => {
    await login('lbenitez');
    const inicio = process.hrtime.bigint();
    const respuesta = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 9 }
    });
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;

    assert.equal(respuesta.status, 201);
    assert.ok(ms < 3000, `la reserva tardó ${ms.toFixed(1)} ms`);
    console.log(`      reserva registrada en ${ms.toFixed(1)} ms`);
  });

  await t.test('soporta 60 consultas en paralelo', async () => {
    await login('blopez');
    const inicio = Date.now();

    const respuestas = await Promise.all(
      Array.from({ length: 60 }, () => pedir('/api/libros'))
    );

    const duracion = Date.now() - inicio;
    assert.ok(respuestas.every((respuesta) => respuesta.status === 200));
    assert.ok(duracion < 60000, `60 consultas tardaron ${duracion} ms`);
    console.log(`      60 consultas completadas en ${duracion} ms`);
  });

  await t.test('los libros más pedidos son públicos y se ordenan por demanda', async () => {
    cookie = null;
    const respuesta = await pedir('/api/libros/populares', { conCookie: false });
    assert.equal(respuesta.status, 200);
    assert.ok(Array.isArray(respuesta.data.libros));
    assert.ok(respuesta.data.libros.length <= 6);

    const pedidos = respuesta.data.libros.map(
      (libro) => libro.vecesPrestado + libro.vecesSolicitado
    );
    assert.deepEqual(pedidos, pedidos.slice().sort((a, b) => b - a));
  });

  await t.test('las reseñas se crean, actualizan y respetan la privacidad', async () => {
    await login('mgarcia');

    const creada = await pedir('/api/libros/2/resenias', {
      metodo: 'POST',
      cuerpo: { puntuacion: 5, comentario: 'Excelente novela para releer.' }
    });
    assert.equal(creada.status, 201);
    assert.equal(creada.data.resenia.propia, true);
    assert.equal(creada.data.resenia.autor, 'Mariana García');

    const actualizada = await pedir('/api/libros/2/resenias', {
      metodo: 'POST',
      cuerpo: { puntuacion: 4, comentario: 'La volví a leer y me gustó igual.' }
    });
    assert.equal(actualizada.status, 200);
    assert.equal(actualizada.data.resenia.puntuacion, 4);

    const lista = await pedir('/api/libros/2/resenias');
    assert.equal(lista.status, 200);
    assert.equal(lista.data.total, 1);
    assert.equal(lista.data.promedio, 4);

    await login('lbenitez');
    const deMenor = await pedir('/api/libros/5/resenias', {
      metodo: 'POST',
      cuerpo: { puntuacion: 5, comentario: 'Me gustó mucho.' }
    });
    assert.equal(deMenor.status, 201);
    assert.equal(deMenor.data.resenia.autor, 'Lucía');

    await login('blopez');
    const leidas = await pedir('/api/libros/5/resenias');
    assert.equal(leidas.status, 200);
    const reseniaMenor = leidas.data.resenias.find(
      (resenia) => resenia.comentario === 'Me gustó mucho.'
    );
    assert.ok(reseniaMenor);
    assert.equal(reseniaMenor.autor, 'Lucía');
    assert.equal(JSON.stringify(leidas.data).includes('Benítez'), false);
  });

  await t.test('el bibliotecario edita y elimina lógicamente un libro', async () => {
    await login('blopez');

    const catalogo = await pedir('/api/libros');
    const libro = catalogo.data.libros.find(
      (item) => item.titulo === 'Libro de prueba automatizada'
    );
    assert.ok(libro, 'debe existir el libro creado por la prueba anterior');

    const edicion = await pedir(`/api/libros/${libro.id}`, {
      metodo: 'PUT',
      cuerpo: {
        titulo: 'Libro editado por prueba',
        autor: 'Equipo BiblioTech',
        genero: 'ensayo',
        anio: 2026,
        descripcion: 'Título actualizado por la prueba de edición.',
        soloSala: false
      }
    });
    assert.equal(edicion.status, 200);
    assert.equal(edicion.data.libro.titulo, 'Libro editado por prueba');

    const detalle = await pedir(`/api/libros/${libro.id}`);
    assert.equal(detalle.status, 200);
    assert.equal(detalle.data.libro.descripcion, 'Título actualizado por la prueba de edición.');

    const eliminacion = await pedir(`/api/libros/${libro.id}`, { metodo: 'DELETE' });
    assert.equal(eliminacion.status, 200);
    assert.equal(eliminacion.data.eliminado, true);

    const despues = await pedir('/api/libros');
    assert.equal(despues.data.total, TOTAL_LIBROS_INICIAL);
    assert.equal(despues.data.libros.some((item) => item.id === libro.id), false);

    const noEncontrado = await pedir(`/api/libros/${libro.id}`);
    assert.equal(noEncontrado.status, 404);

    const populares = await pedir('/api/libros/populares', { conCookie: false });
    assert.equal(populares.data.libros.some((item) => item.id === libro.id), false);
  });

  await t.test('una cookie de sesión malformada no rompe el servidor', async () => {
    cookie = 'biblio_sesion=%';
    const respuesta = await pedir('/api/auth/me');
    assert.equal(respuesta.status, 401);
    assert.equal(respuesta.data.codigo, 'NO_AUTENTICADO');
    cookie = null;
  });

  await t.test('el alta de libros y las notificaciones validan los datos', async () => {
    await login('blopez');

    const espacios = await pedir('/api/libros', {
      metodo: 'POST',
      cuerpo: { titulo: '   ', autor: 'Autor', genero: 'ensayo' }
    });
    assert.equal(espacios.status, 400);
    assert.equal(espacios.data.codigo, 'DATOS_INCOMPLETOS');

    const decimales = await pedir('/api/libros', {
      metodo: 'POST',
      cuerpo: { titulo: 'Libro decimal', autor: 'Autor', genero: 'ensayo', totalEjemplares: 2.5 }
    });
    assert.equal(decimales.status, 400);
    assert.equal(decimales.data.codigo, 'DATO_INVALIDO');

    const anioInvalido = await pedir('/api/libros', {
      metodo: 'POST',
      cuerpo: { titulo: 'Libro futuro', autor: 'Autor', genero: 'ensayo', anio: 99999 }
    });
    assert.equal(anioInvalido.status, 400);
    assert.equal(anioInvalido.data.codigo, 'DATO_INVALIDO');

    const notificacionInvalida = await pedir('/api/notificaciones', {
      metodo: 'POST',
      cuerpo: { nroSocio: '1001', libroId: 9999, motivo: 'Prueba' }
    });
    assert.equal(notificacionInvalida.status, 404);
    assert.equal(notificacionInvalida.data.codigo, 'LIBRO_NO_ENCONTRADO');

    const catalogo = await pedir('/api/libros');
    assert.equal(catalogo.data.total, TOTAL_LIBROS_INICIAL);
  });

  await t.test('un socio no puede editar ni eliminar libros', async () => {
    await login('mgarcia');

    const edicion = await pedir('/api/libros/1', {
      metodo: 'PUT',
      cuerpo: { titulo: 'Intento', autor: 'Socio', genero: 'novela' }
    });
    assert.equal(edicion.status, 403);
    assert.equal(edicion.data.codigo, 'SIN_PERMISO');

    const eliminacion = await pedir('/api/libros/1', { metodo: 'DELETE' });
    assert.equal(eliminacion.status, 403);
    assert.equal(eliminacion.data.codigo, 'SIN_PERMISO');
  });
});
