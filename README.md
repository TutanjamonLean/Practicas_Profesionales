# BiblioTech

Sistema de gestion de biblioteca para la Biblioteca Provincial "Manuel Belgrano". Prototipo HTML/CSS del Hito 02 de la materia Practicas Profesionalizantes I.

## Nombre del caso de estudio
BiblioTech

## Nombre del equipo desarrollador
Grupo 7

## Integrantes
- German Zanatta - Rol: Tablero del director 
- Leandro Ferrante
- Lola Torres - Rol: Inicio de sesion
- Matias Donato - Rol: Catalogo  
- Agustin Vasto - Rol: Mi historial
- Thiago Gomez Rodriguez - Rol: Panel Bibliotecario

## Descripcion del sistema
BiblioTech es la aplicacion web que automatiza la gestion de prestamos de libros, el control de inventario y la administracion de socios de la Biblioteca Provincial "Manuel Belgrano". Su objetivo principal es optimizar el acceso a la cultura por parte de los vecinos, permitiendoles consultar la disponibilidad del material bibliografico y reservar ejemplares de manera rapida y segura. El sistema se centra en la autogestion del socio y opera en un entorno de red local dentro de la institucion para modernizar los procesos manuales actuales.

El sistema contempla tres roles:
- **Socio**: busca libros en el catalogo, solicita prestamos, consulta su historial de lecturas y revisa si tiene sanciones vigentes. Maximo de 3 prestamos simultaneos. Los menores de edad aparecen solo por su nombre de pila para proteger su privacidad.
- **Bibliotecario**: ve solicitudes pendientes y devoluciones del dia, aprueba entregas, registra devoluciones, da de baja ejemplares deteriorados y envia notificaciones a socios morosos. Atiende el mostrador con una interfaz de alto contraste y botones grandes, pensada para voluntarios mayores con vision reducida.
- **Director**: consulta un tablero de control unificado con el estado del catalogo, la actividad de los socios, las categorias mas leidas y los titulos faltantes en el inventario.

Reglas de negocio representadas en el prototipo:
- Limite de 3 prestamos simultaneos por socio (se muestra como aviso).
- Libros restringidos (colecciones unicas) solo se consultan en sala.
- Aviso destacado al socio cuando el libro buscado no tiene stock.
- Interfaz de administracion con alto contraste y botones grandes.

---

## 1. REQUISITOS DE LA ELICITACION

### 1.1 Actores y Stakeholders Identificados

| Actor/Stakeholder | Rol | Interes Principal |
|-------------------|-----|-------------------|
| **Socio (usuario final)** | Ciudadano que usa la biblioteca | Acceso rapido a catalogo, reserva de libros, consulta de historial y estado de prestamos |
| **Bibliotecario / Voluntario** | Personal de atencion al publico | Gestion de prestamos/devoluciones en mostrador, notificaciones a morosos, baja de ejemplares |
| **Director de la Biblioteca** | Autoridad decisional | Vision estrategica: indicadores de uso, categorias populares, faltantes de inventario |
| **Administrador de Sistemas (TI)** | Soporte tecnico | Mantenimiento, despliegue en red local, seguridad, backup |
| **Menores de edad (socios especiales)** | Grupo vulnerable | Proteccion de datos personales (solo nombre de pila visible) |

### 1.2 Tecnicas de Elicitacion Aplicadas

| Tecnica | Descripcion | Artefacto Generado |
|---------|-------------|-------------------|
| **Entrevistas semiestructuradas** | Conversaciones con bibliotecarios actuales y director para entender flujo de trabajo manual | Lista de problemas: perdida de fichas, dificultad para ubicar ejemplares, notificaciones manuales lentas |
| **Observacion directa (etnografia ligera)** | Sesiones en mostrador viendo como atienden prestamos/devoluciones actualmente | Identificacion de necesidades de accesibilidad (botones grandes, alto contraste) |
| **Analisis de documentacion existente** | Reglamento interno de la biblioteca, normativa de proteccion al menor, estadisticas de prestamos 2024-2025 | Reglas de negocio: max 3 prestamos, coleccion unica solo sala, privacidad menores |
| **Talleres de co-diseno** | Sesiones con voluntarios mayores para validar prototipos de interfaz | Feedback: tamano de fuente, contraste de colores, flujo simplificado |
| **Revision de normativa legal** | Ley de Proteccion de Datos Personales, Ley de Proteccion al Menor | Restricciones: no mostrar apellido/direccion de menores a terceros |

### 1.3 Requisitos Funcionales Elicitados (RF)

| ID | Requisito | Prioridad | Actor | Fuente |
|----|-----------|-----------|-------|--------|
| RF-01 | El sistema debe permitir buscar libros por titulo, autor y genero | Alta | Socio | Entrevista + Observacion |
| RF-02 | El sistema debe mostrar disponibilidad en tiempo real (disponibles, sin stock, solo sala) | Alta | Socio | Observacion + Documentacion |
| RF-03 | El sistema debe permitir reservar un ejemplar disponible | Alta | Socio | Entrevista |
| RF-04 | El sistema debe validar regla de maximo 3 prestamos simultaneos por socio | Alta | Socio/Bibliotecario | Reglamento interno |
| RF-05 | El sistema debe bloquear reserva de ejemplares de coleccion unica (solo sala) | Alta | Socio | Reglamento interno |
| RF-06 | El sistema debe generar comprobante digital de reserva con fecha limite de devolucion | Media | Socio | Entrevista |
| RF-07 | El sistema debe mostrar historial de prestamos: activos, devueltos, sanciones | Alta | Socio | Entrevista |
| RF-08 | El sistema debe ocultar apellido y direccion de socios menores de edad | Alta | Socio/Bibliotecario | Normativa legal |
| RF-09 | El sistema debe mostrar solicitudes de prestamo pendientes de aprobacion | Alta | Bibliotecario | Observacion |
| RF-10 | El sistema debe permitir aprobar/rechazar entrega de ejemplar reservado | Alta | Bibliotecario | Observacion |
| RF-11 | El sistema debe mostrar devoluciones programadas para el dia | Alta | Bibliotecario | Observacion |
| RF-12 | El sistema debe permitir registrar devolucion fisica de ejemplar | Alta | Bibliotecario | Observacion |
| RF-13 | El sistema debe listar socios con prestamos vencidos (morosos) | Media | Bibliotecario | Entrevista |
| RF-14 | El sistema debe permitir enviar notificacion a socio moroso | Media | Bibliotecario | Entrevista |
| RF-15 | El sistema debe permitir dar de baja ejemplar deteriorado | Media | Bibliotecario | Entrevista |
| RF-16 | El sistema debe permitir registrar nuevo ejemplar en inventario | Media | Bibliotecario | Entrevista |
| RF-17 | El sistema debe generar reporte de prestamos vencidos | Baja | Bibliotecario | Entrevista |
| RF-18 | El sistema debe mostrar dashboard con indicadores generales (socios activos, prestamos vigentes, vencidos, stock) | Alta | Director | Entrevista + Documentacion |
| RF-19 | El sistema debe mostrar ranking de categorias mas leidas (ultimo mes) | Media | Director | Entrevista |
| RF-20 | El sistema debe listar titulos faltantes o con stock critico (0-1 ejemplares) | Alta | Director | Entrevista |
| RF-21 | El sistema debe autenticar usuarios por rol (socio, bibliotecario, director) | Alta | Todos | Seguridad basica |
| RF-22 | La interfaz de bibliotecario debe tener alto contraste y botones grandes | Alta | Bibliotecario | Co-diseno + Observacion |

### 1.4 Requisitos No Funcionales Elicitados (RNF)

| ID | Requisito | Categoria | Metrica/Criterio |
|----|-----------|-----------|------------------|
| RNF-01 | Despliegue en red local (intranet) sin acceso a internet | Infraestructura | Servidor local, sin dependencias externas |
| RNF-02 | Tiempo de respuesta de busqueda en catalogo < 2 segundos | Rendimiento | 95 percentil < 2s con 10k registros |
| RNF-03 | Interfaz accesible WCAG 2.1 AA (contraste, tamano fuente, navegacion teclado) | Accesibilidad | Auditoría automatizada + test con usuarios |
| RNF-04 | Proteccion de datos personales de menores (pseudonimizacion) | Seguridad/Legal | Solo nombre de pila visible en UI |
| RNF-05 | Disponibilidad 99% en horario de atencion (8hs a 20hs) | Disponibilidad | Ventana de mantenimiento fuera de horario |
| RNF-06 | Backup automatico diario de base de datos | Integridad | Recuperacion punto en el tiempo (RPO < 24h) |
| RNF-07 | Interfaz responsive (desktop tablet movil) | Usabilidad | Breakpoints: 1024px, 768px, 480px |
| RNF-08 | Navegadores soportados: Chrome, Firefox, Edge (ultimas 2 versiones) | Compatibilidad | Testing cruzado |
| RNF-09 | Separacion de responsabilidades: HTML semantico, CSS externo, JS modular (Hito 03) | Mantenibilidad | Estructura de carpetas, linting |
| RNF-10 | Documentacion de codigo y arquitectura | Mantenibilidad | README, comentarios JSDoc, diagramas |

### 1.5 Restricciones del Proyecto

| Restriccion | Descripcion |
|-------------|-------------|
| **Tecnologia Hito 02** | Solo HTML5 semantico + CSS basico (sin JavaScript, sin backend) |
| **Prototipo estatico** | Navegacion simulada via `action` en formularios y enlaces |
| **Entorno** | Red local de la biblioteca (sin cloud, sin CDN) |
| **Equipo** | 6 integrantes, roles definidos por pantalla |
| **Plazo** | Entrega Hito 02: prototipo navegable completo |
| **Normativa** | Cumplimiento Ley Proteccion Datos + Ley Proteccion Menor |

---

## 2. ANALISIS FUNCIONAL

### 2.1 Descomposicion Funcional (Casos de Uso por Subsistema)

```
BIBLIOTECH
├── AUTENTICACION Y ACCESO
│   ├── CU-01: Iniciar sesion
│   └── CU-02: Cerrar sesion
├── GESTION DE CATALOGO (SOCIO)
│   ├── CU-03: Buscar libros
│   ├── CU-04: Filtrar por genero/disponibilidad
│   ├── CU-05: Ver detalle de libro y disponibilidad
│   └── CU-06: Reservar ejemplar
├── GESTION DE PRESTAMOS (SOCIO)
│   ├── CU-07: Confirmar reserva (comprobante)
│   ├── CU-08: Consultar historial de prestamos
│   ├── CU-09: Ver prestamos activos
│   ├── CU-10: Ver libros devueltos
│   └── CU-11: Ver sanciones vigentes
├── ATENCION EN MOSTRADOR (BIBLIOTECARIO)
│   ├── CU-12: Ver solicitudes pendientes
│   ├── CU-13: Aprobar entrega de ejemplar
│   ├── CU-14: Rechazar solicitud de prestamo
│   ├── CU-15: Ver devoluciones del dia
│   ├── CU-16: Registrar devolucion fisica
│   ├── CU-17: Ver socios morosos
│   ├── CU-18: Enviar notificacion a moroso
│   ├── CU-19: Dar de baja ejemplar deteriorado
│   ├── CU-20: Registrar nuevo ejemplar
│   └── CU-21: Generar reporte de prestamos vencidos
├── TABLERO DIRECTIVO (DIRECTOR)
│   ├── CU-22: Ver indicadores generales
│   ├── CU-23: Ver ranking categorias mas leidas
│   └── CU-24: Ver titulos faltantes en inventario
└── TRANSVERSALES
    ├── CU-25: Navegar entre pantallas (menu principal)
    └── CU-26: Acceso segun rol (autorizacion)
```

### 2.2 Modelo de Datos Conceptual (Entidades Principales)

| Entidad | Atributos Clave | Relaciones |
|---------|-----------------|------------|
| **Socio** | nro_socio (PK), nombre, apellido, dni, fecha_nac, es_menor, direccion, telefono, email, estado_activo, sanciones_count | 1:N Prestamo, 1:N Notificacion |
| **Libro** | isbn (PK), titulo, autor, genero, anio_publicacion, editorial, coleccion_unica (bool) | 1:N Ejemplar |
| **Ejemplar** | nro_ejemplar (PK), isbn (FK), estado (disponible/prestado/en_sala/baja), ubicacion | N:1 Libro, 1:N Prestamo |
| **Prestamo** | id_prestamo (PK), nro_socio (FK), nro_ejemplar (FK), fecha_reserva, fecha_retiro, fecha_devolucion_estimada, fecha_devolucion_real, estado (reservado/activo/devuelto/vencido) | N:1 Socio, N:1 Ejemplar |
| **Sancion** | id_sancion (PK), nro_socio (FK), tipo (retraso/perdida/deterioro), fecha_inicio, fecha_fin, descripcion, estado (activa/cumplida) | N:1 Socio |
| **Notificacion** | id_notif (PK), nro_socio (FK), tipo (vencimiento/moroso/novedad), mensaje, fecha_envio, leida (bool) | N:1 Socio |
| **UsuarioSistema** | username (PK), password_hash, rol (socio/bibliotecario/director), nro_socio (FK, nullable), activo (bool) | 1:1 Socio (opcional) |

### 2.3 Flujos Principales (Secuencias)

#### Flujo F-01: Reserva de Libro por Socio
```
Socio -> [Login] -> Catalogo -> [Buscar/Filtrar] -> Lista resultados
  -> [Click Reservar] -> Formulario Reserva -> [Validar: stock>0, prestamos<3, no coleccion_unica]
  -> [Exito] -> Confirmacion (comprobante con fecha limite) -> Historial
  -> [Fallo] -> Aviso en pantalla (stock 0 / limite 3 / solo sala) -> Catalogo
```

#### Flujo F-02: Entrega en Mostrador (Bibliotecario)
```
Bibliotecario -> [Login] -> Panel -> [Ver Solicitudes Pendientes]
  -> [Click Aprobar] -> Cambia estado Prestamo: reservado -> activo
  -> Registra fecha_retiro = hoy -> Actualiza Ejemplar: disponible -> prestado
  -> [Opcional] -> Imprime/entrega comprobante fisico
```

#### Flujo F-03: Devolucion en Mostrador
```
Bibliotecario -> Panel -> [Ver Devoluciones del Dia]
  -> [Click Registrar] -> Cambia estado Prestamo: activo -> devuelto
  -> Registra fecha_devolucion_real = hoy -> Actualiza Ejemplar: prestado -> disponible
  -> [Si vencido] -> Genera Sancion automatica -> Notifica al socio
```

#### Flujo F-04: Consulta Directiva
```
Director -> [Login] -> Tablero -> Carga indicadores (queries agregadas)
  -> [Ver Categorias] -> Ranking por count(prestamos) group by genero (ultimo mes)
  -> [Ver Faltantes] -> Libros con count(ejemplares_disponibles) <= 1
```

### 2.4 Reglas de Negocio Formales

| Regla | Descripcion | Expresion Formal |
|-------|-------------|------------------|
| **RN-01** | Maximo 3 prestamos activos simultaneos por socio | `COUNT(p WHERE p.socio = s AND p.estado IN ('reservado','activo')) <= 3` |
| **RN-02** | Coleccion unica => solo consulta en sala (no prestable) | `IF libro.coleccion_unica THEN ejemplar.estado != 'disponible_para_prestamo'` |
| **RN-03** | Menor de edad => pseudonimizacion en vistas terceros | `IF socio.es_menor AND vista != 'propia' THEN mostrar(solo nombre_pila)` |
| **RN-04** | Prestamo vencido => sancion automatica + notificacion | `IF prestamo.fecha_devolucion_estimada < HOY AND estado='activo' THEN crear_sancion + notificar` |
| **RN-05** | Fecha limite devolucion = fecha_retiro + 14 dias | `fecha_devolucion_estimada = fecha_retiro + 14d` |
| **RN-06** | Solo bibliotecario puede cambiar estado prestamo a 'activo' | `ROL(usuario) = 'bibliotecario' REQUIRED FOR transition(reservado -> activo)` |
| **RN-07** | Baja de ejemplar => no prestable, cuenta en inventario | `ejemplar.estado = 'baja' => NOT disponible_para_prestamo` |

### 2.5 Matriz de Trazabilidad (Requisito -> Pantalla -> Caso de Uso)

| Requisito | Pantalla HTML | Casos de Uso |
|-----------|---------------|--------------|
| RF-01, RF-02 | `pages/catalogo.html` | CU-03, CU-04, CU-05 |
| RF-03, RF-04, RF-05 | `pages/reserva.html` | CU-06 |
| RF-06 | `pages/confirmacion.html` | CU-07 |
| RF-07, RF-08 | `pages/historial.html` | CU-08, CU-09, CU-10, CU-11 |
| RF-09, RF-10 | `pages/panel-bibliotecario.html` (seccion 1) | CU-12, CU-13, CU-14 |
| RF-11, RF-12 | `pages/panel-bibliotecario.html` (seccion 2) | CU-15, CU-16 |
| RF-13, RF-14 | `pages/panel-bibliotecario.html` (seccion 3) | CU-17, CU-18 |
| RF-15, RF-16, RF-17 | `pages/panel-bibliotecario.html` (seccion 4) | CU-19, CU-20, CU-21 |
| RF-18 | `pages/tablero-director.html` (seccion 1) | CU-22 |
| RF-19 | `pages/tablero-director.html` (seccion 2) | CU-23 |
| RF-20 | `pages/tablero-director.html` (seccion 3) | CU-24 |
| RF-21 | `pages/login.html` | CU-01, CU-02 |
| RF-22 | `pages/panel-bibliotecario.html` (estilos) | Transversal (RNF-03) |
| RNF-03 | Todas (CSS alto contraste, botones grandes) | Transversal |
| RNF-04 | `pages/historial.html`, `pages/panel-bibliotecario.html` | CU-08, CU-12, CU-17 |

---

## 3. CASOS DE USO DETALLADOS

### Formato: Caso de Uso Completo (Actor, Precondicion, Flujo Principal, Flujos Alternativos, Postcondicion)

---

#### CU-01: Iniciar Sesion
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio, Bibliotecario, Director |
| **Actor Secundario** | Sistema de Autenticacion |
| **Precondicion** | Usuario registrado en sistema, credenciales validas |
| **Disparador** | Usuario accede a `login.html` y envia formulario |

**Flujo Principal:**
1. Usuario ingresa usuario, contrasena y selecciona rol (Socio/Bibliotecario/Director)
2. Sistema valida credenciales contra base de datos
3. Si valido: crea sesion, redirige a pagina segun rol:
   - Socio -> `catalogo.html`
   - Bibliotecario -> `panel-bibliotecario.html`
   - Director -> `tablero-director.html`
4. Sistema registra auditoria de acceso (timestamp, IP, rol)

**Flujos Alternativos:**
- **A1: Credenciales invalidas** -> Muestra error "Usuario/contraseña incorrectos", permite reintento (max 3)
- **A2: Usuario inactivo/bloqueado** -> Muestra "Cuenta deshabilitada, contacte administracion"
- **A3: Rol no coincide** -> Muestra "El rol seleccionado no corresponde a este usuario"

**Postcondicion:** Usuario autenticado con sesion activa, permisos segun rol asignado.

**Reglas de Negocio:** RN-06 (autorizacion por rol), RNF-04 (proteccion datos)

---

#### CU-02: Cerrar Sesion
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio, Bibliotecario, Director |
| **Precondicion** | Sesion activa |
| **Disparador** | Usuario click en "Cerrar sesion" (pendiente implementacion Hito 03) |

**Flujo Principal:**
1. Usuario solicita cerrar sesion
2. Sistema invalida token/sesion, limpia almacenamiento local
3. Redirige a `index.html` (publico)

**Postcondicion:** Sesion terminada, acceso a areas protegidas denegado.

---

#### CU-03: Buscar Libros
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | Usuario autenticado como socio, acceso a `catalogo.html` |
| **Disparador** | Usuario ingresa termino y/o selecciona filtros, click "Buscar" |

**Flujo Principal:**
1. Sistema recibe parametros: termino (texto libre), genero (select), solo_disponibles (checkbox)
2. Ejecuta consulta: `LIKE %termino%` en titulo/autor + `genero = seleccion` + `disponibles > 0` (si check)
3. Retorna lista paginada de libros con: titulo, autor, genero, anio, disponibilidad
4. Muestra badge de estado por ejemplar: "X disponibles" / "Sin stock" / "Solo sala"

**Flujos Alternativos:**
- **A1: Sin resultados** -> Muestra "No se encontraron libros", sugiere ampliar busqueda
- **A2: Termino vacio sin filtros** -> Muestra catalogo completo (paginado)

**Postcondicion:** Lista de resultados mostrada, usuario puede seleccionar para reservar.

**Reglas de Negocio:** RN-02 (coleccion unica muestra "Solo sala")

---

#### CU-04: Filtrar por Genero/Disponibilidad
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | En `catalogo.html` |
| **Disparador** | Cambia select genero y/o checkbox "Solo disponibles", click "Buscar" |

**Flujo Principal:** Igual a CU-03 paso 2-4 con filtros aplicados.

---

#### CU-05: Ver Detalle y Disponibilidad
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | Resultados de busqueda visibles |
| **Disparador** | Usuario visualiza tarjeta de libro en catalogo |

**Flujo Principal:**
1. Sistema muestra por cada libro: titulo, autor, genero, anio
2. Badge de estado:
   - Verde "X disponibles" -> boton "Reservar" habilitado
   - Rojo "Sin stock disponible" -> boton deshabilitado, aviso "Te avisaremos..."
   - Amarillo "Solo consulta en sala" -> sin boton reservar, texto explicativo
3. Usuario decide reservar (si habilitado) -> va a CU-06

---

#### CU-06: Reservar Ejemplar
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | Libro con stock > 0, no coleccion_unica, socio con < 3 prestamos activos |
| **Disparador** | Click "Reservar" en catalogo -> `reserva.html` |

**Flujo Principal:**
1. `reserva.html` muestra formulario con: titulo, autor (prellenados), nro_ejemplar, nro_socio, fecha_retiro
2. Usuario completa datos, click "Confirmar reserva"
3. Sistema valida en servidor (Hito 03):
   - `ejemplar.estado = 'disponible'`
   - `COUNT(prestamos_activos(socio)) < 3`
   - `libro.coleccion_unica = FALSE`
4. Si todo OK: crea Prestamo(estado='reservado'), calcula fecha_limite = fecha_retiro + 14d
5. Redirige a `confirmacion.html` con comprobante

**Flujos Alternativos:**
- **A1: Stock 0** -> `confirmacion.html` con error "Ejemplar no disponible"
- **A2: Limite 3 prestamos** -> Error "Ya tiene 3 prestamos activos"
- **A3: Coleccion unica** -> Error "Este ejemplar es de uso exclusivo en sala"
- **A4: Socio inexistente** -> Error "Numero de socio no encontrado"
- **A5: Cancelar** -> Click "Cancelar" -> vuelve a `catalogo.html`

**Postcondicion:** Reserva registrada (estado 'reservado'), comprobante generado, stock decrementado logicamente.

**Reglas de Negocio:** RN-01, RN-02, RN-05

---

#### CU-07: Confirmar Reserva (Comprobante)
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | Reserva exitosa (CU-06) |
| **Disparador** | Redireccion automatica a `confirmacion.html` |

**Flujo Principal:**
1. Muestra comprobante digital con: titulo, autor, nro_socio, fecha_solicitud, fecha_limite_devolucion, estado="Reservado"
2. Instrucciones: "Acerca este comprobante al mostrador para retirar el ejemplar"
3. Enlaces: "Volver al catalogo", "Ir a Mi historial", "Ir al inicio"

**Postcondicion:** Socio informado, proximo paso: retiro fisico en mostrador (CU-13).

---

#### CU-08: Consultar Historial de Prestamos
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Precondicion** | Autenticado como socio, acceso a `historial.html` |
| **Disparador** | Navegacion a "Mi historial" |

**Flujo Principal:**
1. Sistema carga 3 secciones tabuladas:
   - **Prestamos activos**: tabla (titulo, autor, retirado, devolucion, estado="Activo")
   - **Libros devueltos**: tabla (titulo, autor, devuelto_el, estado="Devuelto")
   - **Sanciones vigentes**: lista o mensaje "Sin sanciones"
2. Aplica RN-03: si socio es menor, oculta apellido/direccion en cualquier vista

**Postcondicion:** Historial mostrado completo y filtrado por privacidad.

---

#### CU-09/10/11: Ver Prestamos Activos / Devueltos / Sanciones
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Socio |
| **Descripcion** | Sub-casos de CU-08, cada seccion es un caso de uso atomico para trazabilidad |

---

#### CU-12: Ver Solicitudes Pendientes (Bibliotecario)
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Autenticado como bibliotecario, `panel-bibliotecario.html` |
| **Disparador** | Carga de panel (seccion 1) |

**Flujo Principal:**
1. Sistema consulta: `Prestamo WHERE estado='reservado' ORDER BY fecha_reserva`
2. Muestra tabla: Socio (pseudonimizado si menor), Titulo, Fecha, Acciones [Aprobar][Rechazar]
3. Bibliotecario ve lista de espera para atender en mostrador

**Reglas:** RN-03 (menores -> solo nombre pila), RNF-03 (UI alto contraste)

---

#### CU-13: Aprobar Entrega de Ejemplar
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Existe Prestamo estado='reservado', socio presente en mostrador |
| **Disparador** | Click "Aprobar entrega" en fila de solicitud |

**Flujo Principal:**
1. Sistema valida: ejemplar sigue disponible, socio vigente
2. Actualiza Prestamo: estado='activo', fecha_retiro=HOY, fecha_devolucion_estimada=HOY+14d
3. Actualiza Ejemplar: estado='prestado'
4. Muestra confirmacion "Entrega aprobada", opcion imprimir comprobante
5. (Opcional) Notifica al socio: "Su libro ya puede retirarse"

**Flujos Alternativos:**
- **A1: Ejemplar ya no disponible** -> Error "Ejemplar prestado a otro usuario"
- **A2: Socio con sancion activa** -> Advertencia "Socio tiene sancion, ¿continuar?"

**Reglas:** RN-05, RN-06 (solo bibliotecario), RN-01 (revalida limite)

---

#### CU-14: Rechazar Solicitud
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Prestamo estado='reservado' |
| **Disparador** | Click "Rechazar" |

**Flujo Principal:**
1. Sistema pide motivo (select: stock_error / socio_invalido / otro + texto)
2. Actualiza Prestamo: estado='rechazado', motivo_rechazo
3. Libera ejemplar: estado='disponible'
4. Notifica al socio: "Su reserva fue rechazada: [motivo]"

---

#### CU-15: Ver Devoluciones del Dia
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Panel cargado (seccion 2) |
| **Disparador** | Carga automatica |

**Flujo Principal:**
1. Consulta: `Prestamo WHERE estado='activo' AND fecha_devolucion_estimada = HOY`
2. Tabla: Socio, Titulo, Vencimiento, Accion [Registrar devolucion]

---

#### CU-16: Registrar Devolucion Fisica
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Prestamo activo, ejemplar fisico en mano |
| **Disparador** | Click "Registrar devolucion" |

**Flujo Principal:**
1. Actualiza Prestamo: estado='devuelto', fecha_devolucion_real=HOY
2. Actualiza Ejemplar: estado='disponible'
3. **Si fecha_devolucion_real > fecha_devolucion_estimada**: dispara RN-04 (crea Sancion + Notificacion)
4. Muestra "Devolucion registrada"

**Flujos Alternativos:**
- **A1: Ejemplar deteriorado** -> Bibliotecario marca "Deteriorado" -> dispara CU-19 (baja)

---

#### CU-17: Ver Socios Morosos
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Panel cargado (seccion 3) |
| **Disparador** | Carga automatica |

**Flujo Principal:**
1. Consulta: `Prestamo WHERE estado='activo' AND fecha_devolucion_estimada < HOY` (agrupado por socio)
2. Tabla: Socio, Titulo, Dias_atraso, Accion [Enviar notificacion]
3. Aplica RN-03 (pseudonimizacion menores)

---

#### CU-18: Enviar Notificacion a Moroso
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Socio con prestamo vencido |
| **Disparador** | Click "Enviar notificacion" |

**Flujo Principal:**
1. Sistema genera Notificacion(tipo='moroso', mensaje='Tiene prestamo vencido: [titulo]. Por favor devuelva.')
2. Marca como enviada (email/sistema interno/impresa)
3. Registra en auditoria

---

#### CU-19: Dar de Baja Ejemplar Deteriorado
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Ejemplar en mal estado (identificado en devolucion o revision) |
| **Disparador** | Click "Dar de baja ejemplar deteriorado" (seccion 4) |

**Flujo Principal:**
1. Formulario: busca ejemplar por nro, confirma baja
2. Actualiza Ejemplar: estado='baja', fecha_baja=HOY, motivo
3. Si tenia prestamo activo -> error (debe devolverse primero)
4. Actualiza conteo de inventario (dispara alerta si stock critico -> CU-24)

**Reglas:** RN-07

---

#### CU-20: Registrar Nuevo Ejemplar
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Libro existe en catalogo (ISBN registrado) |
| **Disparador** | Click "Registrar nuevo ejemplar" |

**Flujo Principal:**
1. Formulario: ISBN (select libro existente), nro_ejemplar, ubicacion
2. Crea Ejemplar: estado='disponible'
3. Actualiza disponibilidad en catalogo (tiempo real)

---

#### CU-21: Generar Reporte Prestamos Vencidos
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Bibliotecario |
| **Precondicion** | Acceso a seccion reportes |
| **Disparador** | Click "Generar reporte de prestamos vencidos" |

**Flujo Principal:**
1. Genera PDF/CSV: listado completo prestamos vencidos (socio, titulo, dias_atraso, sancion)
2. Descarga o impresion directa

---

#### CU-22: Ver Indicadores Generales (Director)
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondicion** | Autenticado como director, `tablero-director.html` |
| **Disparador** | Carga de tablero (seccion 1) |

**Flujo Principal:**
1. Queries agregadas en tiempo real:
   - Socios activos: `COUNT(DISTINCT socio WHERE estado_activo=1)`
   - Prestamos vigentes: `COUNT(prestamo WHERE estado IN ('reservado','activo'))`
   - Prestamos vencidos: `COUNT(prestamo WHERE estado='activo' AND fecha_dev_est < HOY)`
   - Ejemplares en sala: `COUNT(ejemplar WHERE estado='en_sala')`
   - Disponibles prestamo: `COUNT(ejemplar WHERE estado='disponible')`
2. Muestra tabla de indicadores con valores numericos

---

#### CU-23: Ver Ranking Categorias Mas Leidas
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondicion** | Tablero cargado (seccion 2) |
| **Disparador** | Carga automatica |

**Flujo Principal:**
1. Query: `SELECT genero, COUNT(*) as prestamos FROM prestamo p JOIN ejemplar e ON p.ejemplar=e.nro JOIN libro l ON e.isbn=l.isbn WHERE p.fecha_reserva >= HOY-30d GROUP BY genero ORDER BY prestamos DESC`
2. Tabla ranking: Categoria | Prestamos (ultimo mes)

---

#### CU-24: Ver Titulos Faltantes en Inventario
| Campo | Descripcion |
|-------|-------------|
| **Actor Primario** | Director |
| **Precondicion** | Tablero cargado (seccion 3) |
| **Disparador** | Carga automatica |

**Flujo Principal:**
1. Query: Libros con `COUNT(ejemplar WHERE estado IN ('disponible','en_sala')) <= 1`
2. Tabla: Titulo, Autor, Stock_actual (0 o 1)
3. Uso: decision de compra/reposicion

---

#### CU-25: Navegacion Principal
| Campo | Descripcion |
|-------|-------------|
| **Actores** | Todos (publico y autenticados) |
| **Descripcion** | Menu `nav-principal` presente en todas las pantallas: Inicio, Login, Catalogo, Historial, Panel Bibliotecario, Tablero Director |
| **Regla** | Opciones visibles segun autenticacion/rol (Hito 03: ocultar/mostrar via JS) |

---

#### CU-26: Autorizacion por Rol
| Campo | Descripcion |
|-------|-------------|
| **Actores** | Sistema (transversal) |
| **Descripcion** | Control de acceso a nivel de ruta/pantalla:
- `/pages/catalogo.html`, `/pages/reserva.html`, `/pages/confirmacion.html`, `/pages/historial.html` -> Require rol='socio'
- `/pages/panel-bibliotecario.html` -> Require rol='bibliotecario'
- `/pages/tablero-director.html` -> Require rol='director'
- `/index.html`, `/pages/login.html` -> Publico |
| **Implementacion Hito 02** | Simulada via HTML estatico; Hito 03: middleware express + JWT/session |

---

## 4. PANTALLAS DESARROLLADAS (Hito 02)

| # | Archivo | Descripcion | Casos de Use Cubiertos |
|---|---------|-------------|------------------------|
| 1 | `index.html` | Landing page: presentacion, 3 tarjetas rol, acceso login | CU-25 |
| 2 | `pages/login.html` | Formulario usuario+clave+rol, submit simulado a index | CU-01 |
| 3 | `pages/catalogo.html` | Buscador (texto, genero, solo disponibles) + grid resultados con badges estado | CU-03, CU-04, CU-05 |
| 4 | `pages/reserva.html` | Formulario reserva (titulo, autor, ejemplar, socio, fecha_retiro) + avisos reglas | CU-06 |
| 5 | `pages/confirmacion.html` | Comprobante digital con datos prestamo, fecha limite, enlaces navegacion | CU-07 |
| 6 | `pages/historial.html` | 3 tablas: activos, devueltos, sanciones + aviso privacidad menores | CU-08, CU-09, CU-10, CU-11 |
| 7 | `pages/panel-bibliotecario.html` | 4 secciones: solicitudes, devoluciones, morosos, reportes/inventario (botones grandes, alto contraste) | CU-12 a CU-21 |
| 8 | `pages/tablero-director.html` | 3 secciones: indicadores, ranking categorias, titulos faltantes | CU-22, CU-23, CU-24 |

---

## 5. ESTRUCTURA DEL PROYECTO

```
Practicas_Profesionales/
|-- index.html              (pagina principal - landing)
|-- styles.css              (hoja de estilos base: tipografia, colores, flexbox, badges, tablas)
|-- README.md               (este documento)
|-- img/
|   |-- logo-bibliotech.svg (logo vectorial propio)
|-- pages/
    |-- login.html
    |-- catalogo.html
    |-- reserva.html
    |-- confirmacion.html
    |-- historial.html
    |-- panel-bibliotecario.html
    |-- tablero-director.html
```

---

## 6. TECNOLOGIAS UTILIZADAS (Hito 02)

- **HTML5 semantico**: `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<article>`, `<aside>`, `<fieldset>`, `<legend>`, `<table>` con `<caption>`/`<thead>`/`<tbody>`, encabezados jerarquicos (h1-h3), atributos ARIA (`role="alert"`, `role="status"`, `aria-label`)
- **CSS basico externo** (`styles.css`):
  - Variables CSS (custom properties) para colores, espaciado, tipografia
  - Flexbox para navbar, grid de tarjetas roles, layout de catalogo
  - Clases utilitarias `.boton`, `.boton-secundario`, `.etiqueta`, `.etiqueta-activo`, `.etiqueta-devuelto`, `.etiqueta-sala`, `.aviso`, `.aviso-exito`, `.aviso-error`
  - Accesibilidad: focus-visible, contraste AA, tamano fuente base 1rem, line-height 1.6
- **Formularios HTML** con `action` + `method="get"` para simulacion de navegacion entre pantallas (sin backend)
- **Navegacion consistente**: `nav-principal` replicado en todas las paginas
h

