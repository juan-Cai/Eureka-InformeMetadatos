// Estado de filtros y renderizado de todo lo que depende de ellos. Los datos vienen ya calculados
// por reporte.js (a través de api.js); aquí solo se dibujan.

let fe = null;  // id del Factor filtrado; null = todos
let pide = 0;   // número de la última petición, para descartar respuestas que llegan tarde

// Pestañas de área: cada una abre la misma página con los datos de otra área (?area=<id>).
function areas() {
	$("ar").innerHTML = AREAS.map(a => `<a href="?area=${a.id}"${a == AREA ? ' class="on" aria-current="page"' : ""}>${esc(a.nombre)}</a>`).join("");
}

// Textos fijos que dependen de cómo se llaman los Factores en el área (Factor, Relación, Entorno, Pensamiento).
function etiquetas() {
	document.title = `Órbita · Reporte pedagógico Aula Máxima ${CAT.area || AREA.nombre}`;
	$("fel").textContent = ETQ.singular;
	$("feh").textContent = "Porcentaje de respuestas correctas por " + ETQ.singular;
	$("fei").setAttribute("aria-label", "Qué es Porcentaje de respuestas correctas por " + ETQ.singular);
	$("alt").textContent = `DBA, ${ETQ.plural} y competencias con menos del ${REF}% de respuestas correctas en toda la evaluación, para el grupo o para el estudiante seleccionado, y un plan de sesiones sugeridas para reforzarlos. Cada fila se despliega para ver el detalle.`;
}

function chips() {
	const F = [{ id: null, corto: ETQ.femenino ? "Todas" : "Todos" }, ...CAT.factores];
	$("fe").innerHTML = F.map(x => `<button class="chip${fe == x.id ? " on" : ""}" aria-pressed="${fe == x.id}" onclick="fe=${x.id};chips();render()">${esc(x.corto || x.nombre)}</button>`).join("");
}

// Valor con la referencia del grupo debajo cuando se está viendo a un estudiante.
const vs = (p, g) => `${p}%${fa < 0 || g == null ? "" : `<small>Grupo ${g}%</small>`}`;
// Fila de barra.
const bar = (n, p, g) => `<div class="row"><span>${esc(n)}</span><div class="tr"><i style="width:${p}%"></i></div><b>${vs(p, g)}</b></div>`;

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
		[ICONS.chart, "Porcentaje de respuestas correctas", ag + "%", `${k.correctas} de ${k.preguntas} correctas`],
		[ICONS.inbox, "Preguntas sin contestar", (k.omision ?? 0) + "%", `${k.blanco} de ${k.preguntas} sin responder`]
	] : [
		[ICONS.chart, "Porcentaje de respuestas correctas", ag + "%", `${k.preguntas} preguntas`],
		[ICONS.inbox, "Omisión media", (k.omision ?? 0) + "%", "Preguntas dejadas en blanco"]
	];
	$("kpi").innerHTML = K.map((k, i) => `<div class="k"><span class="ico">${k[0]}</span><span>${k[1]}</span><b>${k[2]}</b><em>${k[3]}</em>${i ? "" : `<div class="tr km"><i style="width:${ag}%"></i></div>`}</div>`).join("");

	$("Factor").innerHTML = R.factores.map(x => bar(x.nombre, x.p, x.g)).join("");
	$("cmp").innerHTML = R.competencias.map(x => bar(x.nombre, x.p, x.g)).join("");

	$("dba").innerHTML = "<table><tr><th>DBA<th>Preg.<th class='hb' style='width:30%'>% de respuestas correctas<th></tr>" + R.dba.map(x =>
		`<tr><td class="dd"><b>DBA ${x.id}</b><br><small>${esc(x.descripcion || "")}</small><td>${x.preguntas}<td class="hb"><div class="tr" style="height:10px"><i style="width:${x.p}%"></i></div><td class="vv">${vs(x.p, x.g)}`
	).join("") + "</table>";
}

areas();
cargar().then(() => {
	etiquetas();
	picker();
	chips();
	render();
}).catch(e => {
	$("al").innerHTML = error(e.message + ". La página debe abrirse desde un servidor web (GitHub Pages, Live Server o «node server.js»), no con doble clic sobre el archivo.");
});
