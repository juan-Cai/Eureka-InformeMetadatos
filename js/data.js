// Datos simulados de una evaluación de 20 preguntas aplicada a un grupo de
// 30 estudiantes. Cada pregunta está asociada a un EBC, una competencia y un DBA.

const E = ["Producción textual", "Comprensión e interpretación textual", "Literatura", "Medios y sistemas simbólicos"];
const S = ["Producción", "Comprensión", "Literatura", "Medios"];
const C = ["Interpretativa", "Argumentativa", "Propositiva"];

// Descripción corta de cada DBA evaluado (id → texto).
const DB = {
	1: "Comprende el sentido global de los textos a partir de la información explícita e implícita.",
	2: "Identifica la intención comunicativa de los textos a partir de su contenido y estructura.",
	3: "Produce textos escritos siguiendo un proceso de planeación, escritura y revisión.",
	4: "Reconoce elementos de las obras literarias como tiempo, espacio y función de los personajes.",
	5: "Interpreta la información de los medios de comunicación y de los sistemas no verbales."
};

// Sesiones de la secuencia didáctica: [título, DBA, EBC]. Cada sesión trabaja un DBA dentro de un EBC;
// varias sesiones pueden compartir DBA, EBC o ambos. El número de sesión es su posición en la lista.
const SE = [
	["Ideas explícitas e implícitas en textos informativos", 1, 1],
	["Inferir información en noticias y reportajes", 1, 1],
	["Leer infografías y textos discontinuos", 1, 3],
	["El propósito del autor: informar, persuadir o entretener", 2, 1],
	["La intención comunicativa en fábulas y leyendas", 2, 2],
	["Intención y estructura de los mitos", 2, 2],
	["Escribir una carta según su propósito", 2, 0],
	["Planear un texto narrativo", 3, 0],
	["Escribir el borrador de un texto narrativo", 3, 0],
	["Revisar y corregir textos entre pares", 3, 0],
	["Escribir un poema a partir de un modelo", 3, 2],
	["Personajes, tiempo y espacio en el cuento", 4, 2],
	["El narrador y los personajes en la novela corta", 4, 2],
	["Escribir un cuento a partir de sus elementos", 4, 0],
	["Publicidad y mensajes en los medios", 5, 3],
	["Señales, símbolos e íconos en el entorno", 5, 3]
].map(([t, b, e], i) => ({ id: i + 1, t, b, e }));

// Cada fila: [EBC, competencia, DBA, dificultad prevista, % acierto, discriminación, % errores en el distractor dominante, % omisión]
const Q = [
	[1, 0, 1, 0, 87, .23, 75, 0], [1, 1, 1, 0, 73, .29, 63, 0], [3, 0, 5, 0, 90, .17, 67, 0], [2, 0, 4, 0, 83, .59, 60, 0],
	[1, 1, 2, 1, 47, .57, 71, 7], [0, 0, 3, 0, 73, .55, 75, 0], [3, 2, 5, 1, 67, .49, 56, 3], [2, 1, 4, 1, 70, .10, 56, 0],
	[1, 2, 2, 1, 50, .61, 58, 10], [0, 1, 3, 1, 57, .67, 73, 7], [3, 1, 5, 0, 77, .47, 50, 3], [2, 0, 2, 1, 63, .56, 50, 10],
	[0, 0, 3, 1, 40, .62, 59, 3], [1, 0, 1, 2, 43, .64, 50, 17], [3, 1, 5, 2, 53, .63, 50, 7], [2, 2, 4, 2, 17, .43, 71, 3],
	[0, 2, 3, 2, 10, .31, 54, 10], [0, 2, 4, 0, 67, .56, 60, 0], [3, 0, 1, 1, 67, .24, 67, 3], [2, 1, 2, 2, 43, .59, 60, 7]
].map((q, i) => ({
	id: i + 1, e: q[0], c: q[1], b: q[2], d: q[3], p: q[4], r: q[5], x: q[6], o: q[7],
	ob: q[4] >= 70 ? 0 : q[4] >= 45 ? 1 : 2
}));

// [nombre del grupo, total de estudiantes, [conteo Bajo, Básico, Alto, Superior]]
const G = ["Grupo 5A", 30, [12, 12, 4, 2]];

// Estudiantes: [nombre, respuestas]. Las respuestas traen un carácter por pregunta, en el orden de Q:
// 1 = correcta, 0 = incorrecta, - = en blanco. Los % de Q y los conteos de G salen de esta matriz.
const AL = [
	["Valentina Ríos", "111101110-1111000100"], ["Santiago Gómez", "11100111111-00000010"], ["Isabella Martínez", "10111111111111110111"],
	["Samuel Rodríguez", "1111-110011101001110"], ["Mariana López", "11010101101111000001"], ["Matías Hernández", "11111111111111100101"],
	["Sofía Ramírez", "1111110011100-100100"], ["Emiliano Torres", "11111111111111111111"], ["Luciana Castro", "11111110111110100111"],
	["Juan José Vargas", "00000000000100000000"], ["Gabriela Moreno", "111101-11100011-0111"], ["Tomás Jiménez", "1111101010111011010-"],
	["Salomé Rojas", "11110111011-00000110"], ["Nicolás Herrera", "0111111001111101-111"], ["Antonella Díaz", "1111100100011-10-111"],
	["Jerónimo Muñoz", "1011-111111111100111"], ["María José Pérez", "111101010-110-100010"], ["Sebastián Ortiz", "1011000000000000-010"],
	["Daniela Suárez", "1111110110110100111-"], ["Martín Restrepo", "001111101111-1100111"], ["Valeria Cárdenas", "11111010-1111-1101-0"],
	["Alejandro Ospina", "11011111111111100111"], ["Sara Mejía", "11101011-0-000000011"], ["David Giraldo", "11111111-11100100010"],
	["Camila Quintero", "11110111110000100110"], ["Miguel Ángel Rincón", "10110111111101100001"], ["Laura Sofía Peña", "1110011100100--00000"],
	["Emmanuel Arango", "11110001000000000110"], ["Juliana Correa", "00110111001-00-00010"], ["Thiago Salazar", "10100001001000000100"]
].map(([n, s], i) => ({ i, n, s, k: s.split("1").length - 1, p: r(100 * (s.split("1").length - 1) / s.length) }));
