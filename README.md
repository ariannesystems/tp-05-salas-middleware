# Trabajo práctico 05

## Descripción
Este proyecto consiste en una aplicación para un sitio web para consultar salas de estudio y realizar reservas temporales. El objetivo principal del trabajo es implementar y comprender el funcionamiento de los middleware en Express, utilizando middleware ya incorporados, middleware de terceros (Ej. Morgan) y middleware personalizado.

La aplicación permite:

Consultar las reservas existentes.
Ver el detalle de una reserva.
Acceder a un formulario para crear una nueva reserva.
Validar los datos enviados mediante POST.
Registrar cada solicitud mediante Morgan.
Generar solicitudes en forma consecutiva.
Medir cuánto tarda cada respuesta en finalizar.
Mostrar una página 404 cuando la URL solicitada no existe.

Los datos se almacenan únicamente en memoria, por lo que las nuevas reservas se pierden al reiniciar la aplicación.

## Instalación
Para instalar el proyecto es necesario tener instalado Node.js y npm.

Una vez descargado o clonado el repositorio, seleccionar la carpeta del proyecto y ejecutar: npm install

Este comando instala las dependencias definidas en package.json.

Las principales dependencias utilizadas son:

express, ejs, express-ejs-layouts, morgan (middleware de terceros utilizado para registrar las solicitudes HTTP).

El proyecto utiliza CommonJS y tiene configurado el script de inicio:

"scripts": {
  "start": "node src/index.js",
  "check": "node --check src/index.js"
}

## Ejecución
Para iniciar la aplicación se debe ejecutar: npm start

El servidor se inicia utilizando el archivo: src/index.js

Antes de iniciar la aplicación también se puede verificar la sintaxis del archivo principal mediante: npm run check

Una vez iniciado el servidor, se puede acceder a la aplicación desde el navegador utilizando la dirección local correspondiente al servidor.

## Rutas
La aplicación cuenta con las siguientes rutas principales:

Método	                Ruta	                Descripción
GET	                    /	                Página de inicio
GET	                    /estado	            Devuelve información del estado del servicio en formato JSON
GET	                    /reservas	        Muestra todas las reservas
GET	                    /reservas/nueva	    Muestra el formulario para crear una reserva
GET	                    /reservas/:id	    Muestra el detalle de una reserva
POST                    /reservas	        Valida y crea una nueva reserva

## Pipeline de middleware
El pipeline global de la aplicación sigue el siguiente orden:

Morgan
   ↓
identificarSolicitud
   ↓
medirDuracion
   ↓
expressLayouts
   ↓
express.static
   ↓
express.urlencoded
   ↓
express.json
   ↓
rutas de aplicación
   ↓
router de reservas
   ↓
página 404

El orden es importante porque cada middleware prepara información que puede ser utilizada por los siguientes.

Por ejemplo, express.urlencoded debe ejecutarse antes del procesamiento del formulario porque es el middleware que permite interpretar los datos enviados mediante un formulario HTML.

El router de reservas se monta posteriormente bajo: /reservas

y finalmente se coloca el middleware de página 404 para responder cuando ninguna ruta anterior pudo atender la solicitud.

- Diagrama del POST válido

El recorrido de una reserva válida es:

POST /reservas
      ↓
morgan("dev")
      ↓
identificarSolicitud
      ↓
medirDuracion
      ↓
expressLayouts
      ↓
express.urlencoded
      ↓
reservasRouter
      ↓
prepararAreaReservas
      ↓
validarReserva
      ↓
crearReserva
      ↓
302 /reservas
      ↓
finish: ID + estado + duración

En este caso, el middleware validarReserva comprueba los datos y, si son correctos, prepara: req.reservaValidada

Luego ejecuta: next()

para permitir que se ejecute crearReserva.

El manejador agrega la nueva reserva en memoria y finalmente realiza la redirección.


Diagrama del POST inválido

Cuando los datos enviados no son válidos, el recorrido se detiene en el middleware de validación:

POST /reservas
      ↓
morgan("dev")
      ↓
identificarSolicitud
      ↓
medirDuracion
      ↓
expressLayouts
      ↓
express.urlencoded
      ↓
reservasRouter
      ↓
prepararAreaReservas
      ↓
validarReserva
      ↓
400
      ↓
render del formulario
      ↓
fin del ciclo

En este caso no se ejecuta crearReserva, por lo que no se agrega ningún registro.

El middleware de validación conserva los valores enviados para que el usuario pueda corregirlos y muestra un mensaje de error con: role="alert"


## Alcance de cada función
-Morgan: es un middleware de terceros utilizado para registrar las solicitudes HTTP realizadas al servidor.

En este proyecto se utiliza: app.use(morgan("dev"));

Permite observar en la terminal información sobre las solicitudes y sus estados HTTP, por ejemplo 200, 302, 400 y 404.


-identificarSolicitud
Es un middleware personalizado global.
Su función es generar un identificador consecutivo para cada solicitud, por ejemplo:BIB-0001, BIB-0002, BIB-0003

El identificador se guarda en: res.locals.solicitudId

De esta manera queda disponible durante el procesamiento de la solicitud y también puede ser utilizado por las vistas.

Además, el identificador se muestra en la respuesta de: GET /estado y de forma discreta en el pie de las páginas.

-medirDuracion
Es otro middleware personalizado global.
Su función es medir cuánto tarda en finalizar una respuesta.
Primero guarda el tiempo inicial: inicio
Después registra un listener para el evento: finish

Luego permite continuar el pipeline mediante:next()

Cuando la respuesta termina, el evento finish permite calcular la duración real de la solicitud.

En la terminal se informa: ID de solicitud, Método HTTP, req.originalUrl, Código de estado, Duración en milisegundos.
La medición se realiza cuando termina la respuesta y no antes.

-prepararAreaReservas
Es el middleware asociado al router de reservas.

Su función es establecer: res.locals.seccion = "Reservas de salas";
Este valor queda disponible para las vistas pertenecientes al área de reservas.

Las vistas del listado y del formulario utilizan este dato.
La ruta /estado no depende de este middleware porque pertenece a otra parte de la aplicación.

-validarReserva
Es el middleware encargado de validar los datos enviados mediante: POST /reservas

Sus responsabilidades son: 
Aplicar trim() a los textos.
Convertir la cantidad de personas mediante Number.
Comprobar que los campos obligatorios estén completos.
Comprobar que la sala seleccionada sea una de las permitidas.
Comprobar que el turno sea válido.
Comprobar que la cantidad de personas sea un entero entre 1 y 6.
Comprobar de forma básica que el email contenga @.
Responder con 400 si existen errores.
Conservar los valores enviados cuando existe un error.
Preparar req.reservaValidada cuando los datos son correctos.
Ejecutar next() cuando la validación es exitosa.

Las salas permitidas son:

const salasPermitidas = ["Sala Norte", "Sala Sur","Sala Multimedia"]

Los turnos permitidos son:[ "Mañana", "Tarde", "Noche"]

La validación del servidor es necesaria aunque el formulario HTML también tenga validaciones.

-crearReserva
Es el manejado o handler final del POST.
Recibe los datos previamente preparados por validarReserva, crea la nueva reserva en memoria y luego redirige al listado: /reservas

## Validación
La validación se realiza en el servidor mediante el middleware:

validarReserva
Una solicitud válida continúa hacia:

validarReserva
      ↓
req.reservaValidada
      ↓
next()
      ↓
crearReserva
      ↓
302 /reservas

Una solicitud inválida termina dentro del middleware de validación:

validarReserva
      ↓
     400
      ↓
formulario con errores

Entre los casos que deben producir una respuesta 400 se encuentran:
Campos obligatorios vacíos.
Sala no permitida.
Turno no permitido.
Email sin @.
Cantidad de personas igual a 0.
Cantidad de personas igual a 7.

Cuando la validación falla, no se crea una nueva reserva.

## Pruebas manuales
Para comprobar el funcionamiento de la aplicación se realizan pruebas manuales sobre las diferentes rutas y situaciones.

Caso	        Estado esperado	                Evidencia
Inicio	                200	                Navegación y solicitud ID
Estado	                200	                JSON con cantidad e ID
Listado	                200	                Cuatro o más reservas
Estado vacío	        200	                Mensaje alternativo
Formulario	            200	                Controles etiquetados
Detalle válido	        200	                Datos completos
Detalle inexistente	    404	                Página HTML
Campos vacíos	        400	                Error y valores conservados
Sala no permitida	    400	                No se crea registro
Turno no permitido	    400	                No se crea registro
Email sin @	            400	                No se crea registro
Personas igual a 0	    400	                No se crea registro
Personas igual a 7	    400	                No se crea registro
Reserva válida	        302 y luego 200	    Nueva reserva visible
URL inexistente	        404	                Middleware final
Reinicio	            200	                Regreso a datos iniciales

Además de verificar el estado HTTP, se debe comprobar que Morgan registre las solicitudes y que el middleware medirDuracion muestre en la terminal el identificador, el método, la URL, el estado y la duración.

## Persistencia temporal
Las reservas de este proyecto se almacenan únicamente en memoria, esto significa que los datos iniciales se definen directamente en: src/index.js y las nuevas reservas se agregan al arreglo durante la ejecución de la aplicación.
No se utiliza una base de datos ni se escriben reservas en archivos. Por este motivo, las nuevas reservas existen solamente mientras el servidor está ejecutándose.
Cuando se detiene y vuelve a iniciar la aplicación, las reservas creadas durante la ejecución anterior desaparecen y vuelven a quedar disponibles únicamente las reservas iniciales definidas en el código.


--Diferencia entre middleware incorporado, de terceros y personalizado

Los middleware incorporados son funciones que Express ya proporciona para resolver tareas habituales.
Por ejemplo:  express.static(), express.urlencoded(), express.json()

Los middleware de terceros son paquetes externos que agregamos al proyecto para obtener funcionalidades adicionales.
Por ejemplo: morgan("dev")

Los middleware personalizados son funciones creadas específicamente para resolver necesidades de nuestra aplicación. 
En este proyecto son ejemplos: identificarSolicitud, medirDuracion, validarReserva, prepararAreaReservas

Por lo tanto, la principal diferencia está en su origen: algunos vienen con Express, otros se instalan desde paquetes externos y otros son desarrollados por nosotros para nuestro propio proyecto.


--Cuándo se utiliza next()

next() se utiliza cuando un middleware terminó su tarea y quiere permitir que la solicitud continúe hacia el siguiente middleware o handler.

Por ejemplo, después de validar correctamente una reserva: next(); para que se ejecute crearReserva.
Por eso, next() significa básicamente que el middleware actual terminó y que el procesamiento puede continuar.


--Por qué los parsers aparecen antes de la validación

Los parsers deben ejecutarse antes de validar porque son los encargados de interpretar los datos enviados por el cliente. En particular: express.urlencoded(), permite obtener los datos enviados mediante un formulario HTML en:req.body

Si el parser todavía no se ejecutó, el middleware de validación no tendría correctamente disponibles los datos que debe comprobar.

Por eso el orden es importante:

express.urlencoded
        ↓
validarReserva
Primero se prepara la información y después se valida.


--Diferencia entre alcance global, de router y de ruta

Un middleware global se aplica a las solicitudes que pasan por la aplicación según el lugar donde se registra,
por ejemplo: identificarSolicitud, medirDuracion, son middleware globales porque forman parte del pipeline general.

Un middleware de router se aplica solamente a las rutas pertenecientes a un router determinado.
En este caso: /reservas, utiliza un middleware que prepara: res.locals.seccion = "Reservas de salas";

Un middleware de ruta se aplica a una ruta específica como por ejemplo: reservasRouter.post("/", validarReserva, crearReserva);

Aquí validarReserva participa específicamente en el procesamiento del POST de reservas.
La diferencia principal es entonces el alcance que tiene cada middleware dentro de la aplicación.


--Motivo del evento finish

El evento finish se utiliza para saber cuándo terminó realmente la respuesta HTTP. En medirDuracion, primero se guarda el momento en que inicia el procesamiento y después se espera al evento: finish
Cuando este evento ocurre, la respuesta ya terminó de enviarse y podemos calcular cuánto tiempo transcurrió.
Esto permite obtener la duración real de la solicitud.


--Resultado del montaje del router

El router de reservas se monta mediante: app.use("/reservas", reservasRouter);

Esto significa que las rutas que están definidas dentro del router reciben automáticamente el prefijo: /reservas

Por ejemplo, dentro del router se puede definir:

reservasRouter.get("/", ...);
reservasRouter.get("/nueva", ...);
reservasRouter.get("/:id", ...);
reservasRouter.post("/", ...);

y desde afuera esas rutas quedan disponibles como:

GET /reservas
GET /reservas/nueva
GET /reservas/:id
POST /reservas

Por eso las rutas internas del router deben escribirse de forma relativa y no volver a colocar /reservas.


--Diferencia entre el POST 302 y el GET posterior

Cuando se envía correctamente una nueva reserva, el POST /reservas no muestra directamente el listado.
En cambio, el manejador responde con una redirección: 302 /reservas
El código 302 indica al navegador que debe realizar una nueva solicitud hacia esa dirección. Por lo tanto, después del POST se produce un nuevo GET /reservas para listar.
Ese GET es el que finalmente muestra el listado actualizado y responde normalmente con el codigo: 200

De esta manera se separa la acción de crear la reserva de la acción de mostrar el listado.


--Motivo por el cual las altas desaparecen al reiniciar

Las reservas nuevas se almacenan solamente en memoria, no se utiliza una base de datos y tampoco se guardan las reservas en archivos. Es por eso que mientras el servidor está funcionando, las nuevas reservas permanecen disponibles porque forman parte de los datos que mantiene la aplicación en memoria.

Cuando el proceso de Node.js se detiene, esa memoria se pierde.
Al iniciar nuevamente la aplicación, se cargan solamente las reservas iniciales definidas en src/index.js.