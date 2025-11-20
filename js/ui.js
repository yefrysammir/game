// ui.js
// Control de pantallas y botones que están en index.html

const UI = (function(){
  function show(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
    });
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
  }

  // Expuesto API (usado en index.html)
  const api = {
    show,
    // Nueva partida (confirma antes)
    newGameConfirm() {
      // display confirm screen area (we used screen-confirm)
      const confirm = document.getElementById('screen-confirm');
      if (confirm) {
        // show modal-like screen: use active class
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        confirm.classList.add('active');
        // wire yes/no once
        document.getElementById('confirm-yes').onclick = () => {
          const newd = STORAGE.newGame();
          Game.data = newd;
          alert('Nueva partida creada.');
          show('screen-lobby');
        };
        document.getElementById('confirm-no').onclick = () => {
          // go back to start
          show('screen-start');
        };
      } else {
        // fallback: immediate new game
        const newd = STORAGE.newGame();
        Game.data = newd;
        show('screen-lobby');
      }
    },

    loadGame() {
      if (!STORAGE.exists()) {
        alert('No tienes partida guardada.');
        return;
      }
      const s = STORAGE.load();
      Game.data = s;
      show('screen-lobby');
    },

    goToMap() {
      if (!Game.data) return alert('No hay partida activa. Crea o retoma una partida.');
      show('screen-map');
      // give the map module a chance to render player etc
      if (typeof MAP !== 'undefined' && MAP.loadPlayer) MAP.loadPlayer();
    },

    goToLobby() {
      show('screen-lobby');
    },

    goBackToStart() {
      show('screen-start');
    },

    // abre pantalla de batalla con monster data
    startBattle(monsterObj) {
      if (!monsterObj) return alert('Monstruo inválido.');
      // store in Game.data.temp if needed
      Game.data.currentEncounter = monsterObj;
      STORAGE.save(Game.data);
      // hand off to BATTLE
      if (typeof BATTLE !== 'undefined' && BATTLE.init) {
        BATTLE.init(monsterObj);
        show('screen-battle');
      } else {
        alert('Módulo de batalla no disponible.');
      }
    },

    // Pokedex / Inventory / Shop placeholders (real implementations in separate modules)
    openPokedex() {
      if (typeof PokedexModule !== 'undefined' && PokedexModule.renderPokedex) {
        PokedexModule.renderPokedex();
      }
      show('screen-pokedex');
    },

    openInventory() {
      if (typeof InventoryModule !== 'undefined' && InventoryModule.renderInventory) {
        InventoryModule.renderInventory();
      }
      show('screen-inventory');
    },

    openShop() {
      if (typeof ShopModule !== 'undefined' && ShopModule.renderShop) {
        ShopModule.renderShop();
      }
      show('screen-shop');
    }
  };

  return api;
})();