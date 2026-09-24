const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");


//Crear una instancia de la aplicación express
const app = express();

//Defino una constante para el puerto de escucha 3000
const PORT = 3000;

const reservas = [
    {
        id: 1,
        estudiante: "Juan Pérez",
        email: "juan@gmail.com",
        sala: "Sala Norte",
        fecha: "2026-09-25",
        turno: "Mañana",
        personas: 2
    },
    {
        id: 2,
        estudiante: "María López",
        email: "maria@gmail.com",
        sala: "Sala Sur",
        fecha: "2026-09-26",
        turno: "Tarde",
        personas: 4
    },
    {
        id: 3,
        estudiante: "Carlos Gómez",
        email: "carlos@gmail.com",
        sala: "Sala Multimedia",
        fecha: "2026-09-27",
        turno: "Noche",
        personas: 3
    },
    {
        id: 4,
        estudiante: "Ana Rodríguez",
        email: "ana@gmail.com",
        sala: "Sala Norte",
        fecha: "2026-09-28",
        turno: "Mañana",
        personas: 1
    }
];

//Para ver todas la solicitudes del servidor
let numeroDeSolicitud = 0;

function identificarSolicitud(req, res, next) {
    numeroDeSolicitud += 1;
    res.locals.solicitudId = `SOL-${String(numeroDeSolicitud).padStart(4, "0")}`;
    console.log(`identificarSolicitud : [${res.locals.solicitudId}] ${req.method} ${req.originalUrl}`);
    next();
}

//Funcion principal de inicio
async function main() {
   

    //Le comunicamos a express que use el motor ejs para procesar las plantillas
    app.set("view engine", "ejs");

    //Le decimo en donde esta la carpeta de vista de los archivos ejs
    app.set("views", path.join(__dirname, "..", "views"));

    app.use(expressLayouts);

    //Lectura de la vista principal HTML
    app.set("layout", "layouts/main");

    //Lectura de la ruta de los recursos estáticos
    app.use(express.static(path.join(__dirname, "..", "public")));

    //Traduce lo que viene en la peticion en html a objeto de javascript que entiende express
    app.use(express.urlencoded({ extended: false }));

    //Renderizo el inicio    
    app.get("/", (req, res) => {
            res.render("inicio", { titulo: "Encuentra a tu compañero ideal" });
    });

    //Extraigo el catalogo de mascotas, todas
    app.get("/mascotas", (req, res) => {
        res.render("mascotas/lista", {
            titulo: "Lista de mascotas",
            mascotas,
        });
    });

    app.get("/mascotas/nueva", (req, res) => {
        res.render("mascotas/nueva", {
            titulo: "Nueva mascota",
            error: null,
            valores: {},
        });
    });

    app.get("/mascotas/:id", (req, res) => {
        const id = Number(req.params.id);
        const mascota = mascotas.find((elemento) => elemento.id === id);

        if (!mascota) {
            return res.status(404).render("no-encontrado", {
                titulo: "Mascota no encontrada",
                mensaje: "No existe una mascota con ese identificador.",
            });
        }

        res.render("mascotas/detalle", {
            titulo: mascota.nombre,
            mascota,
        });
    });

    app.post("/mascotas", (req, res) => {

        const { nombre, especie, edad, descripcion, estado, imagen } = req.body;

        const nombreLimpio = String(nombre ?? "").trim();
        const especieLimpia = String(especie ?? "").trim();
        const edadNumerica = Number(edad);
        const descripcionLimpia = String(descripcion ?? "").trim();
        const estadoLimpia = String(estado ?? "").trim();
        const rutaImagenLimpia = String(imagen ?? "").trim();

        const estadosPermitidos = ["En adopción", "Reservada", "Adoptada"];

        if (
            !nombreLimpio ||
            !especieLimpia ||
            !descripcionLimpia ||
            !estadoLimpia ||
            !rutaImagenLimpia ||
            !Number.isFinite(edadNumerica) ||
            edadNumerica <= 0 ||
            !estadosPermitidos.includes(estadoLimpia) ||
            rutaImagenLimpia !== "/img/mascota.svg"
        ) {
            return res.status(400).render("mascotas/nueva", {
                titulo: "Nueva mascota",
                error: "Completá todos los campos con valores válidos.",
                valores: req.body,
            });
        }

        //Generamos el siguiente id del json nueva propiedades
        const ultimoId = mascotas.reduce(
            (mayorId, mascota) => Math.max(mayorId, mascota.id),
            0,
        );
        mascotas.push({
            id: ultimoId + 1,
            nombre: nombreLimpio,
            especie: especieLimpia,
            edad: edadNumerica,
            descripcion: descripcionLimpia,
            estado: estadoLimpia,
            imagen: rutaImagenLimpia,
        });
        res.redirect("/mascotas");
    });

                        
    //Servidor escuchando listo para las peticiones
    app.listen(PORT, ()=>{
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}
main().catch((error) => {
    console.error("No se pudo iniciar la aplicación:", error);
    process.exitCode = 1;
});
