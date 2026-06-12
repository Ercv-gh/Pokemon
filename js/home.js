initTabs();

document.querySelectorAll("[data-go]").forEach(function (el) {
  el.addEventListener("click", function () {
    const seccion = el.dataset.go;
    document.querySelector('.tab[data-section="' + seccion + '"]').click();
  });
});

async function cargarPokemonDelDia() {
  const contenedor = document.getElementById("pokemon-dia");
  if (!contenedor) return;

  const dia = new Date().getDate();
  const id = ((dia * 7) % GEN1_TOTAL) + 1;

  try {
    const poke = await cargarPokemonCompleto(id);
    contenedor.innerHTML =
      '<p class="dia-label">⭐ Pokémon del día</p>' +
      '<a href="pokemon.html?id=' + poke.id + '" class="dia-card">' +
        '<img src="' + poke.imagen + '" alt="' + poke.nombre + '">' +
        "<h3>#" + String(poke.id).padStart(3, "0") + " " + poke.nombre + "</h3>" +
        '<div class="pokemon-types">' + poke.tipos.map(function (t, i) {
          return badgeTipo(t, poke.tiposEN[i]);
        }).join("") + "</div>" +
        '<p class="dia-desc">' + (poke.descripcion || "¡Descubre más en su ficha!") + "</p>" +
        '<span class="card-cta">Ver ficha completa →</span>' +
      "</a>";
  } catch (e) {
    contenedor.innerHTML = "<p>No se pudo cargar el Pokémon del día.</p>";
  }
}

const medallasGrid = document.getElementById("medallas-grid");
if (medallasGrid) renderMedallas(medallasGrid);

cargarPokemonDelDia();

/* Si la URL tiene hash #juegos, abrir esa pestaña */
if (window.location.hash === "#juegos") {
  setTimeout(function () {
    document.querySelector('.tab[data-section="juegos"]').click();
  }, 100);
}
