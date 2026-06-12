let todosPokemon = [];
let filtrados = [];
let paginaActual = 1;
const POR_PAGINA = 24;

const listaEl = document.getElementById("pokemon-list");
const loadingEl = document.getElementById("pokedex-loading");
const paginationEl = document.getElementById("pokedex-pagination");
const buscarEl = document.getElementById("buscar");
const filtroTipoEl = document.getElementById("filtro-tipo");

async function initPokedex() {
  if (!listaEl) return;

  try {
    todosPokemon = await getGen1Pool();
    filtrados = todosPokemon.slice();
    llenarFiltroTipos();
    renderPagina();
    loadingEl.classList.add("hidden");
    listaEl.classList.remove("hidden");
    paginationEl.classList.remove("hidden");
    sumarLogro("pokedexVista", 1, "pokedex", 1);
  } catch (err) {
    loadingEl.innerHTML = "<p>❌ Error al conectar con PokeAPI. Comprueba tu internet.</p>";
  }
}

function llenarFiltroTipos() {
  const tipos = [];
  todosPokemon.forEach(function (p) {
    p.tipos.forEach(function (t) {
      if (tipos.indexOf(t) === -1) tipos.push(t);
    });
  });
  tipos.sort();
  tipos.forEach(function (t) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filtroTipoEl.appendChild(opt);
  });
}

function aplicarFiltros() {
  const texto = buscarEl.value.toLowerCase().trim();
  const tipo = filtroTipoEl.value;
  filtrados = todosPokemon.filter(function (p) {
    const coincideNombre = !texto || p.nombre.toLowerCase().indexOf(texto) !== -1 ||
      String(p.id).indexOf(texto) !== -1;
    const coincideTipo = !tipo || p.tipos.indexOf(tipo) !== -1;
    return coincideNombre && coincideTipo;
  });
  paginaActual = 1;
  renderPagina();
}

function renderPagina() {
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = filtrados.slice(inicio, inicio + POR_PAGINA);

  listaEl.innerHTML = "";
  pagina.forEach(function (poke, i) {
    const link = document.createElement("a");
    link.href = "pokemon.html?id=" + poke.id;
    link.className = "pokemon-card " + claseTipo(poke.tipos[0], poke.tiposEN[0]) + "-card";
    link.style.animationDelay = (i * 0.04) + "s";
    link.innerHTML =
      '<div class="card-shine"></div>' +
      '<span class="pokemon-number">#' + String(poke.id).padStart(3, "0") + "</span>" +
      '<div class="pokemon-image-wrap">' +
        '<img src="' + poke.imagen + '" alt="' + poke.nombre + '" loading="lazy">' +
      "</div>" +
      '<h2 class="pokemon-name">' + poke.nombre + "</h2>" +
      '<div class="pokemon-types">' + poke.tipos.map(function (t, i) {
        return badgeTipo(t, poke.tiposEN[i]);
      }).join("") + "</div>" +
      '<span class="card-cta">Ver ficha →</span>';
    listaEl.appendChild(link);
  });

  renderPaginacion();
}

function renderPaginacion() {
  const totalPaginas = Math.ceil(filtrados.length / POR_PAGINA) || 1;
  paginationEl.innerHTML = "";

  const info = document.createElement("span");
  info.className = "page-info";
  info.textContent = "Mostrando " + filtrados.length + " Pokémon · Página " + paginaActual + " de " + totalPaginas;
  paginationEl.appendChild(info);

  const nav = document.createElement("div");
  nav.className = "page-nav";

  const prev = document.createElement("button");
  prev.type = "button";
  prev.className = "page-btn";
  prev.textContent = "← Anterior";
  prev.disabled = paginaActual <= 1;
  prev.addEventListener("click", function () {
    paginaActual--;
    renderPagina();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const next = document.createElement("button");
  next.type = "button";
  next.className = "page-btn";
  next.textContent = "Siguiente →";
  next.disabled = paginaActual >= totalPaginas;
  next.addEventListener("click", function () {
    paginaActual++;
    renderPagina();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  nav.appendChild(prev);
  nav.appendChild(next);
  paginationEl.appendChild(nav);
}

if (buscarEl) {
  buscarEl.addEventListener("input", aplicarFiltros);
  filtroTipoEl.addEventListener("change", aplicarFiltros);
}

initPokedex();
