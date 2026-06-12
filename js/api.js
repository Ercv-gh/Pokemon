const API = "https://pokeapi.co/api/v2";
const cache = {};

const TIPOS_ES = {
  normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta",
  electric: "Eléctrico", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
  ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
  rock: "Roca", ghost: "Fantasma", dragon: "Dragón", dark: "Siniestro",
  steel: "Acero", fairy: "Hada",
};

const STATS_ES = {
  hp: "PS", attack: "Ataque", defense: "Defensa",
  "special-attack": "At. Esp.", "special-defense": "Def. Esp.", speed: "Velocidad",
};

const GEN1_TOTAL = 151;

async function fetchAPI(url) {
  if (cache[url]) return cache[url];
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al conectar con PokeAPI");
  const data = await res.json();
  cache[url] = data;
  return data;
}

async function getListaPokemon(limit, offset) {
  return fetchAPI(API + "/pokemon?limit=" + limit + "&offset=" + offset);
}

async function getPokemon(id) {
  return fetchAPI(API + "/pokemon/" + id);
}

async function getEspecie(id) {
  return fetchAPI(API + "/pokemon-species/" + id);
}

async function getCadenaEvolucion(url) {
  return fetchAPI(url);
}

function tipoES(ingles) {
  return TIPOS_ES[ingles] || ingles;
}

function nombreES(especie, fallback) {
  if (!especie || !especie.names) return fallback;
  const es = especie.names.find(function (n) { return n.language.name === "es"; });
  return es ? es.name : fallback;
}

function descripcionES(especie) {
  if (!especie || !especie.flavor_text_entries) return "";
  const entradas = especie.flavor_text_entries.filter(function (e) {
    return e.language.name === "es";
  });
  if (!entradas.length) {
    const en = especie.flavor_text_entries.find(function (e) {
      return e.language.name === "en";
    });
    return en ? en.flavor_text.replace(/\f/g, " ").replace(/\n/g, " ") : "";
  }
  const texto = entradas[entradas.length - 1].flavor_text;
  return texto.replace(/\f/g, " ").replace(/\n/g, " ").replace(/\s+/g, " ").trim();
}

function imagenOficial(pokemon) {
  return pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default ||
    "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + pokemon.id + ".png";
}

function imagenSprite(pokemon) {
  return pokemon.sprites.front_default ||
    imagenOficial(pokemon);
}

function categoriaES(especie) {
  if (!especie || !especie.genera) return "";
  const es = especie.genera.find(function (g) { return g.language.name === "es"; });
  return es ? es.genus : "";
}

function normalizarPokemon(pokemon, especie) {
  const tipos = pokemon.types
    .sort(function (a, b) { return a.slot - b.slot; })
    .map(function (t) { return tipoES(t.type.name); });

  return {
    id: pokemon.id,
    nombre: nombreES(especie, capitalize(pokemon.name)),
    nombreEN: pokemon.name,
    tipos: tipos,
    tiposEN: pokemon.types.map(function (t) { return t.type.name; }),
    imagen: imagenOficial(pokemon),
    sprite: imagenSprite(pokemon),
    altura: (pokemon.height / 10).toFixed(1),
    peso: (pokemon.weight / 10).toFixed(1),
    stats: pokemon.stats.map(function (s) {
      return {
        nombre: STATS_ES[s.stat.name] || s.stat.name,
        valor: s.base_stat,
        clave: s.stat.name,
      };
    }),
    habilidades: pokemon.abilities.map(function (a) {
      return capitalize(a.ability.name.replace(/-/g, " "));
    }),
    descripcion: especie ? descripcionES(especie) : "",
    categoria: especie ? categoriaES(especie) : "",
    cadenaEvolucion: especie ? especie.evolution_chain.url : null,
  };
}

async function cargarPokemonCompleto(id) {
  const [pokemon, especie] = await Promise.all([
    getPokemon(id),
    getEspecie(id),
  ]);
  return normalizarPokemon(pokemon, especie);
}

async function cargarPokemonBasico(id) {
  const [pokemon, especie] = await Promise.all([
    getPokemon(id),
    getEspecie(id).catch(function () { return null; }),
  ]);
  return {
    id: pokemon.id,
    nombre: especie ? nombreES(especie, capitalize(pokemon.name)) : capitalize(pokemon.name),
    tipos: pokemon.types.map(function (t) { return tipoES(t.type.name); }),
    tiposEN: pokemon.types.map(function (t) { return t.type.name; }),
    imagen: imagenOficial(pokemon),
    sprite: imagenSprite(pokemon),
  };
}

async function cargarLotePokemon(ids) {
  return Promise.all(ids.map(cargarPokemonBasico));
}

let gen1Cache = null;

async function cargarTodosGen1() {
  const lista = await getListaPokemon(GEN1_TOTAL, 0);
  const ids = lista.results.map(function (_, i) { return i + 1; });
  const lotes = [];
  for (let i = 0; i < ids.length; i += 20) {
    const lote = await cargarLotePokemon(ids.slice(i, i + 20));
    lotes.push.apply(lotes, lote);
  }
  return lotes;
}

async function getGen1Pool() {
  if (gen1Cache) return gen1Cache;
  gen1Cache = await cargarTodosGen1();
  return gen1Cache;
}

async function cargarEvoluciones(url) {
  const cadena = await getCadenaEvolucion(url);
  const evoluciones = [];

  function recorrer(nodo) {
    evoluciones.push({
      id: parseInt(nodo.species.url.split("/").slice(-2, -1)[0], 10),
      nombre: capitalize(nodo.species.name),
    });
    nodo.evolves_to.forEach(recorrer);
  }

  recorrer(cadena.chain);
  return evoluciones;
}

function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1).replace(/-/g, " ");
}

/* Efectividad de tipos para el juego */
const SUPER_EFECTIVO = {
  normal: ["rock", "steel"],
  fire: ["grass", "ice", "bug", "steel"],
  water: ["fire", "ground", "rock"],
  grass: ["water", "ground", "rock"],
  electric: ["water", "flying"],
  ice: ["grass", "ground", "flying", "dragon"],
  fighting: ["normal", "ice", "rock", "dark", "steel"],
  poison: ["grass", "fairy"],
  ground: ["fire", "electric", "poison", "rock", "steel"],
  flying: ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug: ["grass", "psychic", "dark"],
  rock: ["fire", "ice", "flying", "bug"],
  ghost: ["psychic", "ghost"],
  dragon: ["dragon"],
  dark: ["psychic", "ghost"],
  steel: ["ice", "rock", "fairy"],
  fairy: ["fighting", "dragon", "dark"],
};

function tiposSuperEfectivosContra(tipoDefensaEN) {
  const resultado = [];
  Object.keys(SUPER_EFECTIVO).forEach(function (ataque) {
    if (SUPER_EFECTIVO[ataque].indexOf(tipoDefensaEN) !== -1) {
      resultado.push(ataque);
    }
  });
  return resultado;
}
