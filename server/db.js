// Bases de datos simuladas: data/<área>.json es un diccionario con una "tabla" (lista de registros) por clave.
// Cada archivo se vuelve a leer cuando cambia, así cualquier edición se ve al recargar la página.
// Al leerlo se revisa que las referencias entre tablas existan, para detectar datos mal cargados.

const fs = require("fs"), path = require("path");
const { validar, ErrorHttp } = require("../js/reporte");

const DIR = path.join(__dirname, "..", "data");
const AREAS = ["lenguaje", "sociales", "naturales", "matematicas"];  // la primera es la de por defecto

const cache = {};

function leer(area) {
	const a = area == null ? AREAS[0] : area;
	if (!AREAS.includes(a)) throw new ErrorHttp(404, `Área no encontrada (opciones: ${AREAS.join(", ")})`);
	const file = path.join(DIR, a + ".json"), m = fs.statSync(file).mtimeMs;
	if (!cache[a] || cache[a].mtime != m) cache[a] = { db: validar(JSON.parse(fs.readFileSync(file, "utf8"))), mtime: m };
	return cache[a].db;
}

module.exports = { leer, AREAS, DIR };
