// Acceso a los datos. La página lee la base de datos simulada data/db.json como archivo estático
// (funciona en GitHub Pages o en cualquier servidor) y calcula el reporte con reporte.js.

let CAT = null;  // catálogo: evaluación, umbrales, Factores y competencias
let AL = [];     // estudiantes del grupo: {i, id, n, k (correctas), t (preguntas), p (% acierto)}
let GA = null;   // acierto promedio del grupo
let BD = null;   // base de datos ya validada

async function cargar() {
	const x = await fetch("data/db.json", { cache: "no-store" });
	if (!x.ok) throw new Error(`${x.status} al leer data/db.json`);
	BD = Reporte.validar(await x.json());
	CAT = Reporte.catalogo(BD);
	META = CAT.umbrales.meta;
	REF = CAT.umbrales.refuerzo;
	const e = Reporte.listaEstudiantes(BD);
	AL = e.estudiantes.map((s, i) => ({ i, id: s.id, n: s.nombre, k: s.correctas, t: s.total, p: s.p }));
	GA = e.promedio;
}

// Reporte del grupo o del estudiante AL[fa], con el filtro de Factor fe (null = todos).
async function pedirReporte(fa, fe) {
	return Reporte.reporte(BD, { estudiante: AL[fa] ? AL[fa].id : null, factor: fe });
}
