# BiblioTech

Sistema de gestión de biblioteca para la Biblioteca Provincial "Manuel Belgrano". Implementación del **Hito 3** de la materia Prácticas Profesionalizantes I, publicada como **entrega final** en Render: frontend y backend separados, API REST con Node.js + Express y reglas de negocio en el servidor, con datos almacenados en memoria.

### Alcance de esta entrega

Esta versión corresponde a la **entrega final**. El frontend y el backend están
publicados en Render como dos servicios (Static Site + Web Service). El
enunciado original del caso de estudio planteaba persistencia en archivos JSON;
la implementación actual usa **datos en memoria**, por lo que la aplicación no
escribe en disco y, al reiniciar el servidor, vuelve a los datos iniciales de
`backend/data/semilla.json`.

## Enlaces públicos (Render)

| Servicio | URL |
|----------|-----|
| Frontend (Static Site) | <https://proyecto-bibliotech-frontend.onrender.com> |
| Backend / API (Web Service) | <https://proyecto-bibliotech.onrender.com> |
| Estado de la API | <https://proyecto-bibliotech.onrender.com/api/health> |

El frontend publicado consume la API del backend mediante `fetch` con
credenciales (`frontend/js/config.js` centraliza la URL). En el plan gratuito de
Render los servicios se suspenden tras unos minutos sin tráfico, por lo que la
primera petición puede demorar hasta un minuto en responder.

## Nombre del caso de estudio
BiblioTech

## Nombre del equipo desarrollador
Grupo 7

## Integrantes
- German Zanatta - Rol: Tablero del director
- Leandro Ferrante - Rol: Diseñador
- Lola Torres - Rol: Inicio de sesión
- Agustín Vasto - Rol: Mi historial
- Matías Donato - Rol: Catálogo
- Thiago Gómez Rodríguez - Rol: Panel Bibliotecario

## Descripción del sistema
BiblioTech es la aplicación web que automatiza la gestión de préstamos de libros, el control de inventario y la administración de socios de la Biblioteca Provincial "Manuel Belgrano". Su objetivo principal es optimizar el acceso a la cultura por parte de los vecinos, permitiéndoles consultar la disponibilidad del material bibliográfico y reservar ejemplares de manera rápida y segura. El sistema se centra en la autogestión del socio y opera en un entorno de red local dentro de la institución para modernizar los procesos manuales.

El sistema contempla tres roles:
- **Socio**: busca libros en el catálogo, solicita préstamos, consulta su historial de lecturas y revisa si tiene sanciones o notificaciones. Máximo de 3 préstamos simultáneos. Los menores de edad aparecen solo por su nombre de pila para proteger su privacidad.
- **Bibliotecario**: ve solicitudes pendientes y devoluciones del día, aprueba entregas, registra devoluciones, da de alta y baja ejemplares, notifica a socios morosos, genera el reporte de vencidos y consulta la disponibilidad total del catálogo. Atiende el mostrador con una interfaz de alto contraste y botones grandes, pensada para voluntarios mayores con visión reducida.
- **Director**: consulta un tablero de control unificado con el estado del catálogo, la actividad de los socios, las categorías más leídas y los títulos faltantes en el inventario.

Reglas de negocio implementadas en el servidor:
- Límite de 3 compromisos simultáneos por socio (préstamos activos + solicitudes pendientes).
- Colecciones únicas: solo consulta en sala, nunca se prestan.
- Aviso destacado al socio cuando el libro buscado no tiene stock.
- Plazo de préstamo de 14 días desde el retiro.
- Privacidad de menores: el servidor nunca envía apellido ni dirección a pantallas de terceros.
- Interfaz de administración con alto contraste y botones grandes.

## Cumplimiento de la consigna

| Requisito | Dónde está implementado |
|-----------|--------------------------|
| Servidor Node.js + Express | `backend/index.js` |
| API REST con endpoints para el frontend | `backend/index.js` (sección API) y tabla del §7 |
| Lógica de dominio y reglas de negocio | validaciones y reglas en `backend/index.js`; resumen en §2.4 |
| Datos en memoria (arrays y objetos) | `structuredClone` de `backend/data/semilla.json`; no se escribe en disco |
| Frontend adaptado para consumir la API | `frontend/js/scripts.js` y scripts de cada página |
| Sin `localStorage` para datos de negocio | verificado: no hay usos en `frontend/` |
| Métodos HTTP de consulta, creación y actualización | GET, POST, PUT, PATCH y DELETE (tabla del §7) |
| Resultados, confirmaciones y errores visibles | `mostrarAviso`, tablas dinámicas e indicador global de carga |
| Frontend y backend separados en el mismo repo | carpetas `frontend/` y `backend/` |
| Comunicación HTTP con JSON | `fetch` + `Content-Type: application/json` + CORS |
| Sin credenciales ni lógica sensible en el frontend | el login solo envía usuario y clave; las reglas y los datos viven en el backend |
| Backend valida aunque el frontend no lo haga | middleware de sesión/rol y validaciones del servidor (cubiertas por tests) |
| Datos temporales que se pierden al reiniciar | sin persistencia: al reiniciar se vuelve a cargar la semilla |
| Documentación de los endpoints de la API | §7 (34 rutas verificadas contra `backend/index.js`) |
| Despliegue y publicación | §5 "Despliegue en Render": Static Site + Web Service |
| Documentación de entregas anteriores | carpeta `documentacion/` (relevamiento, caso de estudio, notas y diagramas) |

---

## 1. REQUISITOS DE LA ELICITACIÓN

### 1.1 Actores y Stakeholders Identificados

| Actor/Stakeholder | Rol | Interés Principal |
|-------------------|-----|-------------------|
| **Socio (usuario final)** | Ciudadano que usa la biblioteca | Acceso rápido a catálogo, reserva de libros, consulta de historial y estado de préstamos |
| **Bibliotecario / Voluntario** | Personal de atención al público | Gestión de préstamos/devoluciones en mostrador, notificaciones a morosos, baja de ejemplares |
| **Director de la Biblioteca** | Autoridad decisional | Visión estratégica: indicadores de uso, categorías populares, faltantes de inventario |
| **Administrador de Sistemas (TI)** | Soporte técnico | Mantenimiento, despliegue en red local, seguridad, backup |
| **Menores de edad (socios especiales)** | Grupo vulnerable | Protección de datos personales (solo nombre de pila visible) |

### 1.2 Técnicas de Elicitación Aplicadas

| Técnica | Descripción | Artefacto Generado |
|---------|-------------|-------------------|
| **Entrevistas semiestructuradas** | Conversaciones con bibliotecarios actuales y director para entender flujo de trabajo manual | Lista de problemas: pérdida de fichas, dificultad para ubicar ejemplares, notificaciones manuales lentas |
| **Observación directa (etnografía ligera)** | Sesiones en mostrador viendo cómo atienden préstamos/devoluciones actualmente | Identificación de necesidades de accesibilidad (botones grandes, alto contraste) |
| **Análisis de documentación existente** | Reglamento interno de la biblioteca, normativa de protección al menor, estadísticas de préstamos 2024-2025 | Reglas de negocio: máx. 3 préstamos, colección única solo sala, privacidad menores |
| **Talleres de co-diseño** | Sesiones con voluntarios mayores para validar prototipos de interfaz | Feedback: tamaño de fuente, contraste de colores, flujo simplificado |
| **Revisión de normativa legal** | Ley de Protección de Datos Personales, Ley de Protección al Menor | Restricciones: no mostrar apellido/dirección de menores a terceros |

### 1.3 Requisitos Funcionales Elicitados (RF)

| ID | Requisito | Prioridad | Actor | Fuente |
|----|-----------|-----------|-------|--------|
| RF-01 | El sistema debe permitir buscar libros por título, autor y género | Alta | Socio | Entrevista + Observación |
| RF-02 | El sistema debe mostrar disponibilidad en tiempo real (disponibles, sin stock, solo sala) | Alta | Socio | Observación + Documentación |
| RF-03 | El sistema debe permitir reservar un ejemplar disponible | Alta | Socio | Entrevista |
| RF-04 | El sistema debe validar regla de máximo 3 préstamos simultáneos por socio | Alta | Socio/Bibliotecario | Reglamento interno |
| RF-05 | El sistema debe bloquear reserva de ejemplares de colección única (solo sala) | Alta | Socio | Reglamento interno |
| RF-06 | El sistema debe generar comprobante digital de reserva con fecha límite de devolución | Media | Socio | Entrevista |
| RF-07 | El sistema debe mostrar historial de préstamos: activos, devueltos, sanciones | Alta | Socio | Entrevista |
| RF-08 | El sistema debe ocultar apellido y dirección de socios menores de edad | Alta | Socio/Bibliotecario | Normativa legal |
| RF-09 | El sistema debe mostrar solicitudes de préstamo pendientes de aprobación | Alta | Bibliotecario | Observación |
| RF-10 | El sistema debe permitir aprobar/rechazar entrega de ejemplar reservado | Alta | Bibliotecario | Observación |
| RF-11 | El sistema debe mostrar devoluciones programadas para el día | Alta | Bibliotecario | Observación |
| RF-12 | El sistema debe permitir registrar devolución física de ejemplar | Alta | Bibliotecario | Observación |
| RF-13 | El sistema debe listar socios con préstamos vencidos (morosos) | Media | Bibliotecario | Entrevista |
| RF-14 | El sistema debe permitir enviar notificación a socio moroso | Media | Bibliotecario | Entrevista |
| RF-15 | El sistema debe permitir dar de baja ejemplar deteriorado | Media | Bibliotecario | Entrevista |
| RF-16 | El sistema debe permitir registrar nuevo ejemplar en inventario | Media | Bibliotecario | Entrevista |
| RF-17 | El sistema debe generar reporte de préstamos vencidos | Baja | Bibliotecario | Entrevista |
| RF-18 | El sistema debe mostrar dashboard con indicadores generales (socios activos, préstamos vigentes, vencidos, stock) | Alta | Director | Entrevista + Documentación |
| RF-19 | El sistema debe mostrar ranking de categorías más leídas | Media | Director | Entrevista |
| RF-20 | El sistema debe listar títulos faltantes o con stock crítico (0-1 ejemplares) | Alta | Director | Entrevista |
| RF-21 | El sistema debe autenticar usuarios con usuario y contraseña, asignando permisos según su rol (socio, bibliotecario, director) | Alta | Todos | Seguridad básica |
| RF-22 | La interfaz de bibliotecario debe tener alto contraste y botones grandes | Alta | Bibliotecario | Co-diseño + Observación |

### 1.4 Requisitos No Funcionales Elicitados (RNF)

| ID | Requisito | Categoría | Métrica/Criterio |
|----|-----------|-----------|------------------|
| RNF-01 | Despliegue en red local (intranet) sin acceso a internet | Infraestructura | Servidor local, sin dependencias externas en tiempo de ejecución |
| RNF-02 | Tiempo de respuesta de búsqueda y reserva < 3 segundos | Rendimiento | Medido en pruebas: reserva en ~2 ms, 60 consultas en ~44 ms |
| RNF-03 | Interfaz accesible WCAG 2.1 AA (contraste, tamaño fuente, navegación teclado) | Accesibilidad | Auditoría + alto contraste en administración |
| RNF-04 | Protección de datos personales de menores (seudonimización) | Seguridad/Legal | Solo nombre de pila en respuestas de terceros |
| RNF-05 | Disponibilidad 99% en horario de atención (8 a 20 h) | Disponibilidad | Ventana de mantenimiento fuera de horario |
| RNF-06 | Los datos se reinician al reiniciar el servidor (comportamiento intencional del prototipo) | Integridad | Semilla en memoria (`backend/data/semilla.json`) |
| RNF-07 | Interfaz responsive (desktop, tablet, móvil) | Usabilidad | Breakpoints: 1024 px, 768 px, 480 px |
| RNF-08 | Navegadores soportados: Chrome, Firefox (últimas 2 versiones) | Compatibilidad | Testing cruzado; verificado en Chrome |
| RNF-09 | Separación de responsabilidades: HTML semántico, CSS externo, JS modular | Mantenibilidad | Estructura `frontend/` + `backend/` |
| RNF-10 | Documentación de código y arquitectura | Mantenibilidad | README, comentarios JSDoc, diagramas |
| RNF-11 | Soporte de al menos 50 consultas por minuto | Rendimiento | 60 consultas concurrentes en 44 ms (prueba automatizada) |

### 1.5 Restricciones del Proyecto

| Restricción | Descripción |
|-------------|-------------|
| **Tecnología** | Node.js + Express 5, HTML5 semántico, CSS y JavaScript del navegador (sin frameworks) |
| **Datos** | Estructuras en memoria (arrays y objetos); no se usa base de datos |
| **Autenticación** | Cookie de sesión `HttpOnly` administrada por el servidor |
| **Entorno** | Red local de la biblioteca (sin cloud, sin CDN) |
| **Equipo** | 6 integrantes, roles definidos por pantalla |
| **Normativa** | Cumplimiento Ley Protección Datos + Ley Protección Menor |

---

## 2. ANÁLISIS FUNCIONAL

### 2.1 Descomposición Funcional (Casos de Uso por Subsistema)

```
BIBLIOTECH
├── AUTENTICACIÓN Y ACCESO
│   ├── CU-01: Iniciar sesión
│   └── CU-02: Cerrar sesión
├── GESTIÓN DE CATÁLOGO (SOCIO)
│   ├── CU-03: Buscar libros
│   ├── CU-04: Filtrar por género/disponibilidad
│   ├── CU-05: Ver detalle de libro y disponibilidad
│   └── CU-06: Reservar ejemplar
├── GESTIÓN DE PRÉSTAMOS (SOCIO)
│   ├── CU-07: Confirmar reserva (comprobante)
│   ├── CU-08: Consultar historial de préstamos
│   ├── CU-09: Ver préstamos activos
│   ├── CU-10: Ver libros devueltos
│   ├── CU-11: Ver sanciones y notificaciones
├── ATENCIÓN EN MOSTRADOR (BIBLIOTECARIO)
│   ├── CU-12: Ver solicitudes pendientes
│   ├── CU-13: Aprobar entrega de ejemplar
│   ├── CU-14: Rechazar solicitud de préstamo
│   ├── CU-15: Ver devoluciones del día
│   ├── CU-16: Registrar devolución física
│   ├── CU-17: Ver socios morosos
│   ├── CU-18: Enviar notificación a moroso
│   ├── CU-19: Dar de baja ejemplar deteriorado
│   ├── CU-20: Registrar nuevo ejemplar
│   ├── CU-21: Generar reporte de préstamos vencidos
│   └── CU-27: Consultar disponibilidad total del catálogo
├── TABLERO DIRECTIVO (DIRECTOR)
│   ├── CU-22: Ver indicadores generales
│   ├── CU-23: Ver ranking categorías más leídas
│   └── CU-24: Ver títulos faltantes en inventario
└── TRANSVERSALES
    ├── CU-25: Navegar entre pantallas (menú principal)
    ├── CU-26: Acceso según rol (autorización)
    └── CU-28: Persistir cambios en el servidor
```

### 2.2 Modelo de Datos Implementado (esquema v2)

Al iniciar, el servidor copia la semilla (`backend/data/semilla.json`) a estructuras en memoria con las siguientes colecciones. Los cambios se pierden al reiniciar:

| Colección | Campos principales | Relaciones |
|-----------|-------------------|------------|
| **config** | `version`, `diasPrestamo`, `maxPrestamos`, `nombreBiblioteca` | — |
| **usuarios** | `id`, `usuario`, `clave`, `rol`, `nombre`, `apellido`, `email`, `nroSocio`, `legajo`, `esMenor`, `direccion` | 1:N solicitudes, préstamos y notificaciones (por `nroSocio`) |
| **libros** | `id`, `titulo`, `autor`, `genero`, `anio`, `disponibles`, `totalEjemplares`, `soloSala`, `descripcion`, `eliminado` | 1:N solicitudes y préstamos (por `libroId`) |
| **solicitudes** | `id`, `nroSocio`, `libroId`, `fechaSolicitud`, `fechaRetiro`, `fechaDevolucion`, `estado` (`pendiente`/`aprobada`/`rechazada`) | N:1 usuario, N:1 libro |
| **prestamos** | `id`, `solicitudId`, `nroSocio`, `libroId`, `fechaRetiro`, `fechaDevolucion`, `estado` (`activo`/`devuelto`), `fechaDevolucionReal` | N:1 usuario, N:1 libro, 0..1 solicitud |
| **notificaciones** | `id`, `nroSocio`, `libroId`, `motivo`, `fecha`, `leida` | N:1 usuario, N:1 libro |
| **resenias** | `id`, `libroId`, `nroSocio`, `puntuacion` (1-5), `comentario`, `fecha` | N:1 usuario, N:1 libro; una por socio y libro |

Los datos derivados (morosos, devoluciones del día, disponibilidad total) **no se almacenan**: se calculan en cada consulta a partir de las colecciones anteriores, para evitar estados inconsistentes.

> Nota de seguridad: en este prototipo las contraseñas se guardan en texto plano. Para producción corresponde almacenar un hash (por ejemplo `bcrypt` o `scrypt`) y nunca devolverlo por la API.

### 2.3 Flujos Principales (Secuencias)

#### Flujo F-01: Reserva de Libro por Socio
```
Socio -> [Login] -> Catálogo -> [Buscar/Filtrar] -> Lista resultados
  -> [Click Reservar] -> Formulario Reserva -> POST /api/solicitudes
  -> [Validar en servidor: stock>0, compromisos<3, no soloSala, fecha válida]
  -> [Éxito] -> Confirmación (comprobante con fecha límite) -> Historial
  -> [Fallo] -> Aviso en pantalla (sin stock / cupo excedido / solo sala)
```

#### Flujo F-02: Entrega en Mostrador (Bibliotecario)
```
Bibliotecario -> [Login] -> Panel -> [Ver solicitudes pendientes]
  -> [Click Aprobar] -> PATCH /api/solicitudes/:id { "estado": "aprobada" }
  -> Crea préstamo activo -> El stock ya estaba descontado al reservar
```

#### Flujo F-03: Devolución en Mostrador
```
Bibliotecario -> Panel -> [Ver devoluciones del día]
  -> [Click Registrar devolución] -> PATCH /api/prestamos/:id { "estado": "devuelto" }
  -> estado='devuelto' + fecha real -> Stock +1 -> Si estaba vencido, figuraba en morosos
```

#### Flujo F-04: Consulta Directiva
```
Director -> [Login] -> Tablero -> GET /api/dashboard
  -> Indicadores calculados en el servidor
  -> Ranking por género -> Libros con 0 o 1 ejemplar disponible
```

### 2.4 Reglas de Negocio Formales

| Regla | Descripción | Implementación |
|-------|-------------|----------------|
| **RN-01** | Máximo 3 compromisos simultáneos por socio (activos + pendientes) | `POST /api/solicitudes` responde `CUPO_EXCEDIDO` |
| **RN-02** | Colección única => solo consulta en sala | `POST /api/solicitudes` responde `LIBRO_SOLO_SALA` |
| **RN-03** | Menor de edad => seudonimización en vistas de terceros | `nombreVisible()` devuelve solo el nombre de pila |
| **RN-04** | Préstamo vencido => aparece en morosos y puede notificarse | `GET /api/prestamos/vencidos` compara la fecha límite con hoy |
| **RN-05** | Fecha límite = fecha de retiro + 14 días | Configurable en `config.diasPrestamo` |
| **RN-06** | Solo bibliotecario cambia estados de préstamo | Middleware `autorizar('bibliotecario')` |
| **RN-07** | Baja de ejemplar => deja de estar disponible | `POST /api/libros/:id/baja` ajusta total y disponibles |
| **RN-08** | Sin stock => no se puede reservar | `POST /api/solicitudes` responde `SIN_STOCK` |
| **RN-09** | Toda la API requiere sesión salvo las rutas públicas | Middleware `autenticar` en todas las rutas salvo `GET /api/health`, `GET /api/config`, `POST /api/auth/login` y `GET /api/libros/populares` |

### 2.5 Matriz de Trazabilidad (Requisito -> Pantalla -> Caso de Uso)

| Requisito | Pantalla HTML | Casos de Uso |
|-----------|---------------|--------------|
| RF-01, RF-02 | `pages/catalogo.html` | CU-03, CU-04, CU-05 |
| RF-03, RF-04, RF-05 | `pages/reserva.html` | CU-06 |
| RF-06 | `pages/confirmacion.html` | CU-07 |
| RF-07, RF-08 | `pages/historial.html` | CU-08, CU-09, CU-10, CU-11 |
| RF-09, RF-10 | `pages/panel-bibliotecario.html` (solicitudes) | CU-12, CU-13, CU-14 |
| RF-11, RF-12 | `pages/panel-bibliotecario.html` (devoluciones) | CU-15, CU-16 |
| RF-13, RF-14 | `pages/panel-bibliotecario.html` (morosos) | CU-17, CU-18 |
| RF-15, RF-16, RF-17 | `pages/panel-bibliotecario.html` (inventario y reporte) | CU-19, CU-20, CU-21 |
| RF-18 | `pages/tablero-director.html` (indicadores) | CU-22 |
| RF-19 | `pages/tablero-director.html` (categorías) | CU-23 |
| RF-20 | `pages/tablero-director.html` (faltantes) | CU-24 |
| RF-21 | `pages/login.html` | CU-01, CU-02 |
| RF-22 | `pages/panel-bibliotecario.html` (estilos) | Transversal (RNF-03) |
| RNF-03 | Todas (CSS alto contraste, botones grandes) | Transversal |
| RNF-04 | `pages/historial.html`, `pages/panel-bibliotecario.html` | CU-08, CU-12, CU-17 |

---

## 3. CASOS DE USO DETALLADOS

### Formato: Caso de Uso Completo (Actor, Precondición, Flujo Principal, Flujos Alternativos, Postcondición)

---

#### CU-01: Iniciar Sesión
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio, Bibliotecario, Director |
| **Actor Secundario** | Sistema de Autenticación |
| **Precondición** | Usuario registrado en sistema, credenciales válidas |
| **Disparador** | Usuario accede a `login.html` y envía formulario |

**Flujo Principal:**
1. Usuario ingresa usuario y contraseña (el rol no se elige: lo determina la cuenta)
2. `POST /api/auth/login` valida las credenciales contra los usuarios cargados en memoria
3. Si es válido: el servidor crea una sesión y responde con la cookie `biblio_sesion`
4. El frontend redirige según el rol de la cuenta:
   - Socio -> `catalogo.html`
   - Bibliotecario -> `panel-bibliotecario.html`
   - Director -> `tablero-director.html`

**Flujos Alternativos:**
- **A1: Credenciales inválidas** -> `401 CREDENCIALES_INVALIDAS`, permite reintento
- **A2: Datos incompletos** -> `400 DATOS_INCOMPLETOS`

**Postcondición:** Usuario autenticado con sesión activa, permisos según rol asignado.

**Reglas de Negocio:** RN-06, RN-09

---

#### CU-02: Cerrar Sesión
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio, Bibliotecario, Director |
| **Precondición** | Sesión activa |
| **Disparador** | Click en "Cerrar sesión" en la navbar |

**Flujo Principal:**
1. El frontend llama a `POST /api/auth/logout`
2. El servidor invalida la sesión y borra la cookie
3. Redirige a `index.html` (público)

**Postcondición:** Sesión terminada, acceso a áreas protegidas denegado.

---

#### CU-03: Buscar Libros
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | Usuario autenticado, acceso a `catalogo.html` |
| **Disparador** | Usuario ingresa término y/o selecciona filtros, click "Buscar" |

**Flujo Principal:**
1. El frontend arma la consulta `GET /api/libros?buscar=&genero=&disponible=1`
2. El servidor filtra por título, autor y género; aplica el filtro de disponibilidad
3. Devuelve la lista con estado por libro: `disponible`, `sin-stock` o `solo-sala`
4. La página muestra el resumen de resultados y las tarjetas

**Flujos Alternativos:**
- **A1: Sin resultados** -> "No se encontraron libros", sugiere ampliar la búsqueda
- **A2: Término vacío sin filtros** -> catálogo completo

**Postcondición:** Lista de resultados mostrada, el socio puede reservar si corresponde.

---

#### CU-04: Filtrar por Género/Disponibilidad
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | En `catalogo.html` |
| **Disparador** | Cambia el select de género y/o el checkbox "Solo disponibles" |

**Flujo Principal:** Igual a CU-03, con los filtros aplicados en el servidor.

---

#### CU-05: Ver Detalle y Disponibilidad
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | Resultados de búsqueda visibles |
| **Disparador** | El usuario visualiza una tarjeta de libro |

**Flujo Principal:**
1. La tarjeta muestra título, autor, género, año y descripción
2. Etiqueta de estado:
   - Verde "X disponibles de Y" -> botón "Reservar" habilitado
   - Rojo "Sin stock disponible" -> sin botón, aviso "Te avisaremos..."
   - Amarillo/azul "Solo consulta en sala" -> sin botón de reserva

---

#### CU-06: Reservar Ejemplar
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | Libro con stock > 0, no `soloSala`, socio con menos de 3 compromisos |
| **Disparador** | Click "Reservar" en catálogo -> `reserva.html?libro=ID` |

**Flujo Principal:**
1. `reserva.html` carga el libro con `GET /api/libros/:id` y completa el nro. de socio desde la sesión
2. Usuario elige la fecha de retiro y confirma
3. El servidor valida:
   - libro existente y no `soloSala`
   - `disponibles > 0`
   - compromisos del socio < 3
   - fecha de retiro válida y no anterior a hoy
4. Crea la solicitud `pendiente`, descuenta un ejemplar y responde `201`
5. Redirige a `confirmacion.html?solicitud=ID`

**Flujos Alternativos:**
- **A1: Sin stock** -> `409 SIN_STOCK`
- **A2: Límite de 3** -> `409 CUPO_EXCEDIDO`
- **A3: Colección única** -> `409 LIBRO_SOLO_SALA`
- **A4: Fecha inválida** -> `400 FECHA_INVALIDA`
- **A5: Cancelar** -> vuelve a `catalogo.html`

**Postcondición:** Solicitud registrada, stock decrementado y comprobante disponible.

**Reglas de Negocio:** RN-01, RN-02, RN-05, RN-08

---

#### CU-07: Confirmar Reserva (Comprobante)
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | Reserva exitosa (CU-06) |
| **Disparador** | Redirección automática a `confirmacion.html` |

**Flujo Principal:**
1. La página consulta `GET /api/solicitudes/:id` (solo el dueño o un bibliotecario)
2. Muestra título, autor, nro. de socio, fecha de solicitud, fecha límite y estado
3. Enlaces: "Volver al catálogo", "Ir a Mi historial", "Ir al inicio"

---

#### CU-08: Consultar Historial de Préstamos
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondición** | Autenticado como socio |
| **Disparador** | Navegación a "Mi historial" |

**Flujo Principal:**
1. `GET /api/prestamos/mios` devuelve activos, devueltos y sanciones
2. `GET /api/solicitudes/mias` devuelve las reservas propias, de la más reciente a la más antigua
3. La página renderiza las secciones, el botón "Ver ticket" de cada reserva y las notificaciones (`GET /api/notificaciones/mias`)
4. El ticket abre `confirmacion.html?solicitud=ID` y puede imprimirse
5. Cada préstamo activo vencido se marca como "Vencido" con los días de atraso

**Postcondición:** Historial completo, filtrado por privacidad.

---

#### CU-09/10/11: Ver Préstamos Activos / Devueltos / Sanciones y Notificaciones
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Socio |
| **Descripción** | Sub-casos de CU-08; cada sección es un caso de uso atómico para trazabilidad |

---

#### CU-12: Ver Solicitudes Pendientes (Bibliotecario)
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Autenticado como bibliotecario |
| **Disparador** | Carga del panel (se refresca cada 15 s) |

**Flujo Principal:**
1. `GET /api/solicitudes?estado=pendiente`, ordenadas por el último orden de llegada (la más reciente primero)
2. Tabla: Socio (seudonimizado si es menor), Título, Solicitado, Retiro, Vencimiento, Acciones

**Reglas:** RN-03, RNF-03

---

#### CU-13: Aprobar Entrega de Ejemplar
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Solicitud `pendiente`, socio presente en mostrador |
| **Disparador** | Click "Aprobar entrega" |

**Flujo Principal:**
1. `PATCH /api/solicitudes/:id` con `{ "estado": "aprobada" }`
2. El servidor crea el préstamo `activo` con las fechas de la solicitud
3. La solicitud pasa a `aprobada`; el stock **no** se descuenta otra vez (ya se reservó)
4. El panel se recarga y muestra el aviso de éxito

**Flujos Alternativos:**
- **A1: Solicitud ya procesada** -> `409 SOLICITUD_NO_PENDIENTE`

---

#### CU-14: Rechazar Solicitud
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Solicitud `pendiente` |
| **Disparador** | Click "Rechazar" |

**Flujo Principal:**
1. `PATCH /api/solicitudes/:id` con `{ "estado": "rechazada" }`
2. La solicitud pasa a `rechazada` y el ejemplar vuelve al stock
3. El panel confirma la operación

---

#### CU-15: Ver Devoluciones del Día
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Panel cargado |
| **Disparador** | Carga automática |

**Flujo Principal:**
1. `GET /api/prestamos/proximos` devuelve los préstamos activos que vencen hoy o antes
2. La tabla muestra Socio, Título, Vencimiento y la acción "Registrar devolución"

---

#### CU-16: Registrar Devolución Física
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Préstamo activo, ejemplar físico en mano |
| **Disparador** | Click "Registrar devolución" |

**Flujo Principal:**
1. `PATCH /api/prestamos/:id` con `{ "estado": "devuelto" }`
2. El préstamo pasa a `devuelto` con la fecha real
3. El stock del libro se repone
4. El panel se recarga

**Flujos Alternativos:**
- **A1: Préstamo no activo** -> `409 PRESTAMO_NO_ACTIVO`

---

#### CU-17: Ver Socios Morosos
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Panel cargado |
| **Disparador** | Carga automática |

**Flujo Principal:**
1. `GET /api/reportes/morosos` agrupa los préstamos activos con fecha límite anterior a hoy por socio
2. `pages/reportes.html` muestra la tabla de socios morosos y el detalle de vencidos; cada vencido permite "Enviar notificación"

---

#### CU-18: Enviar Notificación a Moroso
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Socio con préstamo vencido |
| **Disparador** | Click "Enviar notificación" |

**Flujo Principal:**
1. `POST /api/notificaciones` con `nroSocio`, `libroId` y motivo
2. El servidor guarda la notificación como no leída
3. El socio la ve en "Mi historial" y puede marcarla como leída

---

#### CU-19: Dar de Baja Ejemplar Deteriorado
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Libro con ejemplares registrados |
| **Disparador** | Click "Dar de baja" en la tabla de inventario |

**Flujo Principal:**
1. El bibliotecario confirma la baja
2. `POST /api/libros/:id/baja` descuenta un ejemplar del total y de los disponibles
3. Se actualiza el inventario en pantalla

**Flujos Alternativos:**
- **A1: Sin ejemplares** -> `409 SIN_EJEMPLARES`

**Reglas:** RN-07

---

#### CU-20: Registrar Nuevo Ejemplar
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Libro existente en el catálogo |
| **Disparador** | Click "Agregar ejemplar" |

**Flujo Principal:**
1. `POST /api/libros/:id/ejemplares` con la cantidad
2. Aumentan `totalEjemplares` y `disponibles`
3. El inventario se actualiza en pantalla

---

#### CU-21: Generar Reporte Préstamos Vencidos
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Acceso al panel |
| **Disparador** | Click "Generar reporte" |

**Flujo Principal:**
1. `GET /api/reportes/morosos` devuelve los datos en vivo, la agrupación por socio y la marca de tiempo
2. `pages/reportes.html` muestra el resumen, los morosos agrupados y el detalle de vencidos
3. El botón "Imprimir reporte" usa los estilos de impresión (solo la sección del reporte)

---

#### CU-22: Ver Indicadores Generales (Director)
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondición** | Autenticado como director |
| **Disparador** | Carga del tablero |

**Flujo Principal:**
1. `GET /api/dashboard` calcula en el servidor:
   - socios activos y socios con préstamos vigentes
   - préstamos vigentes y vencidos
   - títulos, ejemplares totales, ejemplares en sala y disponibles para préstamo
2. La página muestra los ocho indicadores

---

#### CU-23: Ver Ranking Categorías Más Leídas
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondición** | Tablero cargado |
| **Disparador** | Carga automática |

**Flujo Principal:**
1. El servidor agrupa los préstamos por género del libro y ordena de mayor a menor
2. La página muestra el top 5 de categorías

---

#### CU-24: Ver Títulos Faltantes en Inventario
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondición** | Tablero cargado |
| **Disparador** | Carga automática |

**Flujo Principal:**
1. El servidor lista los libros no restringidos con 0 o 1 ejemplar disponible
2. La página muestra Título, Autor y Stock actual

---

#### CU-25: Navegación Principal
| Campo | Descripción |
|-------|-------------|
| **Actores** | Todos (público y autenticados) |
| **Descripción** | La navbar se genera dinámicamente según la sesión y el rol. Visitante: Inicio y Login. Socio: Inicio, Catálogo, Mi historial y Cerrar sesión. Bibliotecario y director ven su pantalla de trabajo y el cierre de sesión. |
| **Regla** | Opciones visibles según autenticación/rol, con enlace activo resaltado |

---

#### CU-26: Autorización por Rol
| Campo | Descripción |
|-------|-------------|
| **Actores** | Sistema (transversal) |
| **Descripción** | Control de acceso en dos capas:
- **API**: middleware `autenticar` + `autorizar(...)` en cada ruta
- **Páginas**: el servidor redirige a `/pages/login.html` si no hay sesión y al inicio del rol si no corresponde |
| **Rutas** | `/index.html` y `/pages/login.html` son públicas; el resto requiere sesión |
| **Implementación** | Cookie `HttpOnly` + mapa de sesiones en memoria + guardas de página. Al redirigir al login se conserva la ruta original en `?volver=` |

---

#### CU-27: Consultar Disponibilidad Total del Catálogo
| Campo | Descripción |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondición** | Panel cargado |
| **Disparador** | Carga automática de la sección de inventario |

**Flujo Principal:**
1. `GET /api/libros` devuelve el catálogo completo con stock y estado
2. El panel muestra total, disponibles, estado y las acciones de alta/baja

---

#### CU-28: Gestionar Cambios en Memoria
| Campo | Descripción |
|-------|-------------|
| **Actores** | Sistema (transversal) |
| **Descripción** | Toda operación que modifica datos (reserva, aprobación, rechazo, devolución, alta, baja, notificación, lectura) actualiza las estructuras en memoria del servidor antes de responder. No se escribe ningún archivo ni se usa una base de datos. |
| **Beneficio** | Cualquier navegador ve el mismo estado mientras el servidor está en marcha; no se depende de `localStorage`. Al reiniciar se vuelve a la semilla. |

---

## 4. PANTALLAS DESARROLLADAS

| # | Archivo | Descripción | Casos de Uso Cubiertos |
|---|---------|-------------|------------------------|
| 1 | `index.html` | Landing pública: explicación de la biblioteca, libros más pedidos y panel de datos de la cuenta | CU-25 |
| 2 | `pages/login.html` | Formulario usuario + contraseña, sesión real contra la API | CU-01 |
| 3 | `pages/catalogo.html` | Buscador (texto, género, solo disponibles) contra la API y tarjetas con estado | CU-03, CU-04, CU-05 |
| 4 | `pages/reserva.html` | Formulario de reserva con validaciones del servidor | CU-06 |
| 5 | `pages/confirmacion.html` | Comprobante digital consultado por API, con impresión | CU-07 |
| 6 | `pages/historial.html` | Reservas con ticket, préstamos activos, devueltos, sanciones y notificaciones | CU-08, CU-09, CU-10, CU-11 |
| 7 | `pages/panel-bibliotecario.html` | Solicitudes (más recientes primero), devoluciones, alta de libros e inventario (alto contraste, botones grandes) | CU-12 a CU-16, CU-19, CU-20, CU-27 |
| 8 | `pages/reportes.html` | Socios morosos agrupados y detalle de préstamos vencidos, con notificación e impresión | CU-17, CU-18, CU-21 |
| 9 | `pages/tablero-director.html` | Indicadores, ranking de categorías y títulos faltantes | CU-22, CU-23, CU-24 |
| 10 | `pages/libro.html` | Ficha del libro: datos completos, disponibilidad, reseñas de otros socios y formulario de reseña (1-5) | CU-03, CU-04, nuevo: reseñas |

---

## 5. ESTRUCTURA DEL PROYECTO

```
Bibliotech web/
|-- README.md                 (este documento)
|-- package.json              (scripts que delegan en backend/)
|-- .env.example              (variables de entorno de referencia; copiar a .env)
|-- .gitignore
|-- backend/
|   |-- index.js              (servidor Express: API REST, sesiones, reglas y guardas)
|   |-- package.json
|   |-- package-lock.json
|   |-- data/
|   |   `-- semilla.json      (datos iniciales; se copian a memoria al arrancar)
|   `-- test/
|       |-- api.test.js       (pruebas de la API)
|       `-- patch.test.js     (pruebas de actualizaciones PATCH)
|-- frontend/
|   |-- index.html            (página principal - landing)
|   |-- css/
|   |   |-- styles.css        (estilos base, responsive e impresión)
|   |   `-- biblio-admin.css  (tema de alto contraste para administración)
|   |-- js/
|   |   |-- config.js         (URL del backend; vacía = mismo origen)
|   |   `-- scripts.js        (cliente de API, sesión, navbar y utilidades)
|   |-- pages/
|   |   |-- login.html
|   |   |-- catalogo.html
|   |   |-- libro.html
|   |   |-- reserva.html
|   |   |-- confirmacion.html
|   |   |-- historial.html
|   |   |-- panel-bibliotecario.html
|   |   |-- reportes.html
|   |   `-- tablero-director.html
|   `-- assets/
|       `-- img/
|           `-- logo-bibliotech.svg
`-- documentacion/
    |-- relevamiento.pdf      (relevamiento completo del sistema)
    |-- Caso de estudio 2.txt (enunciado del caso de estudio de la cátedra)
    |-- anotaciones.md        (decisiones y pendientes del equipo)
    `-- diagramas/
        `-- diagramas.md      (arquitectura, modelo de datos y flujos en Mermaid)
```

Los datos del sistema se guardan en **memoria** (arrays y objetos). No hay base
de datos ni escritura en disco: al reiniciar el servidor se vuelve a
`backend/data/semilla.json`.

### Requisitos previos

- **Node.js 20.10 o superior** (`node -v`): las pruebas usan
  `--test-concurrency`, disponible desde esa versión.
- **npm** (se instala junto con Node.js).
- **Git** para clonar el repositorio.
- No hace falta base de datos ni servidor web aparte: los datos viven en memoria
  y el backend sirve el frontend.
- Opcional: VS Code con la extensión Live Server para trabajar el frontend con
  recarga automática.

### Instalación de dependencias

El backend tiene una única dependencia (`express`). Desde la raíz del
repositorio:

```bash
npm run install:backend
```

Equivale a:

```bash
cd backend
npm install        # o npm ci para respetar package-lock.json
```

El frontend no tiene dependencias ni paso de build: son archivos HTML, CSS y
JavaScript que el navegador carga directamente.

### Ejecución local del backend

Desde `backend/`:

```bash
npm start          # node index.js
npm run dev        # node --watch index.js (se reinicia al guardar)
```

El servidor queda disponible en <http://localhost:8080> (o en el puerto que
indique `process.env.PORT`). Desde la raíz del repositorio también funcionan
`npm start`, `npm run dev` y `npm test`, que delegan en `backend/`.

### Ejecución local del frontend

**Opción 1 (recomendada): un solo proceso.** Con el backend en marcha, abrir
<http://localhost:8080>: `express.static` sirve `frontend/` y la API responde
bajo `/api`. No hay que configurar nada.

**Opción 2: servidor estático aparte.** Servir la carpeta `frontend/` con
cualquier servidor estático (por ejemplo, Live Server de VS Code en
<http://localhost:5500>). El cliente detecta que está en otro puerto y apunta la
API a `http://localhost:8080/api`.

La URL del backend se centraliza en `frontend/js/config.js`:

```js
window.BIBLIO_CONFIG = {
  API_URL: '' // vacío = mismo origen; con URL = backend remoto
};
```

- **Vacío**: se usa el mismo origen (`/api`), como cuando el backend sirve el
  frontend.
- **Con URL**: se usa ese backend. Se puede escribir con o sin `/api`; el
  cliente la normaliza (`https://host` → `https://host/api`). Es lo que usa la
  publicación actual en Render.
- Se mantiene `window.BIBLIO_API_URL` como alternativa por compatibilidad con
  configuraciones anteriores.

### Configuración opcional con `.env`

Copiar `.env.example` a `.env` **en la raíz del repositorio** y ajustar `PORT` o
`BIBLIO_ORIGENES`. Luego levantar con:

```bash
cd backend
npm run start:env
```

El archivo `.env` no se versiona. `npm start` no lee `.env`: para eso está
`npm run start:env` (requiere Node.js 20.6 o superior). También se pueden
definir las variables directamente en la terminal:

```bash
BIBLIO_ORIGENES=http://localhost:5500 npm start
```

En PowerShell: `$env:BIBLIO_ORIGENES='http://localhost:5500'; npm start`.

### Despliegue en Render

El proyecto está publicado en Render con **dos servicios**:

| Servicio | Tipo | URL |
|----------|------|-----|
| Frontend | Static Site | <https://proyecto-bibliotech-frontend.onrender.com> |
| Backend / API | Web Service (Node.js) | <https://proyecto-bibliotech.onrender.com> |
| Estado de la API | — | <https://proyecto-bibliotech.onrender.com/api/health> |

El backend también sirve el frontend en su propia URL
(`https://proyecto-bibliotech.onrender.com/`), aunque la publicación oficial del
frontend es el Static Site.

**Configuración del Web Service (backend)**

- **Root Directory**: `backend`
- **Build Command**: `npm ci` (o `npm install`)
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`
- **Variable de entorno `BIBLIO_ORIGENES`**: URL del frontend publicado
  (`https://proyecto-bibliotech-frontend.onrender.com`), sin barra final.
- **No definir `PORT`**: Render la inyecta y el servidor ya la lee
  (`Number(process.env.PORT) || 8080`).
- Opcional: `NODE_VERSION=22` (el proyecto requiere Node.js 20.10 o superior).

**Configuración del Static Site (frontend)**

- **Root Directory**: `frontend`
- **Build Command**: vacío (no hay build)
- **Publish Directory**: `.`
- La URL del backend se configura en `frontend/js/config.js`; en este
  repositorio ya apunta a `https://proyecto-bibliotech.onrender.com`:

  ```js
  window.BIBLIO_CONFIG = {
    API_URL: 'https://proyecto-bibliotech.onrender.com'
  };
  ```

  Ese archivo se versiona: cada cambio requiere commit y push para que Render lo
  vuelva a publicar.
- La cookie de sesión se emite como `SameSite=None; Secure` cuando la petición
  llega por HTTPS, para que viaje entre dominios distintos.

**Alternativa: un único Web Service**

También es posible publicar solo el Web Service y usar su URL como frontend y
API (el backend sirve `frontend/`). En ese caso hay que dejar `API_URL` vacía y
no hace falta configurar CORS, porque frontend y API comparten origen.

**Advertencias del despliegue actual**

- Safari/iOS bloquea cookies de terceros, por lo que el login puede no persistir
  en el Static Site.
- En el Static Site no se ejecutan las guardas de servidor de `/pages/*.html`
  (la protección se mantiene en `requerirSesion()` del cliente y en cada
  endpoint de la API).
- El plan free suspende el backend tras 15 minutos sin tráfico: la primera
  petición puede tardar hasta un minuto.
- Los datos son en memoria: cada reinicio o deploy vuelve a
  `backend/data/semilla.json`.

**Verificación después del deploy**

1. <https://proyecto-bibliotech.onrender.com/api/health> debe responder
   `{"estado":"ok", ...}`.
2. Abrir <https://proyecto-bibliotech-frontend.onrender.com> e iniciar sesión.
   En DevTools → Network, `POST /api/auth/login` debe responder 200 y
   `Access-Control-Allow-Origin` debe ser
   `https://proyecto-bibliotech-frontend.onrender.com`.
3. En DevTools → Application → Cookies, `biblio_sesion` debe estar presente con
   `HttpOnly`, `Secure` y `SameSite=None`.
4. Recargar una página protegida: `GET /api/auth/me` debe responder 200 (la
   sesión persiste).

### Cómo probar la API

```bash
cd backend
npm test
```

Las pruebas trabajan sobre la copia en memoria de la semilla y no modifican
archivos: cada ejecución parte de los datos iniciales. Cubren autenticación, permisos por rol, catálogo, reservas, cupo,
colecciones únicas, sin stock, privacidad de menores, aprobación, devolución,
rechazo, inventario, notificaciones, reporte, tablero, guardas de página
(incluido `HEAD` y `?volver=`), reseñas, edición y baja lógica de libros,
validación de datos, cookies malformadas, tiempo de respuesta y 60 consultas
concurrentes.

### Credenciales de prueba

Todas las cuentas usan la clave `1234`.

| Usuario      | Rol           | Nombre              | Notas |
|--------------|---------------|---------------------|-------|
| `mgarcia`    | socio         | Mariana García      | Socio 1001, 2 préstamos activos |
| `psuarez`    | socio         | Pablo Suárez        | Socio 1002, 3 compromisos y un préstamo vencido |
| `lbenitez`   | socio         | Lucía Benítez       | Socio menor 1003 (privacidad de apellido) |
| `blopez`     | bibliotecario | Beatriz López       | — |
| `crodriguez` | bibliotecario | Carlos Rodríguez    | — |
| `dperez`     | director      | Daniel Pérez        | — |
| `mgomez`     | director      | María Gómez         | — |

Las credenciales se documentan únicamente acá y no se muestran en la interfaz.
Los cambios de la demo viven en memoria: al reiniciar el servidor se vuelve
automáticamente a los datos iniciales de `backend/data/semilla.json`.

---

## 6. TECNOLOGÍAS UTILIZADAS

- **Backend Node.js + Express 5** (`backend/index.js`)
  - API REST con rutas por recurso y respuestas JSON
  - Sesiones en memoria con cookie `HttpOnly`; `SameSite=Lax` en HTTP local y
    `SameSite=None; Secure` cuando la petición llega por HTTPS (Render)
  - Middlewares de autenticación y autorización por rol
  - Validación de reglas de negocio y errores con códigos propios
  - Datos en memoria (arrays y objetos) reiniciados desde la semilla
  - CORS con credenciales y lista blanca opcional (`BIBLIO_ORIGENES`)
  - Guardas de página del lado del servidor
  - Registro de tiempos de respuesta de la API
- **Frontend sin frameworks ni paso de build**
  - HTML5 semántico: `<header>`, `<nav>`, `<main>`, `<section>`, `<table>` con `<caption>`/`<thead>`/`<tbody>`, `aria-live`, `role="alert"`
  - CSS externo con Flexbox, utilidades (`.boton`, `.etiqueta`, `.aviso`), responsive en 1024/768/480 px y estilos de impresión
  - `frontend/js/scripts.js`: cliente `fetch` centralizado, control de sesión, navbar dinámica, avisos y utilidades de fecha
  - `frontend/js/config.js`: URL del backend centralizada (vacía = mismo origen)
  - Sin `localStorage`: todo el estado se consulta y se modifica a través de la API
  - Indicador global de carga y exportación del reporte de vencidos a CSV
- **Pruebas**: `node:test` + `node:assert/strict` sobre los datos en memoria
- **Despliegue**: Render, con un Static Site para el frontend y un Web Service
  para el backend. El servidor usa `process.env.PORT`, expone el health check
  `/api/health` y sirve el frontend estático cuando se accede por su propia URL.

---

## 7. ENDPOINTS DE LA API

La API se monta bajo el prefijo `/api` (`app.use('/api', api)` en
`backend/index.js`). Bases:

- Local: `http://localhost:8080/api`
- Pública (Render): `https://proyecto-bibliotech.onrender.com/api`

**Autenticación:** `POST /api/auth/login` devuelve la cookie de sesión
`biblio_sesion` (`HttpOnly`; `SameSite=Lax` en HTTP local y
`SameSite=None; Secure` cuando la petición llega por HTTPS). El frontend la
envía con `credentials: 'include'`. Cada ruta protegida valida la sesión y,
cuando corresponde, el rol.

**Acceso:** "público" = sin sesión; "autenticado" = cualquier usuario logueado;
el resto indica el rol requerido.

| Método | Ruta completa | Acceso | Descripción |
|--------|---------------|--------|-------------|
| GET | `/api/health` | público | Estado del servidor, versión y uptime |
| GET | `/api/config` | público | Configuración (días de préstamo, máximo, nombre) |
| POST | `/api/auth/login` | público | Inicia sesión y entrega la cookie `biblio_sesion` |
| POST | `/api/auth/logout` | autenticado | Cierra la sesión y borra la cookie |
| GET | `/api/auth/me` | autenticado | Datos del usuario de la sesión |
| GET | `/api/libros` | autenticado | Catálogo con filtros `buscar`, `genero`, `disponible` |
| GET | `/api/libros/populares` | público | Los 6 libros más pedidos (préstamos + solicitudes no rechazadas) |
| GET | `/api/libros/:id` | autenticado | Detalle de un libro activo |
| POST | `/api/libros` | bibliotecario | Alta de libro (título, autor y género obligatorios) |
| PUT | `/api/libros/:id` | bibliotecario | Edita título, autor, género, año, descripción y `soloSala` |
| DELETE | `/api/libros/:id` | bibliotecario | Baja lógica (`eliminado: true`), conserva el historial |
| GET | `/api/libros/:id/resenias` | autenticado | Reseñas del libro con promedio y total |
| POST | `/api/libros/:id/resenias` | socio | Crea o actualiza la reseña propia (puntuación 1-5 + comentario) |
| POST | `/api/libros/:id/ejemplares` | bibliotecario | Agrega ejemplares (`{ cantidad }`) |
| POST | `/api/libros/:id/baja` | bibliotecario | Quita un ejemplar del inventario (baja de cantidad) |
| POST | `/api/solicitudes` | socio | Crea una reserva (`{ libroId, fechaRetiro }`) |
| GET | `/api/solicitudes` | bibliotecario | Solicitudes por estado (`?estado=`, por defecto `pendiente`) |
| GET | `/api/solicitudes/mias` | socio | Reservas propias para consultar el ticket |
| GET | `/api/solicitudes/:id` | socio dueño / bibliotecario | Detalle de una solicitud |
| PATCH | `/api/solicitudes/:id` | bibliotecario | Cambia el estado a `aprobada` o `rechazada` |
| POST | `/api/solicitudes/:id/aprobar` | bibliotecario | Alias de acción: aprueba la entrega y crea el préstamo |
| POST | `/api/solicitudes/:id/rechazar` | bibliotecario | Alias de acción: rechaza y repone stock |
| GET | `/api/prestamos/mios` | socio | Préstamos activos, devueltos y sanciones |
| GET | `/api/prestamos` | bibliotecario | Préstamos activos |
| GET | `/api/prestamos/vencidos` | bibliotecario / director | Reporte de préstamos vencidos |
| GET | `/api/reportes/morosos` | bibliotecario / director | Morosos agrupados por socio y detalle de vencidos |
| GET | `/api/prestamos/proximos` | bibliotecario | Devoluciones de hoy o anteriores |
| PATCH | `/api/prestamos/:id` | bibliotecario | Cambia el estado a `devuelto` y repone stock (`{ estado }`) |
| POST | `/api/prestamos/:id/devolucion` | bibliotecario | Alias de acción: registra devolución y repone stock |
| POST | `/api/notificaciones` | bibliotecario | Envía una notificación a un socio (`{ nroSocio, libroId?, motivo? }`) |
| GET | `/api/notificaciones/mias` | socio | Notificaciones del socio |
| PATCH | `/api/notificaciones/:id` | socio | Marca una notificación como leída (`{ leida: true }`) |
| POST | `/api/notificaciones/:id/leida` | socio | Alias de acción: marca una notificación como leída |
| GET | `/api/dashboard` | director | Indicadores, categorías más leídas y títulos faltantes |

Cualquier otra ruta bajo `/api` responde `404` con `RUTA_NO_ENCONTRADA`.

Códigos de error principales:

- **400:** `DATOS_INCOMPLETOS`, `DATOS_INVALIDOS`, `ESTADO_INVALIDO`,
  `FECHA_INVALIDA`, `PUNTUACION_INVALIDA`, `COMENTARIO_VACIO`,
  `COMENTARIO_LARGO`, `JSON_INVALIDO`
- **401:** `NO_AUTENTICADO`, `CREDENCIALES_INVALIDAS`
- **403:** `SIN_PERMISO`
- **404:** `LIBRO_NO_ENCONTRADO`, `SOLICITUD_NO_ENCONTRADA`,
  `PRESTAMO_NO_ENCONTRADO`, `SOCIO_NO_ENCONTRADO`,
  `NOTIFICACION_NO_ENCONTRADA`, `RUTA_NO_ENCONTRADA`
- **409:** `SIN_STOCK`, `SIN_EJEMPLARES`, `CUPO_EXCEDIDO`, `LIBRO_SOLO_SALA`,
  `SOLICITUD_NO_PENDIENTE`, `PRESTAMO_NO_ACTIVO`
- **500:** `ERROR_INTERNO`

---

## 8. FUNCIONAMIENTO GENERAL

1. El navegador carga el frontend desde el Static Site de Render (o desde
   Express en `http://localhost:8080`, que también sirve `frontend/`).
2. `frontend/js/scripts.js` consulta `GET /api/auth/me` para conocer la sesión.
3. El login llama a `POST /api/auth/login`; el servidor responde con la cookie
   `biblio_sesion` y el frontend redirige según el rol.
4. La navbar y los accesos se arman según el rol.
5. Cada operación (reservar, aprobar, devolver, notificar, alta/baja) se ejecuta
   contra la API y el servidor actualiza sus estructuras en memoria antes de
   responder. No se escribe en disco: al reiniciar se vuelve a la semilla.
6. El panel del bibliotecario se actualiza automáticamente cada 15 segundos.

> La autenticación usa contraseñas en texto plano por tratarse de un prototipo
> académico. Para producción corresponde hashear las claves, usar sesiones
> persistidas o JWT, agregar HTTPS y limitar intentos de login.

Para más detalle ver `documentacion/relevamiento.pdf`,
`documentacion/Caso de estudio 2.txt`, `documentacion/anotaciones.md` y
`documentacion/diagramas/diagramas.md`.
