// Servidor local opcional, sin dependencias: sirve la página (que calcula el reporte en el navegador,
// igual que en GitHub Pages) y además una API JSON con los mismos cálculos (js/reporte.js) sobre data/db.json.
// Uso: node server.js  →  http://localhost:3000  (otro puerto: PORT=8080 node server.js)
//
// API (todas por GET; "evaluacion" es opcional en todas y por defecto es la primera):
//   /api/catalogo                         evaluación, umbrales, Factores y competencias
//   /api/estudiantes                      estudiantes del grupo con su acierto y el promedio del grupo
//   /api/reporte?estudiante=ID&factor=ID  KPIs, acierto por DBA/Factor/competencia, Resumen y plan

const http = require("http"), fs = require("fs"), path = require("path");
const db = require("./server/db");
const { catalogo, listaEstudiantes, reporte, ErrorHttp } = require("./js/reporte");

const PORT = +process.env.PORT || 3000;
const ROOT = __dirname;
// Solo se publican la página, sus recursos y data/db.json (la página lo lee directamente, como en GitHub Pages).
const PUBLICO = [/^\/index\.html$/, /^\/data\/db\.json$/, /^\/css\/[\w.-]+\.css$/, /^\/js\/[\w.-]+\.js$/];
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8" };

const num = (q, k) => {
	const v = q.get(k);
	if (v == null || v === "") return null;
	if (!/^\d+$/.test(v)) throw new ErrorHttp(400, `"${k}" debe ser un número entero`);
	return +v;
};

const API = {
	"/api/catalogo": q => catalogo(db.leer(), num(q, "evaluacion")),
	"/api/estudiantes": q => listaEstudiantes(db.leer(), num(q, "evaluacion")),
	"/api/reporte": q => reporte(db.leer(), { evaluacion: num(q, "evaluacion"), estudiante: num(q, "estudiante"), factor: num(q, "factor") })
};

function enviar(res, code, tipo, cuerpo) {
	res.writeHead(code, { "Content-Type": tipo, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
	res.end(cuerpo);
}

http.createServer((req, res) => {
	const u = new URL(req.url, "http://localhost");
	if (req.method != "GET") return enviar(res, 405, "text/plain; charset=utf-8", "Método no permitido");

	const fn = API[u.pathname];
	if (fn) {
		try {
			return enviar(res, 200, "application/json; charset=utf-8", JSON.stringify(fn(u.searchParams)));
		} catch (e) {
			const code = e instanceof ErrorHttp ? e.code : 500;
			if (code == 500) console.error(e);
			return enviar(res, code, "application/json; charset=utf-8", JSON.stringify({ error: code == 500 ? "Error al leer la base de datos: " + e.message : e.message }));
		}
	}

	const p = u.pathname == "/" ? "/index.html" : u.pathname;
	if (!PUBLICO.some(x => x.test(p))) return enviar(res, 404, "text/plain; charset=utf-8", "No encontrado");
	fs.readFile(path.join(ROOT, p), (err, buf) => err
		? enviar(res, 404, "text/plain; charset=utf-8", "No encontrado")
		: enviar(res, 200, TIPOS[path.extname(p)], buf));
}).listen(PORT, "127.0.0.1", () => console.log(`Reporte en http://localhost:${PORT}  (datos: ${path.relative(ROOT, db.FILE)})`));
