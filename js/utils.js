const COLORES_TIPO = {
  normal: "#A8A878", fire: "#F08030", water: "#6890F0", grass: "#78C850",
  electric: "#F8D030", ice: "#98D8D8", fighting: "#C03028", poison: "#A040A0",
  ground: "#E0C068", flying: "#A890F0", psychic: "#F85888", bug: "#A8B820",
  rock: "#B8A038", ghost: "#705898", dragon: "#7038F8", dark: "#705848",
  steel: "#B8B8D0", fairy: "#EE99AC",
};

function claseTipo(tipoEs, tipoEn) {
  if (tipoEn) return "type-" + tipoEn;
  const rev = {};
  Object.keys(TIPOS_ES).forEach(function (k) { rev[TIPOS_ES[k]] = k; });
  return "type-" + (rev[tipoEs] || tipoEs.toLowerCase());
}

function badgeTipo(tipo, ingles) {
  const clase = ingles || revTipo( tipo );
  return '<span class="type-badge type-' + clase + '">' + tipo + "</span>";
}

function revTipo(tipoEs) {
  const rev = {};
  Object.keys(TIPOS_ES).forEach(function (k) { rev[TIPOS_ES[k]] = k; });
  return rev[tipoEs] || tipoEs.toLowerCase();
}

function mezclar(array) {
  const copia = array.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j];
    copia[j] = temp;
  }
  return copia;
}

function elegirAleatorios(array, cantidad, excluir) {
  const filtrado = array.filter(function (item) {
    return excluir.indexOf(item) === -1;
  });
  return mezclar(filtrado).slice(0, cantidad);
}

function lanzarCelebracion(contenedor) {
  const el = contenedor || document.getElementById("celebration");
  if (!el) return;
  el.classList.remove("hidden");
  el.innerHTML = "";
  const emojis = ["⭐", "🎉", "✨", "🌟", "💫", "🏆", "⚡", "🔥"];
  for (let i = 0; i < 24; i++) {
    const span = document.createElement("span");
    span.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    span.style.left = Math.random() * 100 + "%";
    span.style.animationDelay = Math.random() * 0.5 + "s";
    span.style.fontSize = (1 + Math.random() * 1.5) + "rem";
    el.appendChild(span);
  }
  setTimeout(function () { el.classList.add("hidden"); }, 1600);
}

/* Medallas y progreso (localStorage) */
const MEDALLAS = {
  explorador: { icon: "🗺️", titulo: "Explorador", desc: "Visitaste 5 fichas de Pokémon" },
  maestro_quiz: { icon: "🧠", titulo: "Detective", desc: "10 aciertos en ¿Quién es?" },
  memoria_pro: { icon: "🃏", titulo: "Memoria Pro", desc: "Completaste Memoria en menos de 20 movimientos" },
  cazador: { icon: "🎯", titulo: "Super Cazador", desc: "Atrapaste 20 Pokémon" },
  tipos: { icon: "⚔️", titulo: "Maestro de Tipos", desc: "8 aciertos en Batalla de Tipos" },
  pokedex: { icon: "📖", titulo: "Pokédex Gen 1", desc: "Viste la Pokédex completa" },
};

function getProgreso() {
  try {
    return JSON.parse(localStorage.getItem("pokeProgreso")) || {};
  } catch (e) {
    return {};
  }
}

function guardarProgreso(datos) {
  localStorage.setItem("pokeProgreso", JSON.stringify(datos));
}

function registrarVisita(id) {
  const p = getProgreso();
  p.visitados = p.visitados || [];
  if (p.visitados.indexOf(id) === -1) p.visitados.push(id);
  if (p.visitados.length >= 5) desbloquearMedalla("explorador");
  guardarProgreso(p);
}

function desbloquearMedalla(clave) {
  const p = getProgreso();
  p.medallas = p.medallas || [];
  if (p.medallas.indexOf(clave) === -1) {
    p.medallas.push(clave);
    guardarProgreso(p);
    mostrarToast("¡Nueva medalla! " + MEDALLAS[clave].icon + " " + MEDALLAS[clave].titulo);
  }
}

function sumarLogro(campo, cantidad, medalla, umbral) {
  const p = getProgreso();
  p[campo] = (p[campo] || 0) + cantidad;
  if (p[campo] >= umbral) desbloquearMedalla(medalla);
  guardarProgreso(p);
}

function mostrarToast(mensaje) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.classList.add("show");
  setTimeout(function () { toast.classList.remove("show"); }, 3500);
}

function renderMedallas(contenedor) {
  const p = getProgreso();
  const obtenidas = p.medallas || [];
  contenedor.innerHTML = "";
  Object.keys(MEDALLAS).forEach(function (clave) {
    const m = MEDALLAS[clave];
    const div = document.createElement("div");
    div.className = "medalla " + (obtenidas.indexOf(clave) !== -1 ? "obtenida" : "bloqueada");
    div.innerHTML =
      '<span class="medalla-icon">' + m.icon + "</span>" +
      "<strong>" + m.titulo + "</strong>" +
      "<small>" + m.desc + "</small>";
    contenedor.appendChild(div);
  });
}

function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const destino = tab.dataset.section;
      tabs.forEach(function (t) { t.classList.remove("active"); });
      sections.forEach(function (s) { s.classList.remove("active"); });
      tab.classList.add("active");
      document.getElementById(destino + "-section").classList.add("active");
    });
  });
}
