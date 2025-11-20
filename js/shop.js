// shop.js
// Render shop based on data/config.json -> shop array
(function(){
  let shopItems = null;

  async function loadShop() {
    if (shopItems) return shopItems;
    try {
      const cfg = await fetch('data/config.json').then(r=>r.json());
      shopItems = (cfg && cfg.shop) ? cfg.shop : [];
    } catch (e) {
      console.error('Error cargando config.json', e);
      shopItems = [];
    }
    return shopItems;
  }

  async function renderShop() {
    const ul = document.getElementById('list-shop');
    if (!ul) return;
    const save = STORAGE.load();
    ul.innerHTML = '';
    if (!save) {
      ul.innerHTML = '<li>No hay partida cargada.</li>';
      return;
    }
    const items = await loadShop();
    if (!items.length) {
      ul.innerHTML = '<li>Tienda vacía (config.json).</li>';
      return;
    }
    // header showing money
    const header = document.createElement('li');
    header.textContent = `Dinero: ${save.money || 0}`;
    header.style.fontWeight = '700';
    ul.appendChild(header);

    items.forEach(it => {
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      const span = document.createElement('span');
      span.textContent = `${it.name} — $${it.price}`;
      const btn = document.createElement('button');
      btn.className = 'btn small';
      btn.style.width = 'auto';
      btn.textContent = 'Comprar';
      btn.onclick = () => buyItem(it);
      li.appendChild(span);
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function buyItem(item) {
    const save = STORAGE.load();
    if (!save) return alert('No hay partida.');
    if ((save.money || 0) < item.price) return alert('No tienes suficiente dinero.');
    save.money = (save.money || 0) - item.price;
    save.inventory = save.inventory || {};
    save.inventory[item.id] = (save.inventory[item.id] || 0) + 1;
    STORAGE.save(save);
    alert(`Compraste ${item.name}`);
    renderShop();
  }

  window.ShopModule = { renderShop, buyItem };
})();