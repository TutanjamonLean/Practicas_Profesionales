# Anotaciones del proyecto BiblioTech

Notas internas del equipo: decisiones tomadas, credenciales de prueba,
arquitectura, claves de la API y pendientes. El relevamiento completo está en
`relevamiento.pdf` y en el `README.md` de la raíz.

---

## 1. Estructura

```
Bibliotech/
├── backend/            Servidor Express (API REST + frontend estático)
│   ├── data/           datos.json (persistencia)
│   └── test/           Pruebas de integración
├── frontend/           HTML, CSS, JS y assets
├── documentacion/      Relevamiento, diagramas y estas anotaciones
└── README.md
```

## 2. Cómo levantar el proyecto

```bash
cd backend
npm install
npm start        # http://localhost:8080
npm test         # pruebas de la API
```

El puerto se puede cambiar con la variable de entorno `PORT`. Para usar otro
archivo de datos (por ejemplo en pruebas) existe `BIBLIO_DATOS`.

## 3. Credenciales de prueba

Todas las cuentas usan la clave `1234`.

| Usuario      | Rol           | Nombre              | Notas |
|--------------|---------------|---------------------|-------|
| `mgarcia`    | socio         | Mariana García      | Socio 1001 |
| `psuarez`    | socio         | Pablo Suárez        | Socio 1002, 3 compromisos y un vencido |
| `lbenitez`   | socio         | Lucía Benítez       | Socia menor 1003 |
| `blopez`     | bibliotecario | Beatriz López       | — |
| `crodriguez` | bibliotecario | Carlos Rodríguez    | — |
| `dperez`     | director      | Daniel Pérez        | — |
| `mgomez`     | director      | María Gómez         | — |

## 4. Arquitectura

- El **backend** (`backend/index.js`) concentra la lógica de negocio, las
  sesiones y la persistencia, y sirve la carpeta `frontend/`.
- El **frontend** es HTML/CSS/JS sin framework. `frontend/js/scripts.js` es el
  cliente de la API: sesión, navbar por rol, avisos y utilidades.
- La sesión viaja en una cookie `HttpOnly` llamada `biblio_sesion`. El servidor
  guarda las sesiones en un `Map` en memoria con vencimiento de 8 horas.
- Toda ruta `/api/*` requiere sesión salvo `/api/health` y `/api/auth/login`.
- Las páginas también están protegidas en el servidor: sin sesión redirige al
  login y, si el rol no corresponde, al inicio de ese rol.
- Las modificaciones se escriben en `backend/data/datos.json` de forma atómica
  (archivo temporal + `rename`) antes de responder.

> La autenticación es **de prototipo**: las claves están en texto plano. En
> producción corresponde hashearlas, usar HTTPS y limitar intentos de login.

## 5. Datos y persistencia

`backend/data/datos.json` usa el esquema v2 con las colecciones:

| Colección        | Contenido |
|------------------|-----------|
| `config`         | versión, días de préstamo (14), máximo de compromisos (3) |
| `usuarios`       | socios, bibliotecarios y directores; incluye `esMenor` y `direccion` |
| `libros`         | catálogo con `disponibles`, `totalEjemplares` y `soloSala` |
| `solicitudes`    | reservas con estado `pendiente`/`aprobada`/`rechazada` |
| `prestamos`      | préstamos con estado `activo`/`devuelto` y fecha real |
| `notificaciones` | avisos a socios con marca `leida` |

No se guardan datos derivados (morosos, devoluciones del día, disponibilidad
total): se calculan en cada consulta para evitar inconsistencias que tenía el
prototipo con `devolucionesHoy` y `sociosMorosos`.

Para reiniciar la demo: restaurar `datos.json` desde una copia. Las pruebas usan
una copia temporal y no tocan el archivo real.

## 6. Reglas de negocio implementadas

- Máximo 3 compromisos por socio: préstamos activos + solicitudes pendientes.
- Los libros de colección única son solo para consulta en sala (sin reserva).
- Aviso destacado cuando un libro no tiene stock; el servidor responde
  `SIN_STOCK` si se intenta reservar igual.
- Los menores se muestran solo con su nombre de pila en pantallas de terceros;
  el apellido y la dirección nunca salen del servidor hacia el panel.
- Un préstamo vencido se calcula comparando la fecha límite con hoy.
- Fecha de devolución = fecha de retiro + 14 días (configurable).
- Interfaz de administración con alto contraste y botones grandes, enlazada en
  el panel y en el tablero (`frontend/css/biblio-admin.css`).
- Alta y baja de ejemplares actualizan el inventario de inmediato.

## 7. Endpoints principales

| Método | Ruta | Rol |
|--------|------|-----|
| POST | `/api/auth/login` | público |
| POST | `/api/auth/logout` | autenticado |
| GET | `/api/auth/me` | autenticado |
| GET | `/api/libros` | autenticado |
| POST | `/api/solicitudes` | socio |
| GET | `/api/solicitudes` | bibliotecario |
| GET | `/api/solicitudes/mias` | socio |
| POST | `/api/solicitudes/:id/aprobar` | bibliotecario |
| POST | `/api/solicitudes/:id/rechazar` | bibliotecario |
| GET | `/api/prestamos/mios` | socio |
| GET | `/api/prestamos/vencidos` | bibliotecario/director |
| GET | `/api/reportes/morosos` | bibliotecario/director |
| GET | `/api/prestamos/proximos` | bibliotecario |
| POST | `/api/prestamos/:id/devolucion` | bibliotecario |
| POST | `/api/libros/:id/ejemplares` | bibliotecario |
| POST | `/api/libros/:id/baja` | bibliotecario |
| POST | `/api/notificaciones` | bibliotecario |
| GET | `/api/notificaciones/mias` | socio |
| GET | `/api/dashboard` | director |

El detalle completo está en el `README.md`.

## 8. Pruebas

`backend/test/api.test.js` contiene 22 pruebas de integración con `node:test`.
Resultado actual: **22/22 OK**, con estos datos medidos:

- reserva registrada en ~2,2 ms;
- 60 consultas concurrentes completadas en ~44 ms;
- verificación de que el apellido de la socia menor no aparece en el panel;
- guardas de página: sin sesión -> login; socio en panel -> catálogo.

También se verificó el frontend en Chrome headless (21 comprobaciones): páginas
públicas, catálogo, historial, reserva, panel, reporte, tablero, alto contraste,
privacidad y vista móvil sin desborde horizontal.

## 9. Decisiones de implementación

- Se migró toda la lógica al servidor: ya no se usa `localStorage`.
- Sesión simple con cookie `HttpOnly` en lugar de JWT, para no sumar
  dependencias en un trabajo académico.
- Datos demo coherentes con el esquema v2 y fechas relativas a noviembre de
  2026 (un préstamo vencido y una devolución que vence hoy).
- El frontend consulta la API en cada pantalla; no hay estado local persistente.
- Se mantiene el alto contraste solo en las pantallas de administración, como
  pide el caso de estudio.
- El login usa solo usuario y contraseña: el rol se obtiene de la cuenta.
- Las acciones que modifican datos piden confirmación antes de ejecutarse.
- Los reportes de morosos y vencidos se movieron a `pages/reportes.html`, con
  agrupación por socio calculada en el servidor.
- No se copió `zanatta.txt` por contener credenciales personales.
- `documentacion/relevamiento.pdf` se genera a partir del `README.md`.

## 10. Limitaciones y próximos pasos

- Las sesiones viven en memoria: al reiniciar el servidor se cierran.
- Las contraseñas están en texto plano (prototipo académico).
- El archivo JSON es suficiente para la escala del trabajo, pero no para
  producción; allí convendría una base de datos con transacciones.
- No hay bloqueo de cuenta por intentos fallidos ni recuperación de clave.
- Firefox no está instalado en la máquina de desarrollo: la compatibilidad se
  documenta, pero la verificación automática se hizo en Chrome.
- Se podría agregar un endpoint de cancelación de solicitudes por parte del
  socio y exportación CSV del reporte.
