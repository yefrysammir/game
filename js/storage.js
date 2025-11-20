// storage.js
// Mantiene la API que ya usabas (save/load/exists/newGame) + carga de data (monsters/config)

const STORAGE_KEY = 'syamon_save';

const STORAGE = {
  // guarda el objeto tal como te gusta
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Error guardando:', e);
    }
  },

  // carga el save (objeto) o null
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error('Error leyendo save:', e);
      return null;
    }
  },

  exists() {
    return localStorage.getItem(STORAGE_KEY) !== null;
  },

  // crea nueva partida por defecto (compatible con tu estructura)
  newGame() {
    const newData = {
      player: { name: 'Entrenador', gender: 'privado' },
      map: { x: 100, y: 100 }, // px coords (se usan en MAP.loadPlayer)
      money: 120,
      xp: 0,
      inventory: { pokeball: 5, potion: 3 },
      party: [
        { id: 'sy001', nombre: 'Syamon', level: 6, maxHp: 34, hp: 34, moves: [{id:'m1', name:'Placaje', power:6}], xp:0 },
        { id: 'sy002', nombre: 'Syakit', level: 5, maxHp: 28, hp: 28, moves: [{id:'m1', name:'Placaje', power:6}], xp:0 }
      ],
      pokedex: {},
      currentEncounter: null,
      lastSave: new Date().toISOString()
    };
    this.save(newData);
    return newData;
  },

  // carga monsters/config desde data/ (devuelve Promise)
  async loadData() {
    if (this._dataPromise) return this._dataPromise;
    this._dataPromise = Promise.all([
      fetch('data/monsters.json').then(r => r.json()),
      fetch('data/config.json').then(r => r.json()).catch(()=>({}))
    ]).then(([monsters, config]) => {
      this.monsters = monsters || [];
      this.config = config || {};
      return { monsters: this.monsters, config: this.config };
    }).catch(e => {
      console.error('Error cargando data:', e);
      this.monsters = [];
      this.config = {};
      return { monsters: [], config: {} };
    });
    return this._dataPromise;
  }
};