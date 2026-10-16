// Resumen: una tarjeta por gráfica (DBA, Factor, competencias) con los elementos que necesitan
// refuerzo, más una tarjeta de Plan de mejora con las sesiones sugeridas. Todo viene calculado por
// reporte.js (R.resumen) para el grupo o el estudiante seleccionado, sin el filtro de Factor.

function resumen(x) {
	const RS = [
		["DBA a reforzar", x.dba, x.totales.dba, d => `<small>${esc(d.descripcion)}</small>`],
		[ETQ.plural + " a reforzar", x.factores, x.totales.factores, () => ""],
		["Competencias a reforzar", x.competencias, x.totales.competencias, () => ""]
	];
	const nom = d => d.nombre != null ? esc(d.nombre) : "DBA " + d.id;

	// Cada tarjeta es una fila desplegable: contador, título y flecha.
	const card = RS.map(([t, a, n, det]) => {
		const head = `<span class="n">${a.length}<small>de ${n}</small></span><span class="tx"><b>${t}</b></span>`;
		return a.length
			? `<details class="a" style="--c:var(--red)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ul>${a.map(d => `<li><span><b>${nom(d)}</b>${det(d)}</span><em>${d.p}%</em></li>`).join("")}</ul></details>`
			: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;
	}).join("");

	// Plan de mejora: un bloque por fila con sus sesiones alternativas.
	const P = x.plan;
	const head = `<span class="n">${P.length}<small>${P.length == 1 ? "acción" : "acciones"}</small></span><span class="tx"><b>Plan de mejora</b></span>`;
	const fac = id => esc((CAT.factores.find(f => f.id == id) || {}).nombre || "");
	const lbl = b => [b.dba != null && "DBA " + b.dba, b.factor != null && fac(b.factor)].filter(Boolean).join(" y ");
	const sug = P.length
		? `<details class="a sg" style="--c:var(--ok)"><summary>${head}<i class="chev" aria-hidden="true"></i></summary><ol>${P.map((b, k) =>
			`<li><span class="stp">${k + 1}</span><span><b>Reforzar ${lbl(b)}</b><small>${b.sesiones.length > 1 ? "Elegir uno de estos contenidos:" : "Contenido sugerido:"}</small><span class="ops">${b.sesiones.map(s => `<span class="op"><b>Sesión ${s.id}</b> · ${esc(s.titulo)}</span>`).join('<i>o</i>')}</span></span></li>`
		).join("")}</ol></details>`
		: `<div class="a" style="--c:var(--ok)"><div class="sm">${head}</div></div>`;

	$("al").innerHTML = card + sug;
}
