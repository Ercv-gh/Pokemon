const params = new URLSearchParams(window.location.search);
const id = parseInt(params.get("id"), 10);

const loadingEl = document.getElementById("detail-loading");
const contentEl = document.getElementById("detail-content");
const errorEl = document.getElementById("detail-error");

async function cargarFicha() {
  if (!id || id < 1) {
    mostrarError();
    return;
  }

  try {
    const poke = await cargarPokemonCompleto(id);
    registrarVisita(id);
    mostrarFicha(poke);
    document.title = poke.nombre + " — Mundo Pokémon";
  } catch (e) {
    mostrarError();
  }
}

function mostrarError() {
  loadingEl.classList.add("hidden");
  errorEl.classList.remove("hidden");
}

async function mostrarFicha(poke) {
  loadingEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  const hero = document.getElementById("detail-hero");
  hero.className = "detail-hero " + claseTipo(poke.tipos[0], poke.tiposEN[0]) + "-hero";

  document.getElementById("detail-image").src = poke.imagen;
  document.getElementById("detail-image").alt = poke.nombre;
  document.getElementById("detail-number").textContent = "#" + String(poke.id).padStart(3, "0");
  document.getElementById("detail-name").textContent = poke.nombre;
  document.getElementById("detail-category").textContent = poke.categoria || "Pokémon misterioso";
  document.getElementById("detail-types").innerHTML = poke.tipos.map(function (t, i) {
    return badgeTipo(t, poke.tiposEN[i]);
  }).join("");
  document.getElementById("detail-description").textContent =
    poke.descripcion || "Este Pokémon tiene muchos secretos por descubrir. ¡Explora más en la Pokédex!";
  document.getElementById("detail-height").textContent = poke.altura;
  document.getElementById("detail-weight").textContent = poke.peso;
  document.getElementById("detail-abilities").textContent = poke.habilidades.join(", ");

  const statsEl = document.getElementById("detail-stats");
  statsEl.innerHTML = "";
  poke.stats.forEach(function (stat) {
    const max = 255;
    const pct = Math.min(100, (stat.valor / max) * 100);
    const bar = document.createElement("div");
    bar.className = "stat-row";
    bar.innerHTML =
      '<span class="stat-name">' + stat.nombre + "</span>" +
      '<div class="stat-bar-bg"><div class="stat-bar-fill" style="width:0" data-width="' + pct + '"></div></div>' +
      '<span class="stat-val">' + stat.valor + "</span>";
    statsEl.appendChild(bar);
  });

  setTimeout(function () {
    statsEl.querySelectorAll(".stat-bar-fill").forEach(function (bar) {
      bar.style.width = bar.dataset.width + "%";
    });
  }, 200);

  if (poke.cadenaEvolucion) {
    try {
      const evos = await cargarEvoluciones(poke.cadenaEvolucion);
      const evoEl = document.getElementById("detail-evolutions");
      evoEl.innerHTML = "";
      evos.forEach(function (evo, i) {
        if (i > 0) {
          const arrow = document.createElement("span");
          arrow.className = "evo-arrow";
          arrow.textContent = "→";
          evoEl.appendChild(arrow);
        }
        const link = document.createElement("a");
        link.href = "pokemon.html?id=" + evo.id;
        link.className = "evo-item" + (evo.id === poke.id ? " evo-current" : "");
        link.innerHTML =
          '<img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + evo.id + '.png" alt="' + evo.nombre + '">' +
          "<span>" + evo.nombre + "</span>";
        evoEl.appendChild(link);
      });
    } catch (e) {
      document.getElementById("evolution-section").classList.add("hidden");
    }
  } else {
    document.getElementById("evolution-section").classList.add("hidden");
  }

  document.getElementById("random-pokemon").addEventListener("click", function () {
    const randomId = Math.floor(Math.random() * GEN1_TOTAL) + 1;
    window.location.href = "pokemon.html?id=" + randomId;
  });
}

cargarFicha();
