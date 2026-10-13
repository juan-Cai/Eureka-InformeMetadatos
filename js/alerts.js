// Resumen: una tarjeta por gráfica (DBA, Factor, competencias) con los elementos que necesitan
// refuerzo, es decir, los que quedan por debajo de REF (utils.js), más una tarjeta de Sugerencias
// con un plan de sesiones. Recibe las preguntas de toda la evaluación ya ajustadas al grupo o al
// estudiante seleccionado; no depende del filtro de Factor.

// Plan de mejora: bloques de sesiones alternativas (el docente elige una por bloque) que cubren
// todos los DBA y Factor a reforzar con la menor cantidad de bloques y sin repetir sesiones.
//   1. Bloques de sesiones que comparten un DBA y un Factor a reforzar: cubren ambos a la vez. Se elige
//      la combinación de parejas DBA–Factor que cubre más elementos (emparejamiento máximo, por fuerza
//      bruta: son pocos DBA y Factor). Si hay empate, gana la más urgente (menor acierto sumado de sus
//      parejas: el acierto real de las preguntas de esa pareja en la evaluación o, si no hay, el promedio
//      del DBA y el Factor) y luego la que deja más sesiones para elegir.
//   2. Por cada DBA aún sin cubrir, un bloque con sus sesiones libres.
//   3. Por cada Factor aún sin cubrir, un bloque con sus sesiones libres.
// qs: preguntas (grupo o estudiante); dbr/ebr: [{i, p}] de los DBA/Factor a reforzar.
// Devuelve [{b, e, ss}] (b o e es null si el bloque cubre solo uno).
function plan(qs, dbr, ebr) {
	const pairs = [];
	dbr.forEach(d => ebr.forEach(x => {
		const ss = SE.filter(s => s.b == d.i && s.e == x.i);
		const o = avg(qs.filter(q => q.b == d.i && q.e == x.i).map(q => q.p));
		if (ss.length) pairs.push({ b: d.i, e: x.i, ss, p: isNaN(o) ? (d.p + x.p) / 2 : o });
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
	const rest = (a, k, mk) => a.filter(x => !P.some(y => y[k] == x.i)).forEach(x => {
		const ss = SE.filter(s => !used.has(s.id) && s[k] == x.i);
		ss.forEach(s => used.add(s.id));
		if (ss.length) P.push(mk(x.i, ss));
	});
	rest(dbr, "b", (b, ss) => ({ b, e: null, ss }));
	rest(ebr, "e", (e, ss) => ({ b: null, e, ss }));
	return P;
}

function resumen(qs) {
	const pc = (k, n) => [...new Set(qs.map(q => q[k]))].sort((x, y) => x - y)
		.map(i => ({ i, n: n(i), p: r(avg(qs.filter(q => q[k] == i).map(q => q.p))) }));
	const low = a => a.filter(x => est(x.p) == 0).sort((x, y) => x.p - y.p);

	const dbr = low(pc("b", b => "DBA " + b));
	const ebr = low(pc("e", i => E[i]));
	const cpr = low(pc("c", j => C[j]));

	const RS = [
		["DBA a reforzar", dbr, new Set(qs.map(q => q.b)).size, "DBA",
			dbr.length ? `` : "",
			x => `<small>${DB[x.i] || ""}</small>`],
		["Factores a reforzar", ebr, E.length, "Factor",
			ebr.length ? `Conviene ${ebr.length > 1 ? "retomarlos" : "retomarlo"} en clase antes de avanzar a nuevos temas.` : "",
			() => ""],
		["Competencias a reforzar", cpr, C.length, "competencias",
			cpr.length ? `Se recomienda ${cpr.length > 1 ? "trabajarlas" : "trabajarla"} de forma transversal en todas las unidades.` : "",
			() => ""]
	];

	// Cada tarjeta es una fila desplegable: contador, título, texto breve y flecha.
	const card = RS.map(([t, a, n, u, acc, det]) => {
		const head = `<span class="n">${a.length}<small>de ${n}</small></span><span class="tx"><b>${t}</b><p>${a.length ? `${a.length > 1 ? "Quedan" : "Queda"} por debajo del ${REF}% de acierto. ${acc}` : `Todos los ${u} alcanzan al menos el ${REF}% de acierto.`}</p></span>`;
		return a.length
			? `<details class="a" style="--c:var(--red)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ul>${a.map(x => `<li><span><b>${x.n}</b>${det(x)}</span><em>${x.p}%</em></li>`).join("")}</ul></details>`
			: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;
	}).join("");

	// Sugerencias: el plan de mejora, un bloque por fila con sus sesiones alternativas.
	const P = plan(qs, dbr, ebr);
	const cnt = (n, s, p) => `${n > 1 ? `los ${n}` : "el"} ${n > 1 ? p : s}`;
	const cov = [dbr.length && cnt(dbr.length, "DBA", "DBA"), ebr.length && cnt(ebr.length, "estándar", "Factores")].filter(Boolean).join(" y ");
	const head = `<span class="n">${P.length}<small>${P.length == 1 ? "sesión" : "sesiones"}</small></span><span class="tx"><b>Sugerencias</b><p>${P.length
		? `Plan de mejora: se recomienda trabajar una sesión de cada bloque para cubrir ${cov} a reforzar.`
		: "No hay DBA ni Factores por reforzar, por lo que no se requieren sesiones de refuerzo."}</p></span>`;
	const lbl = x => [x.b != null && "DBA " + x.b, x.e != null && E[x.e]].filter(Boolean).join(" y ");
	const sug = P.length
		? `<details class="a sg" style="--c:var(--ok)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ol>${P.map(x =>
			`<li><span class="stp">${P.indexOf(x) + 1}</span><span><b>Reforzar ${lbl(x)}</b><small>${x.ss.length > 1 ? "Elegir una de estas sesiones:" : "Sesión sugerida:"}</small><span class="ops">${x.ss.map(s => `<span class="op"><b>Sesión ${s.id}</b> · ${s.t}</span>`).join('<i>o</i>')}</span></span></li>`
		).join("")}</ol></details>`
		: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;

	$("al").innerHTML = card + sug;
}
