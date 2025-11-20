// pokedex.js
// Renders the pokedex list in #list-pokedex using data/monsters.json and save pokedex state

(function(){
  let monstersCache = null;

  async function loadMonsters() {
    if (monstersCache) return monstersCache;
    try {
      const resp = await fetch('data/monsters.json');
      monstersCache = await resp.json();
    } catch (e) {
      console.error('Error cargando monsters.json', e);
      monstersCache = [];
    }
    return monstersCache;
  }

  async function renderPokedex() {
    const list = document.getElementById('list-pokedex');
    if (!list) return;
    list.innerHTML = '';
    const monsters = await loadMonsters();
    const save = STORAGE.load() || {};
    const pok = save.pokedex || {};

    if (!monsters.length) {
      list.innerHTML = '<li>No hay datos de monstruos.</li>';
      return;
    }

    monsters.forEach(m => {
      const st = pok[m.id] || { visto:false, capturado:false };
      const li = document.createElement('li');
      li.innerHTML = `<strong style="color:${m.color || '#fff'}">●</strong> ${m.nombre} (Lv ${m.nivel}) - Visto: ${st.visto ? '✔' : '—'} - Capturado: ${st.capturado ? '✔' : '—'}`;
      list.appendChild(li);
    });
  }

  window.PokedexModule = { renderPokedex, loadMonsters };
})();