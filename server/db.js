// Base de datos simulada: data/db.json es un diccionario con una "tabla" (lista de registros) por clave.
// Se vuelve a leer cuando el archivo cambia, así cualquier edición se ve al recargar la página.
// Al leerla se revisa que las referencias entre tablas existan, para detectar datos mal cargados.

const fs = require("fs"), path = require("path");
const { validar } = require("../js/reporte");

const FILE = path.join(__dirname, "..", "data", "db.json");

let cache = null, mtime = 0;

function leer() {
	const m = fs.statSync(FILE).mtimeMs;
	if (!cache || m != mtime) {
		cache = validar(JSON.parse(fs.readFileSync(FILE, "utf8")));
		mtime = m;
	}
	return cache;
}

module.exports = { leer, FILE };
