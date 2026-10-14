// Resumen: una tarjeta por gráfica (DBA, Factor, competencias) con los elementos que necesitan
// refuerzo, más una tarjeta de Sugerencias con el plan de sesiones. Todo viene calculado por
// reporte.js (R.resumen) para el grupo o el estudiante seleccionado, sin el filtro de Factor.

function resumen(x) {
	const dbr = x.dba, ebr = x.factores, cpr = x.competencias;
	const RS = [
		["DBA a reforzar", dbr, x.totales.dba, "DBA",
			"",
			d => `<small>${esc(d.descripcion)}</small>`],
		["Factores a reforzar", ebr, x.totales.factores, "Factores",
			ebr.length ? `Conviene ${ebr.length > 1 ? "retomarlos" : "retomarlo"} en clase antes de avanzar a nuevos temas.` : "",
			() => ""],
		["Competencias a reforzar", cpr, x.totales.competencias, "competencias",
			cpr.length ? `Se recomienda ${cpr.length > 1 ? "trabajarlas" : "trabajarla"} de forma transversal en todas las unidades.` : "",
			() => ""]
	];
	const nom = d => d.nombre != null ? esc(d.nombre) : "DBA " + d.id;

	// Cada tarjeta es una fila desplegable: contador, título, texto breve y flecha.
	const card = RS.map(([t, a, n, u, acc, det]) => {
		const head = `<span class="n">${a.length}<small>de ${n}</small></span><span class="tx"><b>${t}</b><p>${a.length ? `${a.length > 1 ? "Quedan" : "Queda"} por debajo del ${REF}% de acierto. ${acc}` : `Todos los ${u} alcanzan al menos el ${REF}% de acierto.`}</p></span>`;
		return a.length
			? `<details class="a" style="--c:var(--red)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ul>${a.map(d => `<li><span><b>${nom(d)}</b>${det(d)}</span><em>${d.p}%</em></li>`).join("")}</ul></details>`
			: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;
	}).join("");

	// Sugerencias: el plan de mejora, un bloque por fila con sus sesiones alternativas.
	const P = x.plan;
	const cnt = (n, s, p) => `${n > 1 ? `los ${n}` : "el"} ${n > 1 ? p : s}`;
	const cov = [dbr.length && cnt(dbr.length, "DBA", "DBA"), ebr.length && cnt(ebr.length, "Factor", "Factores")].filter(Boolean).join(" y ");
	const head = `<span class="n">${P.length}<small>${P.length == 1 ? "sesión" : "sesiones"}</small></span><span class="tx"><b>Sugerencias</b><p>${P.length
		? `Plan de mejora: se recomienda trabajar una sesión de cada bloque para cubrir ${cov} a reforzar.`
		: "No hay DBA ni Factores por reforzar, por lo que no se requieren sesiones de refuerzo."}</p></span>`;
	const fac = id => esc((CAT.factores.find(f => f.id == id) || {}).nombre || "");
	const lbl = b => [b.dba != null && "DBA " + b.dba, b.factor != null && fac(b.factor)].filter(Boolean).join(" y ");
	const sug = P.length
		? `<details class="a sg" style="--c:var(--ok)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ol>${P.map((b, k) =>
			`<li><span class="stp">${k + 1}</span><span><b>Reforzar ${lbl(b)}</b><small>${b.sesiones.length > 1 ? "Elegir una de estas sesiones:" : "Sesión sugerida:"}</small><span class="ops">${b.sesiones.map(s => `<span class="op"><b>Sesión ${s.id}</b> · ${esc(s.titulo)}</span>`).join('<i>o</i>')}</span></span></li>`
		).join("")}</ol></details>`
		: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;

	$("al").innerHTML = card + sug;
}
