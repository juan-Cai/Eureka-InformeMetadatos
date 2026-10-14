// Lógica del reporte. Todo se calcula a partir de los registros de la base de datos (data/db.json):
// el % de acierto y de omisión de cada pregunta sale de la tabla de respuestas, nunca de valores guardados.
// Se usa en el navegador (global Reporte, para GitHub Pages o cualquier servidor estático) y en Node
// (server.js la carga con require), así ambos calculan exactamente lo mismo.

const Reporte = (() => {
	const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
	const r = Math.round;
	const pm = (a, k = "p") => { const v = avg(a.map(q => q[k])); return isNaN(v) ? null : r(v); };

	class ErrorHttp extends Error {
		constructor(code, msg) { super(msg); this.code = code; }
	}

	// Revisa que la base de datos tenga todas las tablas y que las referencias entre tablas existan,
	// para detectar datos mal cargados.
	const TABLAS = ["grupos", "evaluaciones", "factores", "competencias", "dbas", "sesiones", "preguntas", "estudiantes", "respuestas"];
	const ESTADOS = ["correcta", "incorrecta", "blanco"];

	function validar(db) {
		const c = db.configuracion;
		if (!c || typeof c.meta != "number" || typeof c.refuerzo != "number") throw new Error("configuracion debe tener meta y refuerzo numéricos");
		TABLAS.forEach(t => { if (!Array.isArray(db[t])) throw new Error(`falta la tabla "${t}"`); });
		const ids = t => new Set(db[t].map(x => x.id));
		const I = Object.fromEntries(TABLAS.filter(t => t != "respuestas").map(t => [t, ids(t)]));
		const ref = (t, k, dest) => db[t].forEach((x, n) => {
			if (!I[dest].has(x[k])) throw new Error(`${t}[${n}].${k} = ${JSON.stringify(x[k])} no existe en "${dest}"`);
		});
		ref("evaluaciones", "grupo", "grupos");
		ref("sesiones", "dba", "dbas");
		ref("sesiones", "factor", "factores");
		ref("preguntas", "evaluacion", "evaluaciones");
		ref("preguntas", "factor", "factores");
		ref("preguntas", "competencia", "competencias");
		ref("preguntas", "dba", "dbas");
		ref("estudiantes", "grupo", "grupos");
		ref("respuestas", "estudiante", "estudiantes");
		ref("respuestas", "pregunta", "preguntas");
		const vistas = new Set();
		db.respuestas.forEach((x, n) => {
			if (!ESTADOS.includes(x.estado)) throw new Error(`respuestas[${n}].estado debe ser ${ESTADOS.join(", ")}`);
			const k = x.estudiante + "-" + x.pregunta;
			if (vistas.has(k)) throw new Error(`respuestas[${n}] repite estudiante ${x.estudiante} y pregunta ${x.pregunta}`);
			vistas.add(k);
		});
		return db;
	}

	function evaluacion(db, id) {
		const ev = id == null ? db.evaluaciones[0] : db.evaluaciones.find(x => x.id == id);
		if (!ev) throw new ErrorHttp(404, "Evaluación no encontrada");
		return ev;
	}

	// Preguntas de la evaluación con su % de acierto (p) y de omisión (o) entre los estudiantes dados.
	// Para un solo estudiante cada pregunta vale 100 o 0, así todos los promedios se calculan igual.
	// Una respuesta que no está en la tabla cuenta como pregunta en blanco.
	function preguntas(db, ev, ids) {
		const set = new Set(ids), n = set.size;
		const rs = db.respuestas.filter(x => set.has(x.estudiante));
		return db.preguntas.filter(q => q.evaluacion == ev.id).map(q => {
			const a = rs.filter(x => x.pregunta == q.id);
			const ok = a.filter(x => x.estado == "correcta").length, mal = a.filter(x => x.estado == "incorrecta").length;
			return { id: q.id, e: q.factor, c: q.competencia, b: q.dba, p: n ? 100 * ok / n : NaN, o: n ? 100 * (n - ok - mal) / n : NaN };
		});
	}

	// Estudiantes del grupo de la evaluación con sus respuestas correctas.
	function estudiantes(db, ev) {
		const qs = new Set(db.preguntas.filter(q => q.evaluacion == ev.id).map(q => q.id));
		return db.estudiantes.filter(s => s.grupo == ev.grupo).map(s => {
			const k = db.respuestas.filter(x => x.estudiante == s.id && qs.has(x.pregunta) && x.estado == "correcta").length;
			return { id: s.id, nombre: s.nombre, correctas: k, total: qs.size, p: qs.size ? r(100 * k / qs.size) : 0 };
		});
	}

	// Plan de mejora: bloques de sesiones alternativas (el docente elige una por bloque) que cubren
	// todos los DBA y Factores a reforzar con la menor cantidad de bloques y sin repetir sesiones.
	//   1. Bloques de sesiones que comparten un DBA y un Factor a reforzar: cubren ambos a la vez. Se elige
	//      la combinación de parejas DBA–Factor que cubre más elementos (emparejamiento máximo, por fuerza
	//      bruta: son pocos DBA y Factores). Si hay empate, gana la más urgente (menor acierto sumado de sus
	//      parejas: el acierto real de las preguntas de esa pareja en la evaluación o, si no hay, el promedio
	//      del DBA y el Factor) y luego la que deja más sesiones para elegir.
	//   2. Por cada DBA aún sin cubrir, un bloque con sus sesiones libres.
	//   3. Por cada Factor aún sin cubrir, un bloque con sus sesiones libres.
	// qs: preguntas (grupo o estudiante); dbr/ebr: [{id, p}] de los DBA/Factores a reforzar.
	// Devuelve [{dba, factor, sesiones}] (dba o factor es null si el bloque cubre solo uno).
	function plan(SE, qs, dbr, ebr) {
		const pairs = [];
		dbr.forEach(d => ebr.forEach(x => {
			const ss = SE.filter(s => s.dba == d.id && s.factor == x.id);
			const o = avg(qs.filter(q => q.b == d.id && q.e == x.id).map(q => q.p));
			if (ss.length) pairs.push({ b: d.id, e: x.id, ss, p: isNaN(o) ? (d.p + x.p) / 2 : o });
		}));

		let best = [], bs = Infinity, bo = 0;
		const ub = new Set(), ue = new Set(), cur = [];
		(function go(k, sum) {
			if (k == pairs.length) {
				const op = cur.reduce((n, x) => n + x.ss.length, 0);
				if (cur.length > best.length || (cur.length == best.length && (sum < bs || (sum == bs && op > bo)))) { best = cur.slice(); bs = sum; bo = op; }
				return;
			}
			go(k + 1, sum);
			const x = pairs[k];
			if (ub.has(x.b) || ue.has(x.e)) return;
			ub.add(x.b); ue.add(x.e); cur.push(x);
			go(k + 1, sum + x.p);
			ub.delete(x.b); ue.delete(x.e); cur.pop();
		})(0, 0);

		const P = best.sort((x, y) => x.p - y.p).map(({ b, e, ss }) => ({ b, e, ss }));
		const used = new Set(P.flatMap(x => x.ss.map(s => s.id)));
		const rest = (a, k, col, mk) => a.filter(x => !P.some(y => y[k] == x.id)).forEach(x => {
			const ss = SE.filter(s => !used.has(s.id) && s[col] == x.id);
			ss.forEach(s => used.add(s.id));
			if (ss.length) P.push(mk(x.id, ss));
		});
		rest(dbr, "b", "dba", (b, ss) => ({ b, e: null, ss }));
		rest(ebr, "e", "factor", (e, ss) => ({ b: null, e, ss }));
		return P.map(x => ({ dba: x.b, factor: x.e, sesiones: x.ss.map(s => ({ id: s.id, titulo: s.titulo })) }));
	}

	// Datos fijos de la evaluación: nombres, Factores (para los filtros) y umbrales.
	function catalogo(db, evId) {
		const ev = evaluacion(db, evId);
		const g = db.grupos.find(x => x.id == ev.grupo);
		return {
			evaluacion: { id: ev.id, nombre: ev.nombre, grupo: g.nombre },
			umbrales: { meta: db.configuracion.meta, refuerzo: db.configuracion.refuerzo },
			factores: db.factores,
			competencias: db.competencias
		};
	}

	function listaEstudiantes(db, evId) {
		const al = estudiantes(db, evaluacion(db, evId));
		return { promedio: al.length ? r(avg(al.map(s => s.p))) : null, estudiantes: al };
	}

	// Reporte completo desde el punto de vista del grupo o de un estudiante (o.estudiante),
	// con el filtro de Factor (o.factor) aplicado a KPIs y gráficas. El Resumen ignora el filtro.
	function reporte(db, o) {
		const ev = evaluacion(db, o.evaluacion), REF = db.configuracion.refuerzo;
		const al = estudiantes(db, ev);
		const s = o.estudiante == null ? null : al.find(x => x.id == o.estudiante);
		if (o.estudiante != null && !s) throw new ErrorHttp(404, "Estudiante no encontrado en el grupo");
		if (o.factor != null && !db.factores.some(x => x.id == o.factor)) throw new ErrorHttp(404, "Factor no encontrado");

		const grupo = preguntas(db, ev, al.map(x => x.id));
		const qs = s ? preguntas(db, ev, [s.id]) : grupo;
		const ff = q => o.factor == null || q.e == o.factor;
		const f = qs.filter(ff), g = grupo.filter(ff);

		// Acierto por DBA, Factor o competencia; g es el valor del grupo y solo se envía para un estudiante.
		const por = (k, items) => items.map(x => {
			const a = f.filter(q => q[k] == x.id);
			return a.length ? { ...x, preguntas: a.length, p: pm(a), g: s ? pm(g.filter(q => q[k] == x.id)) : null } : null;
		}).filter(Boolean);

		// Elementos por debajo del umbral de refuerzo en toda la evaluación, del más bajo al más alto.
		const low = (k, items) => items.map(x => ({ ...x, p: pm(qs.filter(q => q[k] == x.id)) }))
			.filter(x => x.p != null && x.p < REF).sort((x, y) => x.p - y.p);
		const dbr = low("b", db.dbas), ebr = low("e", db.factores), cpr = low("c", db.competencias);

		return {
			estudiante: s,
			kpi: {
				preguntas: f.length,
				acierto: pm(f),
				omision: pm(f, "o"),
				correctas: s ? f.filter(q => q.p == 100).length : null,
				blanco: s ? f.filter(q => q.o == 100).length : null
			},
			dba: por("b", db.dbas).sort((x, y) => x.p - y.p || x.id - y.id),
			factores: por("e", db.factores),
			competencias: por("c", db.competencias),
			resumen: {
				totales: { dba: new Set(qs.map(q => q.b)).size, factores: db.factores.length, competencias: db.competencias.length },
				dba: dbr, factores: ebr, competencias: cpr,
				plan: plan(db.sesiones, qs, dbr, ebr)
			}
		};
	}

	return { validar, catalogo, listaEstudiantes, reporte, ErrorHttp };
})();

if (typeof module != "undefined") module.exports = Reporte;
