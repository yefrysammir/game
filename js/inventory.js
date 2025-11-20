// inventory.js
// Renders inventory screen and allows using potions (curar primer pokemon dañado)

(function(){
  function renderInventory() {
    const save = STORAGE.load();
    const moneyEl = document.getElementById('inv-money');
    const ul = document.getElementById('list-inventory');
    if (!ul || !moneyEl) return;
    if (!save) {
      ul.innerHTML = '<li>No hay partida cargada.</li>';
      moneyEl.textContent = '0';
      return;
    }
    moneyEl.textContent = save.money || 0;
    const inv = save.inventory || {};
    ul.innerHTML = '';
    const keys = Object.keys(inv);
    if (!keys.length) {
      ul.innerHTML = '<li>Inventario vacío.</li>';
      return;
    }
    keys.forEach(k => {
      const qty = inv[k] || 0;
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      li.style.alignItems = 'center';
      li.innerHTML = `<span>${k} x${qty}</span>`;
      // if potion -> add use button
      if (k.toLowerCase().includes('potion') || k.toLowerCase().includes('poción')) {
        const btn = document.createElement('button');
        btn.className = 'btn small';
        btn.style.width = 'auto';
        btn.textContent = 'Usar';
        btn.onclick = () => usePotion();
        li.appendChild(btn);
      }
      ul.appendChild(li);
    });
  }

  function usePotion() {
    const save = STORAGE.load();
    if (!save) return alert('No hay partida.');
    const inv = save.inventory || {};
    const key = Object.keys(inv).find(k => k.toLowerCase().includes('potion') || k.toLowerCase().includes('poción'));
    if (!key || (inv[key] || 0) <= 0) return alert('No tienes pociones.');
    // find first party pokemon with hp < maxHp
    const party = save.party || [];
    let healed = false;
    for (let p of party) {
      if (p && typeof p.hp === 'number' && typeof p.maxHp === 'number' && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + 30);
        healed = true;
        break;
      }
    }
    if (!healed) return alert('Ningún Pokémon necesita curación.');
    inv[key] = Math.max(0, inv[key]-1);
    save.inventory = inv;
    STORAGE.save(save);
    renderInventory();
    alert('Poción usada. Pokémon curado.');
  }

  window.InventoryModule = { renderInventory, usePotion };
})();