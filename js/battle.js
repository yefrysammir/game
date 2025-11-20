// battle.js
// Combate sencillo con un enemigo, permite atacar, capturar (pokeball), huir, recompensa

const BATTLE = (function(){
  let enemy = null;

  function init(monster) {
    // monster object has nombre, hp, atk, nivel, xp, gold, id
    enemy = JSON.parse(JSON.stringify(monster));
    enemy.currentHp = enemy.currentHp || enemy.hp || 10;
    renderBattle();
    hookButtons();
    appendLog(`¡Comienza el combate contra ${enemy.nombre}!`);
  }

  function renderBattle() {
    document.getElementById('battle-title').textContent = `Luchas contra ${enemy.nombre}`;
    const enemyBox = document.getElementById('enemy');
    enemyBox.style.background = enemy.color || '#c44';
    enemyBox.textContent = `${enemy.nombre} (Lv ${enemy.nivel}) HP:${enemy.currentHp}/${enemy.hp}`;

    // team box: quick list of party
    const teamBox = document.getElementById('team');
    teamBox.innerHTML = '';
    const party = Game.data.party || [];
    party.forEach(p => {
      const d = document.createElement('div');
      d.style.padding = '6px';
      d.style.marginBottom = '4px';
      d.style.borderRadius = '6px';
      d.style.background = 'rgba(255,255,255,0.04)';
      d.textContent = `${p.nombre} Lv${p.level} HP:${p.hp}/${p.maxHp}`;
      teamBox.appendChild(d);
    });

    // update battle-log area
    const log = document.getElementById('battle-log');
    if (log) log.textContent = '';
  }

  function hookButtons() {
    document.getElementById('btn-attack').onclick = playerAttack;
    document.getElementById('btn-catch').onclick = attemptCapture;
    document.getElementById('btn-run').onclick = attemptRun;
    document.getElementById('btn-battle-back').onclick = ()=> {
      // allow player to return to map (end combat)
      endBattle();
    };
  }

  function appendLog(text) {
    const el = document.getElementById('battle-log');
    el.textContent = text + '\n' + el.textContent;
    renderBattle();
  }

  function playerAttack() {
    const party = Game.data.party || [];
    const active = party.find(p=>p && p.hp > 0);
    if (!active) {
      appendLog('No tienes Pokémon aptos para pelear.');
      return;
    }
    const move = (active.moves && active.moves[0]) ? active.moves[0] : { name:'Ataque', power:4 };
    const damage = Math.max(1, move.power + Math.floor(active.level/2) - Math.floor((enemy.atk||4)/4));
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);
    appendLog(`${active.nombre} usa ${move.name} y hace ${damage} daño.`);

    if (enemy.currentHp <= 0) {
      onEnemyDefeated(active);
      return;
    }
    // enemy retaliates
    setTimeout(()=> enemyAttack(active), 400);
  }

  function enemyAttack(target) {
    if (!target) return;
    const dmg = Math.max(1, (enemy.atk || 4) - Math.floor(target.level/3));
    target.hp = Math.max(0, target.hp - dmg);
    appendLog(`${enemy.nombre} atacó a ${target.nombre} y le hizo ${dmg} de daño.`);
    // check faint
    if (target.hp <= 0) appendLog(`${target.nombre} se debilitó.`);
    // save state
    STORAGE.save(Game.data);
  }

  function attemptCapture() {
    const inv = Game.data.inventory || {};
    if (!inv.pokeball || inv.pokeball <= 0) {
      alert('No tienes Pokeballs.');
      return;
    }
    inv.pokeball = Math.max(0, inv.pokeball - 1);
    appendLog('Lanzaste una Pokeball...');
    const rate = (enemy.hp - enemy.currentHp) / enemy.hp;
    const base = 0.25;
    const chance = base + rate * 0.6;
    if (Math.random() < chance) {
      appendLog(`¡Has capturado a ${enemy.nombre}!`);
      Game.data.pokedex = Game.data.pokedex || {};
      Game.data.pokedex[enemy.id] = Game.data.pokedex[enemy.id] || {};
      Game.data.pokedex[enemy.id].capturado = true;
      // add to party if space
      if (!Game.data.party) Game.data.party = [];
      if (Game.data.party.length < 6) {
        Game.data.party.push({
          id: 'c_' + Date.now(),
          nombre: enemy.nombre,
          level: Math.max(1, Math.floor(enemy.nivel)),
          maxHp: enemy.hp,
          hp: Math.max(1, Math.floor(enemy.hp/2)),
          moves: [{id:'m1', name:'Ataque', power:5}],
          xp: 0
        });
      }
      STORAGE.save(Game.data);
      endBattle();
    } else {
      appendLog('La captura falló.');
      // enemy retaliates
      setTimeout(()=> enemyAttack(Game.data.party.find(p=>p && p.hp>0)), 400);
    }
  }

  function attemptRun() {
    if (Math.random() < 0.6) {
      appendLog('Huiste con éxito.');
      endBattle();
    } else {
      appendLog('No pudiste huir.');
      setTimeout(()=> enemyAttack(Game.data.party.find(p=>p && p.hp>0)), 400);
    }
  }

  function onEnemyDefeated(active) {
    appendLog(`${enemy.nombre} fue derrotado.`);
    const gold = enemy.gold || (enemy.nivel * 5);
    const xpG = enemy.xp || (enemy.nivel * 6);
    Game.data.money = (Game.data.money || 0) + gold;
    Game.data.xp = (Game.data.xp || 0) + xpG;
    appendLog(`Ganaste ${xpG} XP y ${gold} monedas.`);
    // give xp to active
    if (active) {
      active.xp = (active.xp || 0) + xpG;
      if (active.xp >= 100) {
        active.level = (active.level || 1) + 1;
        active.maxHp += 6;
        active.hp = active.maxHp;
        active.xp = active.xp - 100;
        appendLog(`${active.nombre} subió a nivel ${active.level}!`);
      }
    }
    STORAGE.save(Game.data);
    endBattle();
  }

  function endBattle() {
    // clear encounter and go back to map
    Game.data.currentEncounter = null;
    Game.data.currentEnemyForBattle = null;
    STORAGE.save(Game.data);
    // update map encounter UI via MAP.clearEncounter if available
    if (typeof MAP !== 'undefined' && MAP.clearEncounter) MAP.clearEncounter();
    if (typeof UI !== 'undefined' && UI.goToMap) UI.goToMap();
  }

  return {
    init,
    playerAttack,
    attemptCapture,
    attemptRun
  };
})();