const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu', '--headless=new'],
  });

  const desktop = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await desktop.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await desktop.waitForTimeout(2000);

  // Inject mock restaurant list + winner state into the sidebar
  await desktop.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    const noResults = sidebar.querySelector('.no-results');
    if (noResults) noResults.remove();

    // Update header
    const header = sidebar.querySelector('.sidebar-header h2');
    header.textContent = 'Found Restaurants';

    // Create mock restaurant list
    const ul = document.createElement('ul');
    const restaurants = [
      { name: "La Bella Italia", address: "123 Main St, New York, NY", price: "$$", winner: false },
      { name: "Golden Dragon", address: "456 Broadway, New York, NY", price: "$$$", winner: true },
      { name: "Cafe Parisien", address: "789 5th Ave, New York, NY", price: "$$", winner: false },
      { name: "Sushi Master", address: "321 Park Ave, New York, NY", price: "$$$$", winner: false },
      { name: "Burger Palace", address: "654 Lexington Ave, New York, NY", price: "$", winner: false },
    ];

    restaurants.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'restaurant-item';
      li.style.cssText = r.winner ? 'background: rgba(212, 175, 55, 0.2); box-shadow: inset 4px 0 0 #d4af37;' : '';
      li.innerHTML = `
        <input type="checkbox" checked class="restaurant-checkbox" style="width:20px;height:20px;accent-color:#b8860b;">
        <div style="width:70px;height:70px;border-radius:8px;border:2px solid ${r.winner ? '#d4af37' : '#b8860b'};background:linear-gradient(135deg, #6b2d5c 0%, #4a1c40 100%);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:24px;">${r.winner ? '&#127942;' : '&#127869;'}</div>
        <div class="restaurant-details">
          <strong style="${r.winner ? 'color:#b8860b;font-size:1.1em;' : ''}">${r.name} ${r.winner ? ' &#127881;' : ''}</strong><br>
          <small>${r.address}</small><br>
          <small>${r.price}</small>
        </div>
      `;
      ul.appendChild(li);
    });

    // Insert before the select controls
    const controls = sidebar.querySelector('.select-controls-bottom');
    controls.before(ul);

    // Update wheel text to show winner
    const wheel = document.getElementById('wheel');
    wheel.textContent = '🎉 Golden Dragon';
  });

  await desktop.waitForTimeout(500);
  await desktop.screenshot({ path: '/tmp/ss-winner-desktop.png' });
  console.log('1. Desktop winner state');

  console.log('2. (Skipped toast screenshot - toast not shown for winners)');

  // Mobile winner
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await mobile.goto('http://localhost:5175', { waitUntil: 'domcontentloaded', timeout: 10000 });
  await mobile.waitForTimeout(2000);

  await mobile.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    const noResults = sidebar.querySelector('.no-results');
    if (noResults) noResults.remove();

    const ul = document.createElement('ul');
    const restaurants = [
      { name: "La Bella Italia", address: "123 Main St, NY", price: "$$", winner: false },
      { name: "Golden Dragon", address: "456 Broadway, NY", price: "$$$", winner: true },
      { name: "Cafe Parisien", address: "789 5th Ave, NY", price: "$$", winner: false },
    ];

    restaurants.forEach((r) => {
      const li = document.createElement('li');
      li.className = 'restaurant-item';
      li.style.cssText = r.winner ? 'background: rgba(212, 175, 55, 0.2); box-shadow: inset 4px 0 0 #d4af37;' : '';
      li.innerHTML = `
        <input type="checkbox" checked class="restaurant-checkbox" style="width:20px;height:20px;accent-color:#b8860b;">
        <div style="width:70px;height:70px;border-radius:8px;border:2px solid ${r.winner ? '#d4af37' : '#b8860b'};background:linear-gradient(135deg, #6b2d5c 0%, #4a1c40 100%);flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#d4af37;font-size:24px;">${r.winner ? '&#127942;' : '&#127869;'}</div>
        <div class="restaurant-details">
          <strong style="${r.winner ? 'color:#b8860b;font-size:1.1em;' : ''}">${r.name}${r.winner ? ' &#127881;' : ''}</strong><br>
          <small>${r.address}</small><br>
          <small>${r.price}</small>
        </div>
      `;
      ul.appendChild(li);
    });

    const controls = sidebar.querySelector('.select-controls-bottom');
    controls.before(ul);

    const wheel = document.getElementById('wheel');
    wheel.textContent = '🎉 Golden Dragon';
  });

  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: '/tmp/ss-winner-mobile.png', fullPage: true });
  console.log('3. Mobile winner state');

  await browser.close();
  console.log('\nDone!');
})();
