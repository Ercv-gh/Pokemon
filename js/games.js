let poolPokemon = [];
let juegoActivo = "quiz";

const gamePanels = {
  quiz: document.getElementById("game-quiz"),
  memory: document.getElementById("game-memory"),
  catch: document.getElementById("game-catch"),
  types: document.getElementById("game-types"),
};

document.querySelectorAll(".game-card-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    document.querySelectorAll(".game-card-btn").forEach(function (b) {
      b.classList.remove("active");
    });
    btn.classList.add("active");
    juegoActivo = btn.dataset.game;
    Object.keys(gamePanels).forEach(function (key) {
      gamePanels[key].classList.toggle("hidden", key !== juegoActivo);
    });
    if (juegoActivo === "memory" && !memoriaIniciada) iniciarMemoria();
    if (juegoActivo === "types" && !typesIniciado) iniciarTipos();
  });
});

async function initGames() {
  try {
    poolPokemon = await getGen1Pool();
    iniciarQuiz();
  } catch (e) {
    document.getElementById("quiz-feedback").textContent = "Conecta a internet para jugar.";
  }
}

/* ========== JUEGO 1: ¿QUIÉN ES? ========== */
let quizScore = 0, quizStreak = 0, quizTimer = 15, quizInterval = null;
let quizRespondido = false, quizActual = null;

function iniciarQuiz() {
  nuevaRondaQuiz();
}

function nuevaRondaQuiz() {
  if (!poolPokemon.length) return;
  quizRespondido = false;
  clearInterval(quizInterval);
  quizTimer = 15;
  document.getElementById("quiz-timer").textContent = quizTimer;
  document.getElementById("quiz-feedback").textContent = "";
  document.getElementById("quiz-feedback").className = "game-feedback";

  quizActual = poolPokemon[Math.floor(Math.random() * poolPokemon.length)];
  const img = document.getElementById("quiz-image");
  img.src = quizActual.imagen;
  img.classList.add("silhouette");

  const opciones = mezclar([
    quizActual.nombre,
  ].concat(elegirAleatorios(
    poolPokemon.map(function (p) { return p.nombre; }),
    3,
    [quizActual.nombre]
  )));

  const cont = document.getElementById("quiz-options");
  cont.innerHTML = "";
  opciones.forEach(function (nombre) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn option-text";
    btn.textContent = nombre;
    btn.addEventListener("click", function () {
      responderQuiz(nombre, btn);
    });
    cont.appendChild(btn);
  });

  quizInterval = setInterval(function () {
    quizTimer--;
    document.getElementById("quiz-timer").textContent = quizTimer;
    if (quizTimer <= 0) {
      clearInterval(quizInterval);
      if (!quizRespondido) {
        quizRespondido = true;
        quizStreak = 0;
        document.getElementById("quiz-feedback").textContent =
          "⏰ ¡Se acabó el tiempo! Era " + quizActual.nombre;
        document.getElementById("quiz-feedback").className = "game-feedback feedback-fail";
        document.getElementById("quiz-image").classList.remove("silhouette");
        setTimeout(nuevaRondaQuiz, 2000);
      }
    }
  }, 1000);
}

function responderQuiz(nombre, btn) {
  if (quizRespondido) return;
  quizRespondido = true;
  clearInterval(quizInterval);

  const cont = document.getElementById("quiz-options");
  cont.querySelectorAll(".option-btn").forEach(function (b) {
    b.disabled = true;
    if (b.textContent === quizActual.nombre) b.classList.add("correct");
  });

  document.getElementById("quiz-image").classList.remove("silhouette");

  if (nombre === quizActual.nombre) {
    quizScore += 10 + quizStreak * 3;
    quizStreak++;
    btn.classList.add("correct");
    document.getElementById("quiz-feedback").textContent = "¡Correcto! 🎉 +" + (10 + (quizStreak - 1) * 3) + " pts";
    document.getElementById("quiz-feedback").className = "game-feedback feedback-ok";
    lanzarCelebracion();
    sumarLogro("quizAciertos", 1, "maestro_quiz", 10);
  } else {
    quizStreak = 0;
    btn.classList.add("wrong");
    document.getElementById("quiz-feedback").textContent = "Era " + quizActual.nombre + ". ¡Sigue intentando!";
    document.getElementById("quiz-feedback").className = "game-feedback feedback-fail";
  }

  document.getElementById("quiz-score").textContent = quizScore;
  document.getElementById("quiz-streak").textContent = quizStreak;
  setTimeout(nuevaRondaQuiz, 2200);
}

/* ========== JUEGO 2: MEMORIA ========== */
let memoriaIniciada = false;
let memCards = [], memFlipped = [], memMoves = 0, memPairs = 0, memLock = false;

document.getElementById("mem-restart").addEventListener("click", iniciarMemoria);

function iniciarMemoria() {
  memoriaIniciada = true;
  memMoves = 0;
  memPairs = 0;
  memFlipped = [];
  memLock = false;
  document.getElementById("mem-moves").textContent = "0";
  document.getElementById("mem-pairs").textContent = "0/8";
  document.getElementById("mem-feedback").textContent = "";
  document.getElementById("mem-best").textContent =
    localStorage.getItem("memBest") || "—";

  const seleccion = mezclar(poolPokemon.slice()).slice(0, 8);
  memCards = mezclar(seleccion.concat(seleccion)).map(function (p, i) {
    return { id: i, pokeId: p.id, nombre: p.nombre, imagen: p.sprite };
  });

  const board = document.getElementById("memory-board");
  board.innerHTML = "";
  memCards.forEach(function (card) {
    const div = document.createElement("button");
    div.type = "button";
    div.className = "mem-card";
    div.dataset.id = card.id;
    div.innerHTML =
      '<span class="mem-back">?</span>' +
      '<span class="mem-front"><img src="' + card.imagen + '" alt=""><small>' + card.nombre + "</small></span>";
    div.addEventListener("click", function () { voltearCarta(div, card); });
    board.appendChild(div);
  });
}

function voltearCarta(el, card) {
  if (memLock || el.classList.contains("flipped") || el.classList.contains("matched")) return;

  el.classList.add("flipped");
  memFlipped.push({ el: el, card: card });

  if (memFlipped.length === 2) {
    memMoves++;
    document.getElementById("mem-moves").textContent = memMoves;
    memLock = true;

    const a = memFlipped[0];
    const b = memFlipped[1];

    if (a.card.pokeId === b.card.pokeId) {
      a.el.classList.add("matched");
      b.el.classList.add("matched");
      memPairs++;
      document.getElementById("mem-pairs").textContent = memPairs + "/8";
      memFlipped = [];
      memLock = false;

      if (memPairs === 8) {
        document.getElementById("mem-feedback").textContent = "🏆 ¡Lo lograste en " + memMoves + " movimientos!";
        document.getElementById("mem-feedback").className = "game-feedback feedback-ok";
        lanzarCelebracion();
        const best = parseInt(localStorage.getItem("memBest"), 10);
        if (!best || memMoves < best) {
          localStorage.setItem("memBest", memMoves);
          document.getElementById("mem-best").textContent = memMoves;
        }
        if (memMoves <= 20) desbloquearMedalla("memoria_pro");
      }
    } else {
      setTimeout(function () {
        a.el.classList.remove("flipped");
        b.el.classList.remove("flipped");
        memFlipped = [];
        memLock = false;
      }, 900);
    }
  }
}

/* ========== JUEGO 3: ATRAPAR ========== */
let catchScore = 0, catchLives = 3, catchTimer = 45, catchRunning = false;
let catchInterval = null, catchSpawn = null;

document.getElementById("catch-start").addEventListener("click", iniciarCatch);

function iniciarCatch() {
  if (catchRunning) return;
  catchRunning = true;
  catchScore = 0;
  catchLives = 3;
  catchTimer = 45;
  document.getElementById("catch-score").textContent = "0";
  document.getElementById("catch-lives").textContent = "❤️❤️❤️";
  document.getElementById("catch-timer").textContent = catchTimer;
  document.getElementById("catch-feedback").textContent = "¡Atrapa todos los que puedas!";
  document.getElementById("catch-arena").innerHTML = "";

  clearInterval(catchInterval);
  clearInterval(catchSpawn);

  catchInterval = setInterval(function () {
    catchTimer--;
    document.getElementById("catch-timer").textContent = catchTimer;
    if (catchTimer <= 0) finCatch();
  }, 1000);

  catchSpawn = setInterval(spawnPokemon, 900);
  setTimeout(spawnPokemon, 300);
}

function spawnPokemon() {
  if (!catchRunning) return;
  const arena = document.getElementById("catch-arena");
  const poke = poolPokemon[Math.floor(Math.random() * poolPokemon.length)];
  const el = document.createElement("button");
  el.type = "button";
  el.className = "catch-pokemon";
  el.innerHTML = '<img src="' + poke.sprite + '" alt="' + poke.nombre + '">';
  el.style.left = Math.random() * 75 + 5 + "%";
  el.style.top = Math.random() * 60 + 10 + "%";
  el.title = poke.nombre;

  let escaped = false;
  const escapeTimer = setTimeout(function () {
    if (!el.parentNode || escaped) return;
    escaped = true;
    el.classList.add("escaped");
    catchLives--;
    actualizarVidas();
    setTimeout(function () { el.remove(); }, 400);
    if (catchLives <= 0) finCatch();
  }, 1800);

  el.addEventListener("click", function () {
    if (escaped) return;
    escaped = true;
    clearTimeout(escapeTimer);
    catchScore++;
    document.getElementById("catch-score").textContent = catchScore;
    el.classList.add("caught");
    sumarLogro("atrapados", 1, "cazador", 20);
    lanzarCelebracion(document.getElementById("celebration"));
    setTimeout(function () { el.remove(); }, 300);
  });

  arena.appendChild(el);
}

function actualizarVidas() {
  const corazones = ["", "❤️", "❤️❤️", "❤️❤️❤️"];
  document.getElementById("catch-lives").textContent = corazones[catchLives] || "💔";
}

function finCatch() {
  catchRunning = false;
  clearInterval(catchInterval);
  clearInterval(catchSpawn);
  document.getElementById("catch-feedback").textContent =
    "🎮 Fin del juego — Atrapaste " + catchScore + " Pokémon";
  document.getElementById("catch-arena").innerHTML =
    '<p class="catch-hint">Pulsa Empezar para jugar otra vez</p>';
}

/* ========== JUEGO 4: BATALLA DE TIPOS ========== */
let typesIniciado = false;
let typesScore = 0, typesRound = 1, typesRespondido = false;

function iniciarTipos() {
  typesIniciado = true;
  typesScore = 0;
  typesRound = 1;
  document.getElementById("types-score").textContent = "0";
  nuevaRondaTipos();
}

function nuevaRondaTipos() {
  typesRespondido = false;
  document.getElementById("types-round").textContent = typesRound;
  document.getElementById("types-feedback").textContent = "";

  const defensor = poolPokemon[Math.floor(Math.random() * poolPokemon.length)];
  const tipoDefEN = defensor.tiposEN[0];
  const tipoDefES = defensor.tipos[0];
  const correctos = tiposSuperEfectivosContra(tipoDefEN);

  if (!correctos.length) {
    nuevaRondaTipos();
    return;
  }

  const correctoEN = correctos[Math.floor(Math.random() * correctos.length)];
  const correctoES = tipoES(correctoEN);

  document.getElementById("types-question").innerHTML =
    "⚔️ ¿Qué tipo ataca con <strong>FUERZA</strong> contra el tipo " +
    badgeTipo(tipoDefES, tipoDefEN) + "?";

  const todosEN = Object.keys(TIPOS_ES);
  const incorrectos = elegirAleatorios(todosEN, 3, correctos.concat([tipoDefEN]));
  const opciones = mezclar([correctoEN].concat(incorrectos));

  const cont = document.getElementById("types-options");
  cont.innerHTML = "";
  opciones.forEach(function (tipoEN) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn option-type";
    btn.style.setProperty("--type-color", COLORES_TIPO[tipoEN] || "#888");
    btn.innerHTML =
      '<span class="type-dot" style="background:' + (COLORES_TIPO[tipoEN] || "#888") + '"></span>' +
      '<span class="option-type-text">' + tipoES(tipoEN) + "</span>";
    btn.dataset.tipo = tipoEN;
    btn.addEventListener("click", function () {
      responderTipos(tipoEN, correctoEN, btn);
    });
    cont.appendChild(btn);
  });
}

function responderTipos(seleccion, correcto, btn) {
  if (typesRespondido) return;
  typesRespondido = true;

  document.getElementById("types-options").querySelectorAll(".option-btn").forEach(function (b) {
    b.disabled = true;
  });

  if (seleccion === correcto) {
    typesScore++;
    typesRound++;
    btn.classList.add("correct");
    document.getElementById("types-score").textContent = typesScore;
    document.getElementById("types-feedback").textContent = "¡Estrategia perfecta! ⚔️";
    document.getElementById("types-feedback").className = "game-feedback feedback-ok";
    lanzarCelebracion();
    sumarLogro("tiposAciertos", 1, "tipos", 8);
  } else {
    btn.classList.add("wrong");
    document.getElementById("types-options").querySelectorAll(".option-btn").forEach(function (b) {
      if (b.dataset.tipo === correcto) b.classList.add("correct");
    });
    document.getElementById("types-feedback").textContent =
      "La respuesta era " + tipoES(correcto) + ". ¡Estudia los tipos!";
    document.getElementById("types-feedback").className = "game-feedback feedback-fail";
    typesRound++;
  }

  setTimeout(nuevaRondaTipos, 2000);
}

initGames();
