// Ayudantes de uso general compartidos por el resto de los módulos.
const $ = i => document.getElementById(i);
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
const r = Math.round;
// Escapa texto de la base de datos antes de insertarlo con innerHTML.
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Estado de un Factor/DBA/competencia según su % de acierto: 0 = necesita refuerzo (menos de REF), 1 = por debajo de la meta, 2 = alcanza la meta.
// Solo el estado 0 se muestra en pantalla. Los umbrales se reemplazan con los de la base de datos al cargar (api.js).
let META = 70, REF = 60;
const est = p => p < REF ? 0 : p < META ? 1 : 2;

// Íconos de línea, en línea, para las insignias de los KPI.
const ICONS = {
	chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V12"/><path d="M12 20V6"/><path d="M20 20v-7"/></svg>',
	users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/></svg>',
	inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h4l2 3h4l2-3h4"/><path d="M5.5 5h13L20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z"/></svg>'
};
