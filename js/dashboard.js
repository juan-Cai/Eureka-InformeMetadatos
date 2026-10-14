// Estado de filtros y renderizado de todo lo que depende de ellos. Los datos vienen ya calculados
// por reporte.js (a través de api.js); aquí solo se dibujan.

let fe = null;  // id del Factor filtrado; null = todos
let pide = 0;   // número de la última petición, para descartar respuestas que llegan tarde

function chips() {
	const F = [{ id: null, corto: "Todos" }, ...CAT.factores];
	$("fe").innerHTML = F.map(x => `<button class="chip${fe == x.id ? " on" : ""}" aria-pressed="${fe == x.id}" onclick="fe=${x.id};chips();render()">${esc(x.corto || x.nombre)}</button>`).join("");
}

// Valor con la referencia del grupo debajo cuando se está viendo a un estudiante.
const vs = (p, g) => `${p}%${fa < 0 || g == null ? "" : `<small>Grupo ${g}%</small>`}`;
// Fila de barra con línea de meta.
const bar = (n, p, g) => `<div class="row"><span>${esc(n)}</span><div class="tr"><i style="width:${p}%"></i><u style="left:${META}%"></u></div><b>${vs(p, g)}</b></div>`;

const error = m => `<p class="sub">No se pudo cargar el reporte: ${esc(m)}</p>`;

async function render() {
	const n = ++pide, s = AL[fa];
	let R;
	try {
		R = await pedirReporte(fa, fe);
	} catch (e) {
		if (n == pide) $("al").innerHTML = error(e.message);
		return;
	}
	if (n != pide) return;
	document.body.classList.toggle("stu", !!s);

	// Franja de contexto: deja claro que toda la página habla de un estudiante.
	$("ctx").hidden = !s;
	if (s) $("ctx").innerHTML = `<span class="av lg">${esc(ini(s.n))}</span><div class="who"><small>Resultados de</small><b>${esc(s.n)}</b></div>`;

	resumen(R.resumen);

	const k = R.kpi, ag = k.acierto ?? 0;
	const K = s ? [
		[ICONS.chart, "Porcentaje de respuestas correctas", ag + "%", `${k.correctas} de ${k.preguntas} correctas`, "Porcentaje de preguntas que el estudiante respondió bien."],
		[ICONS.inbox, "Preguntas sin contestar", (k.omision ?? 0) + "%", `${k.blanco} de ${k.preguntas} sin responder`, "Porcentaje de preguntas que el estudiante dejó sin responder."]
	] : [
		[ICONS.chart, "Acierto global", ag + "%", `${k.preguntas} preguntas · meta ${META}%`, "Porcentaje promedio de respuestas correctas del grupo en la evaluación."],
		[ICONS.inbox, "Omisión media", (k.omision ?? 0) + "%", "Preguntas dejadas en blanco", "Porcentaje promedio de preguntas que el grupo dejó sin responder."]
	];
	$("kpi").innerHTML = K.map((k, i) => `<div class="k"><span class="ico">${k[0]}</span><span>${k[1]}</span><b>${k[2]}</b><em>${k[3]}</em>${i ? "" : `<div class="tr km"><i style="width:${ag}%"></i><u style="left:${META}%"></u></div>`}<button class="inf" aria-label="Qué es ${k[1]}">i<span class="tip" role="tooltip">${k[4]}</span></button></div>`).join("");

	$("Factor").innerHTML = R.factores.map(x => bar(x.nombre, x.p, x.g)).join("");
	$("cmp").innerHTML = R.competencias.map(x => bar(x.nombre, x.p, x.g)).join("");

	$("dba").innerHTML = "<table><tr><th>DBA<th>Preg.<th class='hb' style='width:30%'>Acierto<th><th>Estado</tr>" + R.dba.map(x =>
		`<tr><td class="dd"><b>DBA ${x.id}</b><br><small>${esc(x.descripcion || "")}</small><td>${x.preguntas}<td class="hb"><div class="tr" style="height:10px"><i style="width:${x.p}%"></i></div><td class="vv">${vs(x.p, x.g)}<td>`
	).join("") + "</table>";
}

cargar().then(() => {
	picker();
	chips();
	render();
}).catch(e => {
	$("al").innerHTML = error(e.message + ". La página debe abrirse desde un servidor web (GitHub Pages, Live Server o «node server.js»), no con doble clic sobre el archivo.");
});
