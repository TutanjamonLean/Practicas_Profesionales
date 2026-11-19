/**
 * Pruebas de los endpoints PATCH (actualización de estado).
 *
 * Cada archivo de prueba corre en su propio proceso, por lo que este suite
 * parte de la semilla en memoria sin interferir con api.test.js.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';

const app = require('../index.js');

let servidor;
let base;
let cookie = null;

async function pedir(ruta, { metodo = 'GET', cuerpo, conCookie = true } = {}) {
  const headers = {};
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  if (conCookie && cookie) headers.Cookie = cookie;

  const respuesta = await fetch(`${base}${ruta}`, {
    method: metodo,
    headers,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined
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

  return { status: respuesta.status, data };
}

async function login(usuario, clave = '1234') {
  const respuesta = await pedir('/api/auth/login', {
    metodo: 'POST',
    cuerpo: { usuario, clave }
  });
  assert.equal(respuesta.status, 200, `login de ${usuario} debería ser 200`);
  return respuesta.data.usuario;
}

test('Actualizaciones con PATCH', async (t) => {
  await new Promise((resolve) => {
    servidor = app.listen(0, '127.0.0.1', resolve);
  });
  base = `http://127.0.0.1:${servidor.address().port}`;

  t.after(() => {
    servidor.close();
  });

  await t.test('el socio crea una solicitud con POST', async () => {
    await login('mgarcia');
    const respuesta = await pedir('/api/solicitudes', {
      metodo: 'POST',
      cuerpo: { libroId: 1 }
    });
    assert.equal(respuesta.status, 201);
    assert.equal(respuesta.data.solicitud.estado, 'pendiente');
    t.solicitudId = respuesta.data.solicitud.id;
  });

  await t.test('el bibliotecario la aprueba con PATCH /solicitudes/:id', async () => {
    await login('blopez');
    const respuesta = await pedir(`/api/solicitudes/${t.solicitudId}`, {
      metodo: 'PATCH',
      cuerpo: { estado: 'aprobada' }
    });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.data.solicitud.estado, 'aprobada');
    assert.ok(respuesta.data.prestamo);
    assert.equal(respuesta.data.prestamo.estado, 'activo');
    t.prestamoId = respuesta.data.prestamo.id;
  });

  await t.test('un estado inválido responde 400', async () => {
    const respuesta = await pedir(`/api/solicitudes/${t.solicitudId}`, {
      metodo: 'PATCH',
      cuerpo: { estado: 'otro' }
    });
    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.data.codigo, 'ESTADO_INVALIDO');
  });

  await t.test('la devolución se registra con PATCH /prestamos/:id', async () => {
    const respuesta = await pedir(`/api/prestamos/${t.prestamoId}`, {
      metodo: 'PATCH',
      cuerpo: { estado: 'devuelto' }
    });
    assert.equal(respuesta.status, 200);
    assert.equal(respuesta.data.prestamo.estado, 'devuelto');
    assert.ok(respuesta.data.prestamo.fechaDevolucionReal);
  });

  await t.test('un estado de préstamo inválido responde 400', async () => {
    const respuesta = await pedir(`/api/prestamos/${t.prestamoId}`, {
      metodo: 'PATCH',
      cuerpo: { estado: 'activo' }
    });
    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.data.codigo, 'ESTADO_INVALIDO');
  });

  await t.test('la notificación se marca como leída con PATCH /notificaciones/:id', async () => {
    const creada = await pedir('/api/notificaciones', {
      metodo: 'POST',
      cuerpo: { nroSocio: '1001', libroId: 1, motivo: 'Recordatorio de devolución' }
    });
    assert.equal(creada.status, 201);
    const notificacionId = creada.data.notificacion.id;

    await login('mgarcia');
    const leida = await pedir(`/api/notificaciones/${notificacionId}`, {
      metodo: 'PATCH',
      cuerpo: { leida: true }
    });
    assert.equal(leida.status, 200);
    assert.equal(leida.data.notificacion.leida, true);
  });

  await t.test('marcar como leída exige { leida: true }', async () => {
    const respuesta = await pedir('/api/notificaciones/1', {
      metodo: 'PATCH',
      cuerpo: { leida: false }
    });
    assert.equal(respuesta.status, 400);
    assert.equal(respuesta.data.codigo, 'DATOS_INVALIDOS');
  });
});
