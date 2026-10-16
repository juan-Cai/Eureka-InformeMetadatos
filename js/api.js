// Acceso a los datos. La página lee la base de datos simulada del área (data/<área>.json) como archivo
// estático (funciona en GitHub Pages o en cualquier servidor) y calcula el reporte con reporte.js.

// Áreas disponibles; el área se elige con ?area=<id> en la dirección (por defecto, la primera).
const AREAS = [
	{ id: "lenguaje", nombre: "Lenguaje" },
	{ id: "sociales", nombre: "Ciencias Sociales" },
	{ id: "naturales", nombre: "Ciencias Naturales" },
	{ id: "matematicas", nombre: "Matemáticas" }
];
const AREA = AREAS.find(a => a.id == new URLSearchParams(location.search).get("area")) || AREAS[0];

let CAT = null;  // catálogo: área, etiqueta de los Factores, evaluación, umbrales, Factores y competencias
let ETQ = null;  // cómo se llaman los Factores en el área: {singular, plural, femenino}
let AL = [];     // estudiantes del grupo: {i, id, n, k (correctas), t (preguntas), p (% acierto)}
let GA = null;   // acierto promedio del grupo
let BD = null;   // base de datos ya validada

async function cargar() {
	const f = `data/${AREA.id}.json`;
	const x = await fetch(f, { cache: "no-store" });
	if (!x.ok) throw new Error(`${x.status} al leer ${f}`);
	BD = Reporte.validar(await x.json());
	CAT = Reporte.catalogo(BD);
	ETQ = CAT.etiqueta;
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
