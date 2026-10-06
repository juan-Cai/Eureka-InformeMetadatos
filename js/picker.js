// Selector de estudiante: combobox con búsqueda (sin distinguir tildes), orden por nombre o por
// menor acierto, navegación con teclado y botones anterior/siguiente. Cambia `fa` y llama render().

let fa = -1;          // índice del estudiante en AL; -1 = todo el grupo
let po = "az";        // orden de la lista: "az" (nombre) o "low" (menor acierto primero)
let pq = "", pa = 0;  // texto de búsqueda y opción activa

const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ini = n => { const w = n.split(" "); return w[0][0] + w[w.length - 1][0]; };
const esc = s => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const order = () => [...AL].sort((a, b) => (po == "low" ? a.p - b.p : 0) || a.n.localeCompare(b.n, "es"));
const GA = r(avg(AL.map(s => s.p)));

// Opciones visibles; null representa "Todo el grupo" y solo aparece cuando no hay búsqueda.
function opts() {
	const q = norm(pq.trim());
	const l = order().filter(s => !q || norm(s.n).includes(q));
	return q ? l : [null, ...l];
}

// Resalta la parte del nombre que coincide con la búsqueda.
function hl(n) {
	const q = norm(pq.trim()), k = q ? norm(n).indexOf(q) : -1;
	return k < 0 ? esc(n) : esc(n.slice(0, k)) + "<mark>" + esc(n.slice(k, k + q.length)) + "</mark>" + esc(n.slice(k + q.length));
}

const isOpen = () => !$("pp").hidden;

function plist() {
	const o = opts();
	pa = Math.max(0, Math.min(pa, o.length - 1));
	$("pl").innerHTML = o.length ? o.map((s, k) => {
		const i = s ? s.i : -1;
		const body = s
			? `<span class="av">${ini(s.n)}</span><span class="nm">${hl(s.n)}<small>${s.k} de ${s.s.length} correctas</small></span><span class="pc${est(s.p) ? "" : " rf"}" title="${est(s.p) ? "" : "Necesita refuerzo"}"><s></s>${s.p}%</span>`
			: `<span class="av all">${ICONS.users}</span><span class="nm">Todo el grupo<small>${AL.length} estudiantes</small></span><span class="pc">${GA}%</span>`;
		return `<li role="option" id="po${k}" data-i="${i}" aria-selected="${i == fa}" class="${k == pa ? "act" : ""}">${body}</li>`;
	}).join("") : `<li class="empty">Ningún estudiante coincide con “${esc(pq.trim())}”.</li>`;
	$("pi").setAttribute("aria-activedescendant", o.length ? "po" + pa : "");
	const a = $("pl").querySelector(".act");
	if (a) a.scrollIntoView({ block: "nearest" });
	document.querySelectorAll("#pp [data-o]").forEach(b => b.classList.toggle("on", b.dataset.o == po));
}

function popen() {
	if (isOpen()) return;
	$("pp").hidden = false;
	$("pi").setAttribute("aria-expanded", "true");
	const o = opts();
	pa = Math.max(0, o.findIndex(s => (s ? s.i : -1) == fa));
	plist();
}

function pclose() {
	$("pp").hidden = true;
	$("pi").setAttribute("aria-expanded", "false");
	pq = "";
	psync();
}

function pick(i) {
	fa = i;
	pclose();
	render();
}

// Refleja la selección en el campo, el botón de limpiar y las flechas.
function psync() {
	const s = AL[fa];
	$("pi").value = s ? s.n : "";
	$("pk").classList.toggle("sel", !!s);
	$("pav").innerHTML = s ? ini(s.n) : ICONS.users;
	$("px").hidden = !s;
	const l = order(), k = l.findIndex(x => x.i == fa);
	$("pv").disabled = k <= 0;
	$("pn").disabled = k == l.length - 1;
}

function step(d) {
	const l = order(), k = l.findIndex(x => x.i == fa);
	const n = l[k < 0 ? 0 : k + d];
	if (n) pick(n.i);
}

function picker() {
	const pi = $("pi");
	pi.addEventListener("focus", () => { pi.select(); popen(); });
	pi.addEventListener("click", popen);
	pi.addEventListener("input", () => { pq = pi.value; pa = 0; popen(); plist(); });
	pi.addEventListener("blur", () => setTimeout(() => { if (document.activeElement != pi) pclose(); }, 0));
	pi.addEventListener("keydown", e => {
		const o = opts();
		if (e.key == "ArrowDown" || e.key == "ArrowUp") {
			e.preventDefault();
			if (!isOpen()) return popen();
			pa = (pa + (e.key == "ArrowDown" ? 1 : -1) + o.length) % Math.max(o.length, 1);
			plist();
		} else if (e.key == "Home" && isOpen()) { e.preventDefault(); pa = 0; plist(); }
		else if (e.key == "End" && isOpen()) { e.preventDefault(); pa = o.length - 1; plist(); }
		else if (e.key == "Enter" && isOpen() && o.length) { e.preventDefault(); pick(o[pa] ? o[pa].i : -1); }
		else if (e.key == "Escape" && isOpen()) { e.preventDefault(); pclose(); pi.select(); }
	});

	// mousedown sin foco: el campo no pierde el foco al hacer clic dentro del panel.
	$("pp").addEventListener("mousedown", e => e.preventDefault());
	$("pl").addEventListener("click", e => {
		const li = e.target.closest("li[data-i]");
		if (li) pick(+li.dataset.i);
	});
	$("pl").addEventListener("mousemove", e => {
		const li = e.target.closest("li[data-i]");
		if (!li) return;
		const k = +li.id.slice(2);
		if (k == pa) return;
		const a = $("pl").querySelector(".act");
		if (a) a.classList.remove("act");
		li.classList.add("act");
		pa = k;
		pi.setAttribute("aria-activedescendant", li.id);
	});
	document.querySelectorAll("#pp [data-o]").forEach(b => b.addEventListener("click", () => { po = b.dataset.o; pa = 0; plist(); psync(); }));

	$("px").addEventListener("click", () => pick(-1));
	$("pv").addEventListener("click", () => step(-1));
	$("pn").addEventListener("click", () => step(1));
	psync();
}
