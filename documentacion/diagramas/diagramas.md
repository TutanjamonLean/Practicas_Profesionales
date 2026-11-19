# Diagramas de BiblioTech

Diagramas en formato [Mermaid](https://mermaid.js.org/). Se visualizan
directamente en GitHub, GitLab, VS Code (extensión Markdown Preview Mermaid) y
en <https://mermaid.live>.

---

## 1. Arquitectura general

```mermaid
flowchart LR
    U[Usuario<br/>socio / bibliotecario / director]
    B[Navegador]
    F[Frontend estático<br/>HTML + CSS + JS]
    A[Backend Express<br/>:8080]
    S[Sesiones en memoria<br/>cookie HttpOnly]
    API[API REST /api]
    J[(Datos en memoria<br/>arrays y objetos)]

    U --> B
    B --> F
    F -->|fetch con cookie| API
    API --> A
    A --> S
    A -->|consulta y actualiza| J
    A -->|sirve páginas| F
```

**Capas:**

1. **Navegador**: HTML semántico, CSS y `scripts.js` como cliente de la API.
2. **Express**: sirve `frontend/`, protege páginas, valida sesión y roles.
3. **Dominio**: reglas de negocio (cupo, solo sala, stock, vencidos, privacidad).
4. **Datos**: estructuras en memoria (arrays y objetos), reiniciadas desde la semilla al arrancar.

---

## 2. Modelo de datos (esquema v2)

```mermaid
erDiagram
    USUARIO ||--o{ SOLICITUD : genera
    USUARIO ||--o{ PRESTAMO : realiza
    USUARIO ||--o{ NOTIFICACION : recibe
    LIBRO ||--o{ SOLICITUD : "es reservado"
    LIBRO ||--o{ PRESTAMO : "es prestado"
    LIBRO ||--o{ NOTIFICACION : referencia
    SOLICITUD ||--o| PRESTAMO : "se convierte"

    CONFIG {
        string version
        int diasPrestamo
        int maxPrestamos
        string nombreBiblioteca
    }

    USUARIO {
        int id
        string usuario
        string clave
        string rol
        string nombre
        string apellido
        string email
        string nroSocio
        string legajo
        bool esMenor
        string direccion
    }

    LIBRO {
        int id
        string titulo
        string autor
        string genero
        int anio
        int disponibles
        int totalEjemplares
        bool soloSala
        string descripcion
    }

    SOLICITUD {
        int id
        string nroSocio
        int libroId
        string fechaSolicitud
        string fechaRetiro
        string fechaDevolucion
        string estado
    }

    PRESTAMO {
        int id
        int solicitudId
        string nroSocio
        int libroId
        string fechaRetiro
        string fechaDevolucion
        string estado
        string fechaDevolucionReal
    }

    NOTIFICACION {
        int id
        string nroSocio
        int libroId
        string motivo
        string fecha
        bool leida
    }
```

**Estados:**

- `solicitud.estado`: `pendiente` → `aprobada` o `rechazada`.
- `prestamo.estado`: `activo` → `devuelto`.
- `libro.soloSala = true`: no se presta, solo consulta en sala.

---

## 3. Flujo de reserva de un libro

```mermaid
sequenceDiagram
    actor S as Socio
    participant C as Catálogo
    participant R as Reserva
    participant API as API Express
    participant DB as Datos en memoria

    S->>C: Busca por título, autor o género
    C->>API: GET /api/libros?buscar=...
    API->>DB: Lee catálogo
    DB-->>API: Libros
    API-->>C: Libros con estado
    C-->>S: Resultados y disponibilidad
    S->>R: Clic en "Reservar"
    R->>API: GET /api/libros/:id
    API-->>R: Detalle del libro
    S->>R: Elige fecha y confirma
    R->>API: POST /api/solicitudes
    API->>API: Valida sesión, stock, soloSala y cupo
    alt Sin stock o cupo excedido o solo sala
        API-->>R: 409 con código de error
        R-->>S: Aviso explicativo
    else Reserva válida
        API->>DB: Registra solicitud y descuenta stock en memoria
        API-->>R: 201 solicitud pendiente
        R-->>S: Confirmación con fecha límite
    end
```

---

## 4. Flujo de login y autorización

```mermaid
flowchart TD
    A[Ingresa usuario, clave y rol] --> B{POST /api/auth/login}
    B -- Credenciales inválidas --> C[401 CREDENCIALES_INVALIDAS]
    C --> A
    B -- Válidas --> D[Crea sesión en memoria]
    D --> E[Responde cookie HttpOnly]
    E --> F[Redirige según rol]
    F --> G{socio}
    F --> H{bibliotecario}
    F --> I{director}
    G --> G1[Catálogo + Mi historial]
    H --> H1[Panel bibliotecario]
    I --> I1[Tablero del director]

    J[Petición a página o API] --> K{¿Cookie válida?}
    K -- No --> L[401 o redirección al login]
    K -- Sí --> M{¿Rol autorizado?}
    M -- No --> N[403 o redirección al inicio del rol]
    M -- Sí --> O[Acceso permitido]
```

---

## 5. Flujo de aprobación y devolución

```mermaid
sequenceDiagram
    actor B as Bibliotecario
    participant P as Panel
    participant API as API Express
    participant DB as Datos en memoria
    actor S as Socio

    S->>API: POST /api/solicitudes
    API->>DB: solicitud pendiente (stock -1)
    B->>P: Abre el panel
    P->>API: GET /api/solicitudes
    API-->>P: Solicitudes pendientes
    B->>P: "Aprobar entrega"
    P->>API: PATCH /api/solicitudes/:id { estado: "aprobada" }
    API->>DB: préstamo activo, solicitud aprobada
    API-->>P: Préstamo creado
    Note over B,API: El stock ya estaba reservado
    B->>P: "Registrar devolución"
    P->>API: PATCH /api/prestamos/:id { estado: "devuelto" }
    API->>DB: préstamo devuelto (stock +1)
    API-->>P: Préstamo actualizado
```

---

## 6. Flujo de morosos y notificaciones

```mermaid
flowchart LR
    A[Préstamos activos] --> B{¿Fecha límite < hoy?}
    B -- Sí --> C[Aparece en morosos<br/>con días de atraso]
    C --> D[Bibliotecario envía notificación]
    D --> E[(notificacion no leída)]
    E --> F[El socio la ve en Mi historial]
    F --> G[Marcar como leída]
    B -- No --> H[Aparece en devoluciones del día<br/>si vence hoy]
```

---

## 7. Tablero del director

```mermaid
flowchart TD
    A[GET /api/dashboard] --> B[Préstamos activos]
    A --> C[Préstamos vencidos]
    A --> D[Catálogo y stock]
    A --> E[Préstamos por género]
    B --> F[Indicadores]
    C --> F
    D --> F
    E --> G[Ranking de categorías]
    D --> H[Faltantes: 0 o 1 disponible]
    F --> I[Tablero HTML]
    G --> I
    H --> I
```
