// Estado de filtros y renderizado de todo lo que depende de ellos.

let fe = -1;

// Preguntas de toda la evaluación vistas desde el grupo o desde el estudiante seleccionado (fa, picker.js).
// Para un estudiante cada pregunta vale 100 o 0 según su respuesta, así todos los promedios siguen igual.
const QS = () => fa < 0 ? Q : Q.map(q => {
	const c = AL[fa].s[q.id - 1];
	return { ...q, p: c == "1" ? 100 : 0, o: c == "-" ? 100 : 0 };
});
// Lo que se dibuja en KPIs y gráficas además respeta el filtro de Factor.
const F = () => QS().filter(q => fe < 0 || q.e == fe);
const FG = () => Q.filter(q => fe < 0 || q.e == fe);

function chips() {
	$("fe").innerHTML = ["Todos", ...S].map((t, i) => `<button class="chip${fe == i - 1 ? " on" : ""}" aria-pressed="${fe == i - 1}" onclick="fe=${i - 1};chips();render()">${t}</button>`).join("");
}

// Valor con la referencia del grupo debajo cuando se está viendo a un estudiante.
const vs = (p, g) => `${p}%${fa < 0 || isNaN(g) ? "" : `<small>Grupo ${g}%</small>`}`;
// Fila de barra con línea de meta.
const bar = (n, p, g) => `<div class="row"><span>${n}</span><div class="tr"><i style="width:${p}%"></i><u style="left:${META}%"></u></div><b>${vs(p, g)}</b></div>`;
// Etiqueta "Reforzar"; no se muestra nada si el acierto alcanza el umbral.
const tag = p => est(p) ? "" : ``;
const pm = (a, k = "p") => r(avg(a.map(q => q[k])));

function render() {
	const f = F(), g = FG(), s = AL[fa];
	document.body.classList.toggle("stu", !!s);

	// Franja de contexto: deja claro que toda la página habla de un estudiante.
	$("ctx").hidden = !s;
	if (s) $("ctx").innerHTML = `<span class="av lg">${ini(s.n)}</span><div class="who"><small>Resultados de</small><b>${esc(s.n)}</b></div>`
		;

	resumen(QS());

	const B = [...new Set(f.map(q => q.b))].map(b => {
		const a = f.filter(q => q.b == b);
		return { b, a, p: pm(a), g: pm(g.filter(q => q.b == b)) };
	}).sort((x, y) => x.p - y.p || x.b - y.b);

	const ag = pm(f), ok = f.filter(q => q.p == 100).length, om = f.filter(q => q.o == 100).length;
	const K = s ? [
		[ICONS.chart, "Porcentaje de respuestas correctas", ag + "%", `${ok} de ${f.length} correctas`, "Porcentaje de preguntas que el estudiante respondió bien."],
		[ICONS.inbox, "Preguntas sin contestar", pm(f, "o") + "%", `${om} de ${f.length} sin responder`, "Porcentaje de preguntas que el estudiante dejó sin responder."]
	] : [
		[ICONS.chart, "Acierto global", ag + "%", `${f.length} preguntas · meta ${META}%`, "Porcentaje promedio de respuestas correctas del grupo en la evaluación."],
		[ICONS.inbox, "Omisión media", pm(f, "o") + "%", "Preguntas dejadas en blanco", "Porcentaje promedio de preguntas que el grupo dejó sin responder."]
	];
	$("kpi").innerHTML = K.map((k, i) => `<div class="k"><span class="ico">${k[0]}</span><span>${k[1]}</span><b>${k[2]}</b><em>${k[3]}</em>${i ? "" : `<div class="tr km"><i style="width:${ag}%"></i><u style="left:${META}%"></u></div>`}<button class="inf" aria-label="Qué es ${k[1]}">i<span class="tip" role="tooltip">${k[4]}</span></button></div>`).join("");

	$("Factor").innerHTML = E.map((n, i) => {
		const p = pm(f.filter(q => q.e == i));
		return isNaN(p) ? "" : bar(n, p, pm(g.filter(q => q.e == i)));
	}).join("");

	$("cmp").innerHTML = C.map((n, j) => {
		const p = pm(f.filter(q => q.c == j));
		return isNaN(p) ? "" : bar(n, p, pm(g.filter(q => q.c == j)));
	}).join("");

	$("dba").innerHTML = "<table><tr><th>DBA<th>Preg.<th class='hb' style='width:30%'>Acierto<th><th>Estado</tr>" + B.map(({ b, a, p, g }) =>
		`<tr><td class="dd"><b>DBA ${b}</b><br><small>${DB[b] || ""}</small><td>${a.length}<td class="hb"><div class="tr" style="height:10px"><i style="width:${p}%"></i></div><td class="vv">${vs(p, g)}<td>${tag(p)}`
	).join("") + "</table>";
}

picker();
chips();
render();
