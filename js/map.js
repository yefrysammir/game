// map.js
// Control de mapa: render simple grid, move by controls, click-to-move, encounters using STORAGE.monsters

const MAP = (function(){
  const gridCols = 11;
  const gridRows = 9;
  const mapEl = document.getElementById('map');
  const playerEl = document.getElementById('player');
  const encounterTextEl = document.getElementById('encounter-text');
  const btnFight = document.getElementById('btn-fight');

  let cellW = 0, cellH = 0;
  let moving = false;

  // initialize controls after DOM loaded
  function initControls() {
    document.querySelectorAll('.ctrl').forEach(btn=>{
      btn.onclick = () => {
        const dir = btn.dataset.dir;
        const d = dirToDelta(dir);
        stepMove(d.dx, d.dy);
      };
    });

    // fight button
    if (btnFight) {
      btnFight.onclick = () => {
        if (Game.data && Game.data.currentEncounter) {
          UI.startBattle(Game.data.currentEncounter);
        }
      };
    }
  }

  function dirToDelta(dir) {
    const map = {
      'up': {dx:0, dy:-1}, 'down': {dx:0, dy:1},
      'left': {dx:-1, dy:0}, 'right': {dx:1, dy:0},
      'up-left': {dx:-1, dy:-1}, 'up-right': {dx:1, dy:-1},
      'down-left': {dx:-1, dy:1}, 'down-right': {dx:1, dy:1}
    };
    return map[dir] || {dx:0, dy:0};
  }

  function loadPlayer() {
    if (!Game.data) return;
    // ensure we have grid sizing
    computeCellSize();
    // convert saved pixel coords (map.x/map.y) into grid coords
    // Your saved map uses pixel positions in base version; we will support both:
    const p = Game.data.map || { x: 100, y: 100 };
    // If saved as grid coords (integers small), handle both cases:
    // We'll interpret Game.data.grid (optional) preferred; else compute from pixel
    if (typeof Game.data.grid === 'object' && Game.data.grid.x != null) {
      Game.data.grid.x = clamp(Game.data.grid.x, 0, gridCols-1);
      Game.data.grid.y = clamp(Game.data.grid.y, 0, gridRows-1);
    } else {
      // derive grid from pixel x,y relative to map size
      const gx = Math.floor((p.x / Math.max(1, mapEl.clientWidth)) * gridCols);
      const gy = Math.floor((p.y / Math.max(1, mapEl.clientHeight)) * gridRows);
      Game.data.grid = { x: clamp(gx,0,gridCols-1), y: clamp(gy,0,gridRows-1) };
    }
    placePlayer();
  }

  function computeCellSize() {
    cellW = Math.floor(mapEl.clientWidth / gridCols);
    cellH = Math.floor(mapEl.clientHeight / gridRows);
  }

  function placePlayer() {
    computeCellSize();
    const gx = (Game.data && Game.data.grid && Game.data.grid.x != null) ? Game.data.grid.x : Math.floor(gridCols/2);
    const gy = (Game.data && Game.data.grid && Game.data.grid.y != null) ? Game.data.grid.y : Math.floor(gridRows/2);
    const px = gx * cellW + Math.floor((cellW - playerEl.clientWidth)/2);
    const py = gy * cellH + Math.floor((cellH - playerEl.clientHeight)/2);
    playerEl.style.left = px + 'px';
    playerEl.style.top = py + 'px';
  }

  function stepMove(dx, dy) {
    if (!Game.data) return alert('Crea o retoma una partida primero.');
    Game.data.grid = Game.data.grid || { x: Math.floor(gridCols/2), y: Math.floor(gridRows/2) };
    const nx = clamp(Game.data.grid.x + dx, 0, gridCols-1);
    const ny = clamp(Game.data.grid.y + dy, 0, gridRows-1);
    Game.data.grid.x = nx; Game.data.grid.y = ny;
    placePlayer();
    afterMove();
  }

  function moveToward(tx, ty) {
    if (!Game.data) return;
    if (moving) return;
    moving = true;
    const path = computePath(Game.data.grid.x, Game.data.grid.y, tx, ty);
    let i = 0;
    const step = () => {
      if (i >= path.length) { moving=false; return; }
      const p = path[i++];
      Game.data.grid.x = p.x; Game.data.grid.y = p.y;
      placePlayer();
      afterMove();
      setTimeout(step, 110);
    };
    step();
  }

  function computePath(sx,sy,tx,ty) {
    const path = [];
    let cx = sx, cy = sy;
    while (cx !== tx || cy !== ty) {
      const dx = Math.sign(tx - cx);
      const dy = Math.sign(ty - cy);
      cx += dx; cy += dy;
      path.push({x: cx, y: cy});
      if (path.length > 200) break;
    }
    return path;
  }

  function afterMove() {
    // save logical grid to Game.data.map for compatibility
    Game.data.map = Game.data.map || {};
    Game.data.map.x = Math.floor((Game.data.grid.x / gridCols) * mapEl.clientWidth);
    Game.data.map.y = Math.floor((Game.data.grid.y / gridRows) * mapEl.clientHeight);
    STORAGE.save(Game.data);

    // encounter roll using config
    const rate = (STORAGE.config && STORAGE.config.encounterRate) ? STORAGE.config.encounterRate : 0.18;
    if (Math.random() < rate) {
      spawnEncounter();
    } else {
      clearEncounter();
    }
  }

  function spawnEncounter() {
    const monsters = STORAGE.monsters || [];
    if (!monsters || monsters.length === 0) {
      clearEncounter();
      return;
    }
    const pick = JSON.parse(JSON.stringify(monsters[Math.floor(Math.random()*monsters.length)]));
    // current Hp
    pick.currentHp = pick.hp;
    // store
    Game.data.currentEncounter = pick;
    STORAGE.save(Game.data);
    // update UI
    encounterTextEl.textContent = `¡Apareció ${pick.nombre}!`;
    if (btnFight) btnFight.style.display = 'inline-block';
    // mark seen
    Game.data.pokedex = Game.data.pokedex || {};
    Game.data.pokedex[pick.id] = Game.data.pokedex[pick.id] || { visto:true, capturado:false };
    STORAGE.save(Game.data);
  }

  function clearEncounter() {
    Game.data.currentEncounter = null;
    STORAGE.save(Game.data);
    encounterTextEl.textContent = 'No se encontró nada.';
    if (btnFight) btnFight.style.display = 'none';
  }

  function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }

  // allow clicking map to move to a tile (create invisible grid of clickable cells)
  function renderClickableGrid() {
    // remove previous children
    const existing = mapEl.querySelectorAll('.map-cell');
    existing.forEach(e => e.remove());
    computeCellSize();
    for (let y=0;y<gridRows;y++){
      for (let x=0;x<gridCols;x++){
        const cell = document.createElement('div');
        cell.className = 'map-cell';
        cell.style.position = 'absolute';
        cell.style.left = (x*cellW) + 'px';
        cell.style.top = (y*cellH) + 'px';
        cell.style.width = (cellW) + 'px';
        cell.style.height = (cellH) + 'px';
        cell.style.cursor = 'pointer';
        cell.style.background = 'transparent';
        // click
        (function(tx,ty){
          cell.addEventListener('click', () => moveToward(tx,ty));
        })(x,y);
        mapEl.appendChild(cell);
      }
    }
  }

  // public API
  return {
    initControls,
    loadPlayer,
    placePlayer,
    stepMove,
    moveToward,
    clearEncounter,
    renderClickableGrid
  };
})();