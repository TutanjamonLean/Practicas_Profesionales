# BiblioTech

Sistema de gestion de biblioteca para la Biblioteca Provincial
"Manuel Belgrano". Prototipo HTML/CSS del Hito 02 de la materia
Practicas Profesionalizantes I.

## Nombre del caso de estudio
BiblioTech

## Nombre del equipo desarrollador
Grupo7

## Integrantes
- German Zanatta
- Leandro Ferrante
- Lola Torres
- Matias Donato
- Agustin Vasto
- Thiago Gomez Rodriguez

## Descripcion del sistema
BiblioTech es la aplicacion web que automatiza la gestion de prestamos
de libros, el control de inventario y la administracion de socios de la
Biblioteca Provincial "Manuel Belgrano". Su objetivo principal es
optimizar el acceso a la cultura por parte de los vecinos, permitiendoles
consultar la disponibilidad del material bibliografico y reservar
ejemplares de manera rapida y segura. El sistema se centra en la
autogestion del socio y opera en un entorno de red local dentro de la
institucion para modernizar los procesos manuales actuales.

El sistema contempla tres roles:
- **Socio**: busca libros en el catalogo, solicita prestamos, consulta
  su historial de lecturas y revisa si tiene sanciones vigentes.
  Maximo de 3 prestamos simultaneos. Los menores de edad aparecen solo
  por su nombre de pila para proteger su privacidad.
- **Bibliotecario**: ve solicitudes pendientes y devoluciones del dia,
  aprueba entregas, registra devoluciones, da de baja ejemplares
  deteriorados y envia notificaciones a socios morosos. Atiende el
  mostrador con una interfaz de alto contraste y botones grandes,
  pensada para voluntarios mayores con vision reducida.
- **Director**: consulta un tablero de control unificado con el estado
  del catalogo, la actividad de los socios, las categorias mas leidas
  y los titulos faltantes en el inventario.

Reglas de negocio representadas en el prototipo:
- Limite de 3 prestamos simultaneos por socio (se muestra como aviso).
- Libros restringidos (colecciones unicas) solo se consultan en sala.
- Aviso destacado al socio cuando el libro buscado no tiene stock.
- Interfaz de administracion con alto contraste y botones grandes.

## Pantallas desarrolladas

### 1. Inicio (`index.html`)
Pagina principal del sitio. Presenta el sistema, explica los tres
roles disponibles y ofrece acceso rapido a cada flujo. Incluye un
acceso al formulario de inicio de sesion para las areas protegidas.

### 2. Iniciar sesion (`pages/login.html`)
Formulario HTML con campos de usuario, contrasena y tipo de usuario
(socio, bibliotecario o director). Su envio simula el inicio de
sesion y redirige a la pagina de inicio. La autenticacion real se
implementara en el Hito 03.

### 3. Catalogo (`pages/catalogo.html`)
Vista del socio para buscar libros por titulo, autor o genero.
Muestra la disponibilidad en tiempo real de cada ejemplar (cantidad
disponible, sin stock o uso solo en sala). Cada libro disponible
ofrece un boton para iniciar la reserva.

### 4. Solicitar prestamo / Reservar (`pages/reserva.html`)
Formulario HTML con `action` apuntando a la pagina de confirmacion.
Solicita titulo, autor, ejemplar, numero de socio y fecha estimada
de retiro. Incluye un aviso explicando la regla de los 3 prestamos
maximos y la restriccion de las colecciones unicas.

### 5. Confirmacion de reserva (`pages/confirmacion.html`)
Comprobante digital que se muestra tras enviar el formulario de
reserva. Contiene los datos del prestamo, la fecha limite de
devolucion calculada y enlaces de retorno al catalogo o al historial.

### 6. Mi historial (`pages/historial.html`)
Vista del socio con sus prestamos activos, libros devueltos y
sanciones vigentes. Los menores de edad aparecen solo por su nombre
de pila (sin apellido ni direccion) para cumplir la normativa de
proteccion al menor.

### 7. Panel del bibliotecario (`pages/panel-bibliotecario.html`)
Vista de atencion al mostrador. Muestra solicitudes de prestamo
pendientes de aprobacion, devoluciones del dia, socios morosos y
botones para generar el reporte de prestamos vencidos, dar de baja
un ejemplar deteriorado o registrar un nuevo ejemplar.

### 8. Tablero del director (`pages/tablero-director.html`)
Vista consolidada para la direccion de la biblioteca: indicadores
generales del dia, ranking de categorias mas leidas y listado de
titulos faltantes en el inventario.

## Estructura del proyecto

```
Practicas_Profesionales/
|-- index.html              (pagina principal)
|-- styles.css              (hoja de estilos base)
|-- README.md
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

## Tecnologias utilizadas
- HTML5 semantico: `<header>`, `<nav>`, `<main>`, `<footer>`,
  `<section>`, `<article>`, `<aside>`, encabezados jerarquicos.
- CSS basico externo en `styles.css`: tipografias, colores, margenes,
  padding, clases, selectores simples y Flexbox para navbars y layouts.
- Formularios HTML con atributo `action` para simular la confirmacion
  de reserva y el inicio de sesion.

Momo

