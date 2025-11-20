// main.js
// Inicialización global minimal: carga data y mantiene Game object.

const Game = {
  data: null
};

(async function init() {
  // Carga data (monsters / config)
  await STORAGE.loadData();

  // Cargar save si existe, si no crear nuevo (pero mantengo la opción de Retomar)
  const saved = STORAGE.load();
  if (saved) {
    Game.data = saved;
  } else {
    // No forzamos nueva partida: dejamos que el usuario cree con "Nueva partida"
    Game.data = null;
  }

  // UI hooks: UI module will attach its event listeners when it loads (ui.js)
  // But ensure buttons that exist are enabled
  // If Game.data exists, we can show lobby directly (optional), we'll not auto navigate.
})();