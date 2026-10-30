
const APP_VERSION = '2.0.9';

// Ikon outline lokal agar tampilan konsisten dan tetap bekerja offline.
function uiIcon(name, size = 20) {
  const paths = {
    home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 8h18M16 14h2"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 5-7"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.8 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.8-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.8-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.8 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 2Z" transform="translate(-1 -1) scale(1.05)"/>',
    cash: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M7 10h.01M17 15h.01M12 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
    pancake: '<path d="M4 15c0-2 3.6-3.5 8-3.5s8 1.5 8 3.5-3.6 4-8 4-8-2-8-4Z"/><path d="M6 11c0-2 2.7-3.5 6-3.5s6 1.5 6 3.5"/><path d="M8 7c.5-1.5 2-2.5 4-2.5"/>',
    egg: '<path d="M12 3c-3.5 0-7 6-7 11a7 7 0 0 0 14 0c0-5-3.5-11-7-11Z"/><path d="M9 15h.01M14 12h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',
    utensils: '<path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M16 3v18M16 3c3 2 4 5 4 8h-4"/>',
    receipt: '<path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    back: '<path d="m15 18-6-6 6-6M9 12h12"/>'
  };
  return `<svg class="ui-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.receipt}</svg>`;
}




async function checkAppVersion() {
  const notice = document.getElementById('updateNotice');
  const message = document.getElementById('updateMessage');
  const updateButton = document.getElementById('updateNow');
  const laterButton = document.getElementById('updateLater');

  if (!notice || !message || !updateButton || !laterButton) return;

  try {
    const response = await fetch('./version.json?t=' + Date.now(), {
      cache: 'no-store'
    });

    if (!response.ok) return;

    const data = await response.json();
    serverVersion = data.version;

    if (serverVersion === APP_VERSION) {
      notice.style.display = 'none';
      return;
    }

    message.textContent =
      data.message || 'Versi baru MartabakKu tersedia!';

    notice.style.display = 'block';

    laterButton.onclick = () => {
      notice.style.display = 'none';
    };

    updateButton.onclick = async () => {
      updateButton.disabled = true;
      updateButton.textContent = 'Memasang pembaruan...';

      try {
        if (!('serviceWorker' in navigator)) {
          throw new Error('Browser belum mendukung pembaruan aplikasi.');
        }

        const registration =
          await navigator.serviceWorker.getRegistration('./');

        if (!registration) {
          throw new Error('Service worker belum terdaftar.');
        }

        // Minta browser memeriksa versi terbaru.
        await registration.update();

        // Tunggu worker baru selesai dipasang.
        let worker = registration.waiting;

        if (!worker) {
          worker = await new Promise((resolve, reject) => {
            let timer;

            const cleanup = () => {
              clearTimeout(timer);
              registration.removeEventListener('updatefound', onUpdateFound);
              if (registration.installing) {
                registration.installing.removeEventListener(
                  'statechange',
                  onStateChange
                );
              }
            };

            const onStateChange = () => {
              const installing = registration.installing;

              if (installing && installing.state === 'installed') {
                cleanup();
                resolve(registration.waiting || installing);
              } else if (installing && installing.state === 'redundant') {
                cleanup();
                reject(new Error('Pemasangan versi baru gagal.'));
              }
            };

            const onUpdateFound = () => {
              const installing = registration.installing;
              if (installing) {
                installing.addEventListener('statechange', onStateChange);
                onStateChange();
              }
            };

            timer = setTimeout(() => {
              cleanup();
              reject(new Error(
                'Versi baru belum terpasang. Coba muat ulang halaman lalu tekan Update sekarang.'
              ));
            }, 20000);

            registration.addEventListener('updatefound', onUpdateFound);
            onUpdateFound();
          });
        }

        if (!worker || worker.state !== 'installed') {
          throw new Error(
            'Service worker baru belum siap. Periksa kembali versi service-worker.js.'
          );
        }

        // Tunggu hingga worker baru mengendalikan halaman.
        const activated = new Promise(resolve => {
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            resolve,
            { once: true }
          );
        });

        worker.postMessage('SKIP_WAITING');
        await activated;

        window.location.reload();

      } catch (error) {
        console.error('Update gagal:', error);
        message.textContent =
          error.message || 'Update gagal. Silakan coba lagi.';
        updateButton.disabled = false;
        updateButton.textContent = 'Coba lagi';
      }
    };

  } catch (error) {
    console.log('Pengecekan versi dilewati:', error);
  }
}

checkAppVersion();

const fmt = n => 'Rp' + Math.round(n).toLocaleString('id-ID');

let tab = 'home';
let menuCategoryPage = false;
let filter = 'Semua';
let selectedHistoryDate = todayKey();
let selectedExpenseStartDate = todayKey();
let selectedExpenseEndDate = todayKey();
let nextId = 1;
let editingSaleId = null;
let selectedMenuCategory = 'Asin';

// DAFTAR MENU MARTABAK
const menuItems = [
  {id:1,name:'Biasa Telur 2',type:'Asin',price:30000},
  {id:2,name:'Spesial Telur 3',type:'Asin',price:37000},
  {id:3,name:'Super Telur 4',type:'Asin',price:45000},
  {id:4,name:'Jumbo Telur 5',type:'Asin',price:60000},
  {id:5,name:'Kacang Coklat Susu',type:'Manis',price:22000},
  {id:6,name:'Kacang Susu',type:'Manis',price:18000},
  {id:7,name:'Coklat Susu',type:'Manis',price:20000},
  {id:8,name:'Pisang Coklat',type:'Manis',price:23000},
  {id:9,name:'Keju Susu',type:'Manis',price:25000},
  {id:10,name:'Pisang Susu',type:'Manis',price:18000},
  {id:11,name:'Keju Kacang',type:'Manis',price:28000},
  {id:12,name:'Keju Coklat',type:'Manis',price:28000},
  {id:13,name:'Pisang Keju',type:'Manis',price:28000},
  {id:14,name:'Double Keju',type:'Manis',price:35000},
  {id:15,name:'Kacang Keju Coklat',type:'Manis',price:32000},
  {id:16,name:'Kismis',type:'Manis',price:23000},
  {id:17,name:'Kismis Coklat',type:'Manis',price:25000},
  {id:18,name:'Kismis Keju',type:'Manis',price:28000},
  {id:19,name:'Komplit',type:'Manis',price:35000}
];

// MEMUAT TRANSAKSI YANG TERSIMPAN
let transactions = [];

try {
  transactions = JSON.parse(
    localStorage.getItem('martabakTransactions') || '[]'
  );

  if (!Array.isArray(transactions)) transactions = [];
} catch (e) {
  transactions = [];
}

nextId = transactions.reduce(
  (max, t) => Math.max(max, Number(t.id) || 0), 0
) + 1;

/* DATA PENGELUARAN */

let expenses = [];

try {
  const savedExpenses = JSON.parse(
    localStorage.getItem('martabakExpenses') || 'null'
  );

  if (Array.isArray(savedExpenses)) {
    expenses = savedExpenses.map(e => ({
      ...e,
      date: e.date || todayKey(),
      createdAt: e.createdAt || Date.now()
    }));
  } else {
    expenses = [];
    saveExpenses();
  }
} catch (e) {
  expenses = [];
}

function saveExpenses() {
  localStorage.setItem(
    'martabakExpenses',
    JSON.stringify(expenses)
  );
}

function todayExpenses() {
  return expenses
    .filter(e => e.date === todayKey())
    .sort((a, b) => {
      function getTime(e) {
        if (typeof e.createdAt === 'number') {
          return e.createdAt;
        }

        const numeric = Number(e.createdAt);

        if (e.createdAt && Number.isFinite(numeric) && numeric > 0) {
          return numeric;
        }

        const parsed = Date.parse(e.createdAt);

        return Number.isFinite(parsed) ? parsed : 0;
      }

      return getTime(b) - getTime(a);
    });
}

// FUNGSI TANGGAL
function todayKey() {
  const d = new Date();

  return [
    d.getFullYear(),
    String(d.getMonth()+1).padStart(2,'0'),
    String(d.getDate()).padStart(2,'0')
  ].join('-');
}

function dateLabel(value) {
  if (!value) return '-';

  const [y,m,d] = value.split('-').map(Number);

  return new Date(y,m-1,d).toLocaleDateString('id-ID',{
    day:'2-digit',
    month:'long',
    year:'numeric'
  });
}

function timeLabel(value) {
  if (!value) return '';

  return new Date(value).toLocaleTimeString('id-ID',{
    hour:'2-digit',
    minute:'2-digit'
  });
}

// FUNGSI DATA PENJUALAN HARI INI
function todayTransactions() {
  return transactions.filter(t => t.date === todayKey());
}

let reportStartDate = todayKey();
let reportEndDate = todayKey();

function transactionItems(t) {
  // Transaksi baru: satu pesanan berisi beberapa martabak.
  if (Array.isArray(t.items)) {
    return t.items;
  }

  // Transaksi lama: tetap dibaca seperti sebelumnya.
  return [{
    name: t.name,
    type: t.type,
    qty: Number(t.qty) || 0,
    price: Number(t.price) || 0
  }];
}

function transactionTotal(t) {
  const subtotal = transactionItems(t).reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.qty) || 0),
    0
  );
  // Biaya QRIS tersimpan terpisah agar tidak mengubah harga produk.
  return subtotal + (Number(t.qrisFee) || 0);
}

function transactionQty(t) {
  return transactionItems(t).reduce(
    (sum, item) => sum + (Number(item.qty) || 0),
    0
  );
}

function totalSales() {
  return todayTransactions().reduce(
    (sum, t) => sum + transactionTotal(t),
    0
  );
}

function totalSalesAllTime() {
  return transactions.reduce(
    (sum, t) => sum + transactionTotal(t),
    0
  );
}

function totalQty() {
  return todayTransactions().reduce(
    (sum, t) => sum + transactionQty(t),
    0
  );
}

function paymentCount(method) {
  return todayTransactions().filter(t =>
    (t.payment || t.method || '').toLowerCase() === method.toLowerCase()
  ).length;
}

function totalExp() {
  return todayExpenses().reduce(
    (sum, e) => sum + e.amount,
    0
  );
}

function qtyType(type) {
  return todayTransactions().reduce((sum, t) => {
    const qty = transactionItems(t)
      .filter(item => item.type === type)
      .reduce((subtotal, item) => subtotal + (Number(item.qty) || 0), 0);

    return sum + qty;
  }, 0);
}

function saveTransactions() {
  try {
    localStorage.setItem(
      'martabakTransactions',
      JSON.stringify(transactions)
    );
  } catch (e) {
    toast('Gagal menyimpan data di browser.');
  }
}

const esc = s => String(s).replace(/[&<>"']/g,c => ({
  '&':'&amp;',
  '<':'&lt;',
  '>':'&gt;',
  '"':'&quot;',
  "'":'&#39;'
}[c]));

function sync() {
  document.getElementById('heroSales').textContent =
    fmt(totalNetAllTime());

  document.getElementById('heroQty').textContent =
    totalQty() + ' buah';

  document.getElementById('heroExpense').textContent =
    paymentCount('Tunai') +
    paymentCount('QRIS') +
    paymentCount('Transfer') +
    ' transaksi';
}

function heading(title,sub='',button='') {
  return `
    <div class="heading-row">
      <div>
        <div class="heading">${title}</div>
        ${sub ? `<div class="muted">${sub}</div>` : ''}
      </div>
      ${button}
    </div>
  `;
}

// MENAMPILKAN BARIS TRANSAKSI


function productRows(list) {
  if (!list.length) {
    return '<div class="empty">Belum ada transaksi.</div>';
  }

  return list.map(p => {
    const items = transactionItems(p);
    const total = transactionTotal(p);
    const qty = transactionQty(p);

    const hasManis = items.some(item => item.type === 'Manis');
    const hasAsin = items.some(item => item.type === 'Asin');

    const icon = hasManis && hasAsin
      ? `<span class="food-pair">${uiIcon('pancake', 17)}${uiIcon('egg', 17)}</span>`
      : hasManis ? uiIcon('pancake', 21) : uiIcon('egg', 21);

    const itemDetails = items.map(item =>
      `${esc(item.name)} (${item.qty} × ${fmt(item.price)})`
    ).join('<br>');

    return `
      <div class="product">
        <div class="food food-icon">${icon}</div>

        <div class="product-info">
          <strong>${items.length > 1 ? 'Pesanan campuran' : esc(items[0].name)}</strong>

          <small>
            ${itemDetails}
            <br>${qty} buah
            ${p.createdAt ? ' · ' + timeLabel(p.createdAt) : ''}
            ${p.payment ? ' · ' + esc(p.payment) : ''}
          </small>
        </div>

        <div>
          <div class="price">${fmt(total)}</div>

          ${p.id ? `
            <div style="display:flex; gap:6px; margin-top:8px;">
              <button
                class="btn secondary"
                data-action="edit-sale"
                data-id="${p.id}">
                Edit
              </button>

              <button
                class="btn danger"
                data-action="delete-sale"
                data-id="${p.id}">
                Hapus
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// HALAMAN BERANDA




function getExpenseHistory() {
  return expenses
    .filter(e =>
      e.date >= selectedExpenseStartDate &&
      e.date <= selectedExpenseEndDate
    )
    .sort((a, b) => {
      const timeA = Number(a.createdAt) || Date.parse(a.createdAt) || 0;
      const timeB = Number(b.createdAt) || Date.parse(b.createdAt) || 0;
      return timeB - timeA;
    });
}

 // HALAMAN KEUANGAN






function formatNominal(value) {
  const angka = value.replace(/\D/g, '');
  return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// HALAMAN LAPORAN




function editMenu(id) {
  const item = menuItems.find(menu => menu.id === id);
  if (!item) return;

  document.getElementById('content').innerHTML = `
    ${heading('Edit Menu', 'Ubah informasi martabak')}

    <form id="editMenuForm" class="panel">
      <input type="hidden" id="editMenuId" value="${item.id}">

      <label class="field">
        <span>Nama menu</span>
        <input
          type="text"
          id="editMenuName"
          value="${esc(item.name)}"
          required>
      </label>

      <label class="field">
        <span>Jenis martabak</span>
        <select id="editMenuType" required>
          <option value="Manis" ${item.type === 'Manis' ? 'selected' : ''}>
            Manis
          </option>
          <option value="Asin" ${item.type === 'Asin' ? 'selected' : ''}>
            Asin
          </option>
        </select>
      </label>

      <label class="field">
        <span>Harga jual</span>
        <input
          type="text"
          id="editMenuPrice"
          value="${Number(item.price).toLocaleString('id-ID')}"
          inputmode="numeric"
          placeholder="Contoh: 30.000"
          required>

      </label>

      <button type="submit" class="btn full">
        Simpan Perubahan
      </button>

      <button
        type="button"
        class="btn secondary full"
        data-action="cancel-edit-menu">
        Batal
      </button>
    </form>

  `;

  const priceInput = document.getElementById('editMenuPrice');

  priceInput.addEventListener('input', function() {
    const digits = this.value.replace(/\D/g, '');

    this.value = digits
      ? Number(digits).toLocaleString('id-ID')
      : '';
  });
}

function showMenuCategory(type) {
  const items = menuItems.filter(item => item.type === type);

  document.getElementById('content').innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom:20px;
    ">
      <button type="button" class="btn secondary" data-action="back-menu-category" aria-label="Kembali" style="font-size:22px; padding:6px 13px;">‹</button>

      <div>
        <h2 style="margin:0;font-size:20px;">
          Edit Martabak ${type}
        </h2>
        <p style="
          margin:4px 0 0;
          color:#6b7280;
          font-size:13px;
        ">
          Pilih menu yang ingin kamu ubah
        </p>
      </div>
    </div>

    <div class="panel">
      <button
        class="btn full"
        data-action="add-menu"
        data-type="${type}">
        + Tambah Menu Martabak ${type}
      </button>

      ${items.map(item => `
        <div class="product">
          <div class="food">
            ${type === 'Manis' ? uiIcon('pancake', 22) : uiIcon('egg', 22)}
          </div>

          <div class="product-info">
            <div class="price">${fmt(item.price)}</div>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button
              class="btn secondary"
              data-action="edit-menu"
              data-id="${item.id}">
              Edit
            </button>

            <button
              class="btn"
              style="background:#dc2626;color:white;"
              data-action="delete-menu"
              data-id="${item.id}">
              Hapus
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function addMenu(type) {
  document.getElementById('content').innerHTML = `
    ${heading('Tambah Menu Martabak', 'Martabak ' + type)}

    <form id="addMenuForm" class="panel">
      <input type="hidden" id="newMenuType" value="${type}">

      <label class="field">
        <span>Nama menu</span>
        <input
          type="text"
          id="newMenuName"
          placeholder="Contoh: Coklat Keju"
          required
        >
      </label>

      <label class="field">
        <span>Jenis martabak</span>
        <input type="text" value="Martabak ${type}" disabled>
      </label>

      <label class="field">
        <span>Harga jual (Rp)</span>
        <input
          type="text"
          id="newMenuPrice"
          placeholder="Contoh: 25.000"
          inputmode="numeric"
          required
        >
      </label>

      <button type="submit" class="btn full">
        Simpan Menu
      </button>

      <button
        type="button"
        class="btn secondary full"
        data-action="cancel-add-menu">
        Batal
      </button>
    </form>
  `;

    const priceInput = document.getElementById('newMenuPrice');

  if (priceInput) {
    priceInput.addEventListener('input', function() {
      const digits = this.value.replace(/\D/g, '');

      this.value = digits
        ? Number(digits).toLocaleString('id-ID')
        : '';
    });
  }
}

function deleteMenu(id) {
  const item = menuItems.find(
    menu => Number(menu.id) === Number(id)
  );

  if (!item) {
    toast('Menu tidak ditemukan.');
    return;
  }

  const oldModal = document.getElementById('deleteMenuModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'deleteMenuModal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.60);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 9999;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="
      background: var(--panel, #ffffff);
      color: var(--text, #1f2937);
      width: 100%;
      max-width: 360px;
      border-radius: 22px;
      padding: 26px 22px 22px;
      box-shadow: 0 24px 70px rgba(0,0,0,.22);
      text-align: center;
      animation: deleteModalIn .2s ease-out;
    ">
      <div style="
        width: 68px;
        height: 68px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #fee2e2;
        color: #dc2626;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
      ">${uiIcon('trash', 30)}</div>

      <h3 style="
        margin: 0 0 8px;
        font-size: 21px;
        font-weight: 750;
      ">Hapus Menu?</h3>

      <p style="
        margin: 0 0 20px;
        font-size: 14px;
        line-height: 1.6;
        color: var(--muted, #6b7280);
      ">
        Kamu yakin ingin menghapus menu ini?
        Menu yang dihapus tidak akan muncul lagi
        dalam pilihan penjualan.
      </p>

      <div style="
        padding: 14px;
        border: 1px solid var(--border, #e5e7eb);
        border-radius: 14px;
        text-align: left;
        margin-bottom: 22px;
      ">
        <div style="font-weight: 700; margin-bottom: 5px;">
          ${esc(item.name)}
        </div>
        <div style="
          font-size: 13px;
          color: var(--muted, #6b7280);
          margin-bottom: 8px;
        ">Martabak ${esc(item.type)}</div>
        <div style="
          font-size: 17px;
          color: #dc2626;
          font-weight: 750;
        ">${fmt(item.price)}</div>
      </div>

      <div style="display:flex; gap:10px;">
        <button
          type="button"
          data-delete-cancel
          style="
            flex:1;
            padding:12px 8px;
            border:1px solid var(--border, #d1d5db);
            border-radius:12px;
            background:transparent;
            color:inherit;
            font-weight:650;
            cursor:pointer;
          ">
          Batal
        </button>

        <button
          type="button"
          data-delete-confirm
          style="
            flex:1;
            padding:12px 8px;
            border:none;
            border-radius:12px;
            background:#dc2626;
            color:white;
            font-weight:700;
            cursor:pointer;
          ">
          Ya, Hapus
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal || e.target.closest('[data-delete-cancel]')) {
      modal.remove();
      return;
    }

    if (e.target.closest('[data-delete-confirm]')) {
      const index = menuItems.findIndex(
        menu => Number(menu.id) === Number(id)
      );

      if (index === -1) {
        modal.remove();
        toast('Menu tidak ditemukan.');
        return;
      }

      menuItems.splice(index, 1);

      localStorage.setItem(
        'martabakMenuItems',
        JSON.stringify(menuItems)
      );

      modal.remove();
      showMenuCategory(selectedMenuCategory);
      toast('Menu berhasil dihapus!');
    }
  });

  const escapeHandler = function(e) {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };

  document.addEventListener('keydown', escapeHandler);
}

// MENAMPILKAN HALAMAN
let lastRenderedTab = null;

function render() {
  sync();

  document.querySelectorAll('.nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );

  const content = document.getElementById('content');
  const shouldAnimatePage = lastRenderedTab !== tab;

  content.classList.remove('page-enter');
  
  content.innerHTML =
    tab === 'home' ? home() :
    tab === 'sales' ? salesPage() :
    tab === 'editSale' ? editSalePage() :
    tab === 'finance' ? finance() :
    tab === 'reports' ? reports() :
    tab === 'expenseForm' ? expenseForm() :
    menuCategoryPage ? menuCategoryPageView() :
    settings();

  // Animasi hanya saat berpindah tab, bukan saat grafik/rincian diperbarui
  if (shouldAnimatePage) {
    void content.offsetWidth;
    content.classList.add('page-enter');
  }
  lastRenderedTab = tab;

  if (tab === 'sales') setupSaleForm();
  if (tab === 'editSale') setupEditSaleForm();
}

function menuCategoryPageView() {
  return `
    <div style="
      display:flex;
      align-items:center;
      gap:12px;
      margin-bottom:20px;
    ">
      <button type="button" class="btn secondary" data-action="back-menu-category-settings" aria-label="Kembali ke Pengaturan" style="font-size:22px; padding:6px 13px;">‹</button>

      <div>
        <h2 style="margin:0;font-size:20px;">
          Edit Menu Martabak
        </h2>
        <p style="
          margin:4px 0 0;
          color:#6b7280;
          font-size:13px;
        ">
          Pilih jenis martabak yang ingin diedit
        </p>
      </div>
    </div>

    <div class="panel">
      <button
        class="btn full"
        data-action="menu-category"
        data-type="Asin">
        ${uiIcon('egg', 18)} Edit Martabak Asin
      </button>

      <button
        class="btn secondary full"
        data-action="menu-category"
        data-type="Manis">
        ${uiIcon('pancake', 18)} Edit Martabak Manis
      </button>
    </div>
  `;
}

// FORM PENJUALAN

function setupSaleForm() {
  const container = document.getElementById('orderItems');
  const addButton = document.getElementById('addOrderItem');
  const payment = document.getElementById('payment');
  const total = document.getElementById('saleTotal');

  if (!container || !addButton || !payment || !total) return;

  function updateTotal() {
    let sum = 0;

    container.querySelectorAll('.order-item').forEach(row => {
      const qty = Number(row.querySelector('.item-qty').value) || 0;

      const priceText = row.querySelector('.item-price').value;
      const price = Number(priceText.replace(/[^\d]/g, '')) || 0;

      sum += qty * price;
    });

    if (payment.value === 'QRIS') sum += 1000;
    total.textContent = fmt(sum);
  }

  payment.addEventListener('change', updateTotal);

  function addItem() {
    const row = document.createElement('div');
    row.className = 'order-item panel';
    row.style.marginBottom = '12px';

    row.innerHTML = `
      <label class="field">
        <span>Jenis martabak</span>
        <select class="item-type" required>
          <option value="" selected disabled>Pilih jenis martabak</option>
          <option value="Manis">Manis</option>
          <option value="Asin">Asin</option>
        </select>
      </label>

      <label class="field">
        <span>Varian / rasa</span>
        <select class="item-flavor" required disabled>
          <option value="" selected>Pilih jenis martabak dulu</option>
        </select>
      </label>

      <div class="two">
        <label class="field">
          <span>Jumlah (buah)</span>
          <input class="item-qty" type="number"
            min="1" step="1" value="1" required>
        </label>

        <label class="field">
          <span>Harga satuan (Rp)</span>
          <input class="item-price" type="text"
            value="" readonly>
        </label>
      </div>

      <button class="btn danger remove-item"
        type="button">Hapus item</button>
    `;

    container.appendChild(row);

    const type = row.querySelector('.item-type');
    const flavor = row.querySelector('.item-flavor');
    const qty = row.querySelector('.item-qty');
    const price = row.querySelector('.item-price');
    const remove = row.querySelector('.remove-item');

    type.addEventListener('change', () => {
      const items = menuItems.filter(item => item.type === type.value);

      flavor.innerHTML =
        '<option value="" selected disabled>Pilih varian/rasa</option>' +
        items.map(item =>
          `<option value="${item.id}">${esc(item.name)}</option>`
        ).join('');

      flavor.disabled = false;
      price.value = '';
      updateTotal();
    });

    flavor.addEventListener('change', () => {
      const selected = menuItems.find(
        item => item.id === Number(flavor.value)
      );

      price.value = selected ? fmt(selected.price) : '';
      updateTotal();
    });

    qty.addEventListener('input', updateTotal);

    remove.addEventListener('click', () => {
      row.remove();
      updateTotal();
    });

    updateTotal();
  }

  addButton.addEventListener('click', addItem);

  addItem();
}

function updateTotal() {
  const qty = Number(document.getElementById('qty')?.value || 0);
  const price = Number(document.getElementById('price')?.value || 0);
  const el = document.getElementById('saleTotal');

  if (el) el.textContent = fmt(qty*price);
}

// NOTIFIKASI
function toast(msg) {
  const t = document.getElementById('toast');

  if (!t) {
    alert(msg);
    return;
  }

  t.textContent = msg;
  t.style.display = 'block';

  setTimeout(() => {
    t.style.display = 'none';
  },2400);
}

// NAVIGASI MENU
function editSale(id) {
  const p = transactions.find(t => t.id === id);
  if (!p) return;

  editingSaleId = id;
  tab = 'editSale';
  render();
}

function editSalePage() {
  const p = transactions.find(t => t.id === editingSaleId);

  if (!p) {
    tab = 'sales';
    return salesPage();
  }

  const items = transactionItems(p);

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <button type="button" class="btn secondary" data-action="back-edit-sale" aria-label="Kembali" style="font-size:22px;padding:6px 13px;">‹</button>
      <div><h2 style="margin:0;font-size:20px;">Edit penjualan</h2><div class="hint" style="margin-top:4px;">Ubah semua martabak dalam pesanan</div></div>
    </div>

    <div class="panel">
      <div class="notice" style="margin-bottom:16px">
        <strong>Data transaksi sebelumnya</strong>
        <div style="margin-top:8px">
          Jumlah jenis martabak: ${items.length} item
        </div>
        <div style="margin-top:4px">
          Total: ${fmt(transactionTotal(p))}
        </div>
      </div>

      <form id="editSaleForm">
        <div id="editOrderItems">
          ${items.map(item => `
            <div class="order-item panel" style="margin-bottom:12px">
              <label class="field">
                <span>Jenis martabak</span>
                <select class="item-type" required>
                  <option value="Manis" ${item.type === 'Manis' ? 'selected' : ''}>Manis</option>
                  <option value="Asin" ${item.type === 'Asin' ? 'selected' : ''}>Asin</option>
                </select>
              </label>

              <label class="field">
                <span>Varian / rasa</span>
                <select class="item-flavor" required>
                  ${menuItems
                    .filter(m => m.type === item.type)
                    .map(m => `
                      <option value="${m.id}"
                        ${m.name === item.name ? 'selected' : ''}>
                        ${esc(m.name)}
                      </option>
                    `).join('')}
                </select>
              </label>

              <div class="two">
                <label class="field">
                  <span>Jumlah (buah)</span>
                  <input class="item-qty" type="number"
                    min="1" step="1"
                    value="${item.qty}" required>
                </label>

                <label class="field">
                  <span>Harga satuan (Rp)</span>
                  <input class="item-price" type="text"
                    value="${fmt(item.price)}" readonly>
                </label>
              </div>

              <button class="btn danger remove-edit-item"
                type="button">Hapus item</button>
            </div>
          `).join('')}
        </div>

        <button class="btn secondary full"
          type="button" id="addEditOrderItem">
          + Tambah martabak
        </button>

        <div class="totalbox" style="margin-top:16px">
          <span>Total penjualan</span>
          <strong id="editTotal">${fmt(transactionTotal(p))}</strong>
        </div>

        <button class="btn full" type="submit"
          style="margin-top:16px">
          Simpan perubahan
        </button>

      </form>
    </div>
  `;
}

function setupEditSaleForm() {
  const container = document.getElementById('editOrderItems');
  const addButton = document.getElementById('addEditOrderItem');
  const total = document.getElementById('editTotal');

  if (!container || !addButton || !total) return;

  function updateTotal() {
    let sum = 0;

    container.querySelectorAll('.order-item').forEach(row => {
      const qty = Number(row.querySelector('.item-qty').value) || 0;
      const menuId = Number(row.querySelector('.item-flavor').value);
      const menu = menuItems.find(m => m.id === menuId);

      if (menu) {
        sum += qty * menu.price;
      }
    });

    total.textContent = fmt(sum);
  }

  function updatePrice(row) {
    const flavor = row.querySelector('.item-flavor');
    const price = row.querySelector('.item-price');

    const menu = menuItems.find(
      m => m.id === Number(flavor.value)
    );

    price.value = menu ? fmt(menu.price) : '';
    updateTotal();
  }

  function updateFlavors(row) {
    const type = row.querySelector('.item-type');
    const flavor = row.querySelector('.item-flavor');

    const oldMenu = menuItems.find(
      m => m.id === Number(flavor.value)
    );

    const oldName = oldMenu ? oldMenu.name : '';

    const available = menuItems.filter(
      m => m.type === type.value
    );

    flavor.innerHTML = available.map(m => `
      <option value="${m.id}">${esc(m.name)}</option>
    `).join('');

    const match = available.find(m => m.name === oldName);

    if (match) {
      flavor.value = String(match.id);
    } else if (available.length) {
      flavor.value = String(available[0].id);
    }

    updatePrice(row);
  }

  function connectRow(row) {
    row.querySelector('.item-type').addEventListener(
      'change',
      () => updateFlavors(row)
    );

    row.querySelector('.item-flavor').addEventListener(
      'change',
      () => updatePrice(row)
    );

    row.querySelector('.item-qty').addEventListener(
      'input',
      updateTotal
    );

    row.querySelector('.remove-edit-item').addEventListener(
      'click',
      () => {
        row.remove();
        updateTotal();
      }
    );

    updatePrice(row);
  }

  function addItem() {
    const row = document.createElement('div');
    row.className = 'order-item panel';
    row.style.marginBottom = '12px';

    row.innerHTML = `
      <label class="field">
        <span>Jenis martabak</span>
        <select class="item-type" required>
          <option value="Manis">Manis</option>
          <option value="Asin">Asin</option>
        </select>
      </label>

      <label class="field">
        <span>Varian / rasa</span>
        <select class="item-flavor" required></select>
      </label>

      <div class="two">
        <label class="field">
          <span>Jumlah (buah)</span>
          <input class="item-qty" type="number"
            min="1" step="1" value="1" required>
        </label>

        <label class="field">
          <span>Harga satuan (Rp)</span>
          <input class="item-price" type="text"
            value="" readonly>
        </label>
      </div>

      <button class="btn danger remove-edit-item"
        type="button">Hapus item</button>
    `;

    container.appendChild(row);
    connectRow(row);
    updateFlavors(row);
  }

  container.querySelectorAll('.order-item').forEach(connectRow);

  addButton.addEventListener('click', addItem);

  updateTotal();
}

function updateEditTotal() {
  const qty = Number(document.getElementById('editQty')?.value || 0);
  const price = Number(document.getElementById('editPrice')?.value || 0);
  const total = document.getElementById('editTotal');

  if (total) total.textContent = fmt(qty * price);
}

document.querySelector('.nav').addEventListener('click',e => {
  const b = e.target.closest('button[data-tab]');

  if (b) {
    tab = b.dataset.tab;
    render();
  }
});

// AKSI TOMBOL
document.getElementById('content').addEventListener('click',e => {

  const breakdownPoint = e.target.closest('[data-home-breakdown]');
  if (breakdownPoint) {
    selectedHomeBreakdown = breakdownPoint.dataset.homeBreakdown;
    render();
    return;
  }

  const breakdownBack = e.target.closest('[data-home-breakdown-back]');
  if (breakdownBack) {
    selectedHomeBreakdown = null;
    render();
    return;
  }

  const detailPoint = e.target.closest('[data-detail-day]');
  if (detailPoint) {
    selectedDetailDate = detailPoint.dataset.detailDay;
    selectedHomeBreakdown = null;
    render();
    return;
  }

  const revenuePoint = e.target.closest('[data-revenue-day]');
  if (revenuePoint) {
    selectedRevenueDate = revenuePoint.dataset.revenueDay;
    render();
    return;
  }

  const b = e.target.closest('button');
  if (!b) return;

  if (b.dataset.action === 'open-home-detail') {
    showHomeDetail = true;
    homeDetailType = b.dataset.detailType || 'payment';
    detailMonthOffset = 0;
    selectedDetailDate = null;
    showMonthlyRevenue = false;
    render();
    return;
  }
  if (b.dataset.action === 'close-home-detail') {
    showHomeDetail = false;
    selectedDetailDate = null;
    render();
    return;
  }
  if (b.dataset.action === 'detail-prev-month') { detailMonthOffset -= 1; selectedDetailDate = null; render(); return; }
  if (b.dataset.action === 'detail-next-month') { if (detailMonthOffset < 0) detailMonthOffset += 1; selectedDetailDate = null; render(); return; }
  if (b.dataset.action === 'open-monthly-revenue') {
    showMonthlyRevenue = true;
    revenueMonthOffset = 0;
    selectedRevenueDate = null;
    render();
    return;
  }
  if (b.dataset.action === 'close-monthly-revenue') {
    showMonthlyRevenue = false;
    selectedRevenueDate = null;
    render();
    return;
  }
  if (b.dataset.action === 'back-edit-sale') {
    tab = 'sales';
    render();
    return;
  }
  if (b.dataset.action === 'revenue-prev-month') {
    revenueMonthOffset -= 1;
    selectedRevenueDate = null;
    render();
    return;
  }
  if (b.dataset.action === 'revenue-next-month') {
    if (revenueMonthOffset < 0) revenueMonthOffset += 1;
    selectedRevenueDate = null;
    render();
    return;
  }
  
  if (b.dataset.action === 'delete-menu') {
    deleteMenu(Number(b.dataset.id));
    return;
  }
  
  if (b.dataset.action === 'add-menu') {
    selectedMenuCategory = b.dataset.type;
    addMenu(selectedMenuCategory);
    return;
  }

  if (b.dataset.action === 'cancel-add-menu') {
    showMenuCategory(selectedMenuCategory);
    return;
  }
  
  if (b.dataset.action === 'open-menu-category') {
    menuCategoryPage = true;
    render();
    return;
  }

  if (b.dataset.action === 'menu-category') {
    selectedMenuCategory = b.dataset.type;
   showMenuCategory(selectedMenuCategory);
    return;
  }

  if (b.dataset.action === 'back-menu-category') {
    menuCategoryPage = true;
    render();
    return;
  }

  if (b.dataset.action === 'back-menu-category-settings') {
    menuCategoryPage = false;
    render();
    return;
  }
  
  if (b.dataset.action === 'edit-menu') {
  editMenu(Number(b.dataset.id));
  return;
  }

  if (b.dataset.action === 'cancel-edit-menu') {
    showMenuCategory(selectedMenuCategory);
   return;
  }

  if (b.dataset.go) {
    tab = b.dataset.go;
    render();
  }

  if (b.dataset.filter) {
    filter = b.dataset.filter;
    render();
  }

  if (b.dataset.action==='add-exp') {
    tab = 'expenseForm';
    render();
  }

  if (b.dataset.action === 'add-exp-item') {
    const container = document.getElementById('expenseItems');

    if (!container) return;

    const row = document.createElement('div');
    row.className = 'expense-item-row';

    row.innerHTML = `
      <label class="field">
        <span>Nama barang</span>
        <input
          type="text"
          class="exp-item-name"
          placeholder="Contoh: Tepung"
          required
        >
      </label>

      <label class="field">
        <span>Nominal (Rp)</span>
        <input
          type="text"
          class="exp-item-amount"
          inputmode="numeric"
          placeholder="25.000"
          autocomplete="off"
          required
        >
      </label>

      <button
        type="button"
        class="btn danger full"
        data-action="remove-exp-item">
        Hapus barang
      </button>
    `;

    container.appendChild(row);
  }
  else if (b.dataset.action === 'remove-exp-item') {
    const rows = document.querySelectorAll(
      '#expenseItems .expense-item-row'
    );

    if (rows.length <= 1) {
      toast('Minimal harus ada satu barang.');
      return;
    }

    b.closest('.expense-item-row').remove();
  }

  if (b.dataset.action==='back-exp') {
    tab = 'finance';
    render();
  }

    if (b.dataset.action === 'edit-sale') {
    editSale(Number(b.dataset.id));
    return;
  }

  if (b.dataset.action === 'delete-sale') {
  const id = Number(b.dataset.id);
  const p = transactions.find(t => t.id === id);

  if (!p) {
    toast('Transaksi tidak ditemukan.');
    return;
  }

  const oldModal = document.getElementById('deleteSaleModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'deleteSaleModal';
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, .60);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    z-index: 10000;
    backdrop-filter: blur(4px);
  `;

  modal.innerHTML = `
    <div style="
      width: 100%;
      max-width: 360px;
      box-sizing: border-box;
      padding: 26px 22px 22px;
      border-radius: 22px;
      background: var(--panel, #fff);
      color: var(--text, #1f2937);
      box-shadow: 0 24px 70px rgba(0,0,0,.22);
      text-align: center;
    ">
      <div style="
        width: 68px;
        height: 68px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #fee2e2;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 30px;
      ">${uiIcon('trash', 30)}</div>

      <h3 style="font-size:21px;margin:0 0 8px;">
        Hapus Transaksi?
      </h3>

      <p style="
        margin:0 0 20px;
        font-size:14px;
        line-height:1.6;
        color:var(--muted,#6b7280);
      ">
        Apakah kamu yakin ingin menghapus transaksi ini?
        Tindakan ini tidak bisa dibatalkan.
      </p>

      <div style="
        border:1px solid var(--border,#e5e7eb);
        border-radius:14px;
        padding:14px;
        margin-bottom:22px;
        text-align:left;
      ">
        <div style="font-weight:750;font-size:16px;">
          ${esc(p.name)}
        </div>

        <div style="
          font-size:13px;
          color:var(--muted,#6b7280);
          margin-top:5px;
        ">
          ${p.qty} buah × ${fmt(p.price)}
        </div>

        <div style="
          font-size:20px;
          color:#dc2626;
          font-weight:800;
          margin-top:10px;
        ">
          ${fmt(p.qty * p.price)}
        </div>
      </div>

      <div style="display:flex;gap:10px;">
        <button
          type="button"
          data-sale-cancel
          style="
            flex:1;
            padding:12px 8px;
            border:1px solid var(--border,#d1d5db);
            border-radius:12px;
            background:transparent;
            color:inherit;
            font-weight:650;
            cursor:pointer;
          ">
          Batal
        </button>

        <button
          type="button"
          data-sale-confirm
          style="
            flex:1;
            padding:12px 8px;
            border:0;
            border-radius:12px;
            background:#dc2626;
            color:white;
            font-weight:700;
            cursor:pointer;
          ">
          Ya, Hapus
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (
      e.target === modal ||
      e.target.closest('[data-sale-cancel]')
    ) {
      modal.remove();
      return;
    }

    if (e.target.closest('[data-sale-confirm]')) {
      const exists = transactions.some(t => t.id === id);

      if (!exists) {
        modal.remove();
        toast('Transaksi tidak ditemukan.');
        return;
      }

      transactions = transactions.filter(t => t.id !== id);
      saveTransactions();

      modal.remove();
      render();
      toast('Transaksi berhasil dihapus!');
    }
  });

  const escapeHandler = e => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escapeHandler);
    }
  };

  document.addEventListener('keydown', escapeHandler);
}

if (b.dataset.action === 'cancel-edit') {
  editingSaleId = null;
  tab = 'sales';
  render();
}

if (b.dataset.action === 'edit-exp') {
  editExpense(Number(b.dataset.index));
}

if (b.dataset.action === 'delete-exp') {
  const index = Number(b.dataset.index);
  const e = expenses[index];

  if (!e) return;

  const oldModal = document.getElementById('deleteExpenseModal');
  if (oldModal) oldModal.remove();

  const modal = document.createElement('div');
  modal.id = 'deleteExpenseModal';
  modal.innerHTML = `
    <div style="
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      z-index:9999;
    ">
      <div style="
        background:white;
        width:100%;
        max-width:360px;
        border-radius:20px;
        padding:24px;
        text-align:center;
        box-shadow:0 15px 40px rgba(0,0,0,.2);
      ">
        <div style="
          width:64px;
          height:64px;
          border-radius:50%;
          background:#fee2e2;
          color:#dc2626;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:30px;
          margin:0 auto 16px;
        ">${uiIcon('trash', 30)}</div>

        <h3 style="margin:0 0 10px;color:#1f2937;">
          Hapus Pengeluaran?
        </h3>

        <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">
          Kamu yakin ingin menghapus pengeluaran ini?
        </p>

        <div style="
          background:#f9fafb;
          border-radius:12px;
          padding:14px;
          margin:16px 0 22px;
          text-align:left;
        ">
          <div style="font-weight:600;color:#1f2937;">
            ${esc(e.name)}
          </div>
          <div style="
            color:#dc2626;
            font-weight:700;
            margin-top:6px;
          ">
            ${fmt(e.amount)}
          </div>
        </div>

        <div style="display:flex;gap:10px;">
          <button type="button" data-exp-cancel style="
            flex:1;
            padding:12px;
            border:1px solid #d1d5db;
            border-radius:10px;
            background:white;
            color:#374151;
            font-weight:600;
            cursor:pointer;
          ">Batal</button>

          <button type="button" data-exp-confirm style="
            flex:1;
            padding:12px;
            border:none;
            border-radius:10px;
            background:#dc2626;
            color:white;
            font-weight:600;
            cursor:pointer;
          ">Ya, Hapus</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('[data-exp-cancel]').onclick = () => {
    modal.remove();
  };

  modal.querySelector('[data-exp-confirm]').onclick = () => {
    expenses.splice(index, 1);
    saveExpenses();
    modal.remove();
    render();
    toast('Pengeluaran berhasil dihapus!');
  };
}

  if (b.dataset.action==='save-settings') {
    toast('Pengaturan disimpan untuk sesi ini.');
  }

});

// FORMAT NOMINAL PENGELUARAN

document.getElementById('content').addEventListener('input', e => {
  if (e.target.classList.contains('exp-item-amount')) {
    e.target.value = formatNominal(e.target.value);
  }

  if (
    e.target.classList.contains('exp-item-name') ||
    e.target.classList.contains('exp-item-amount')
  ) {
    const container = document.getElementById('expenseItems');

    if (!container) return;

    const amounts = container.querySelectorAll('.exp-item-amount');

    const total = [...amounts].reduce((sum, input) => {
      const amount = Number(input.value.replace(/\./g, ''));
      return sum + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const grandTotal = document.getElementById('expGrandTotal');

    if (grandTotal) {
      grandTotal.textContent = fmt(total);
    }
  }
});

 // MEMILIH TANGGAL HISTORI
document.getElementById('content').addEventListener('change', e => {
  if (
    e.target.id === 'expenseStartDate' ||
    e.target.id === 'expenseEndDate'
  ) {
    const startInput = document.getElementById('expenseStartDate');
    const endInput = document.getElementById('expenseEndDate');

    selectedExpenseStartDate = startInput?.value || todayKey();
    selectedExpenseEndDate = endInput?.value || todayKey();

    render();
    return;
  }

  if (e.target.id === 'historyDate') {
    selectedHistoryDate = e.target.value || todayKey();
    render();
    return;
  }

  if (
    e.target.id === 'reportStartDate' ||
    e.target.id === 'reportEndDate'
  ) {
    const start = document.getElementById('reportStartDate')?.value;
    const end = document.getElementById('reportEndDate')?.value;

    if (start) reportStartDate = start;
    if (end) reportEndDate = end;

    render();
  }
});

// MENYIMPAN TRANSAKSI
document.getElementById('content').addEventListener('submit',e => {

  if (e.target.id === 'addMenuForm') {
    e.preventDefault();

    const type = document.getElementById('newMenuType').value;
    const name = document.getElementById('newMenuName').value.trim();
    const price = Number(
      document.getElementById('newMenuPrice').value.replace(/\./g, '')
    );

    if (!['Asin', 'Manis'].includes(type) ||
        !name ||
        !Number.isFinite(price) ||
        price <= 0 ||
        !Number.isInteger(price)) {
      toast('Periksa kembali nama dan harga menu.');
      return;
    }

    const duplicate = menuItems.some(item =>
      item.type === type &&
      item.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      toast('Nama menu tersebut sudah ada di kategori ini.');
      return;
    }

    const newId = Math.max(0, ...menuItems.map(item => Number(item.id) || 0)) + 1;

    menuItems.push({
      id: newId,
      name: name,
      type: type,
      price: price
    });

    localStorage.setItem('martabakMenuItems', JSON.stringify(menuItems));

    selectedMenuCategory = type;
    showMenuCategory(type);
    toast('Menu baru berhasil ditambahkan!');
    return;
  }


  if (e.target.id === 'editMenuForm') {
    e.preventDefault();

    const id = Number(document.getElementById('editMenuId').value);
    const item = menuItems.find(menu => menu.id === id);

    const name = document.getElementById('editMenuName').value.trim();
    const type = document.getElementById('editMenuType').value;
    const price = Number(
      document.getElementById('editMenuPrice').value.replace(/\./g, '')
    );

    if (!item) return;

    if (!name || !['Asin', 'Manis'].includes(type) ||
        !Number.isFinite(price) || price <= 0) {
      toast('Periksa kembali nama, jenis, dan harga menu.');
      return;
    }

    item.name = name;
    item.type = type;
    item.price = price;

    localStorage.setItem('martabakMenuItems', JSON.stringify(menuItems));

    showMenuCategory(selectedMenuCategory);
    toast('Menu berhasil diperbarui!');
    return;
  }
  
if (e.target.id === 'editSaleForm') {
  e.preventDefault();

  const p = transactions.find(t => t.id === editingSaleId);
  if (!p) return;

  const container = document.getElementById('editOrderItems');
  const rows = [...container.querySelectorAll('.order-item')];

  if (rows.length === 0) {
    toast('Pesanan harus memiliki minimal satu martabak.');
    return;
  }

  const items = [];

  for (const row of rows) {
    const type = row.querySelector('.item-type').value;
    const menuId = Number(row.querySelector('.item-flavor').value);
    const qty = Number(row.querySelector('.item-qty').value);

    const menu = menuItems.find(m => m.id === menuId);

    if (!menu || menu.type !== type) {
      toast('Pilih jenis dan varian martabak dengan benar.');
      return;
    }

    if (!Number.isInteger(qty) || qty < 1) {
      toast('Jumlah setiap martabak minimal 1 buah.');
      return;
    }

    items.push({
      name: menu.name,
      type: menu.type,
      qty: qty,
      price: menu.price
    });
  }

  // Simpan semua item dalam transaksi yang sama
  p.items = items;

  // Pertahankan data ringkasan agar cocok dengan kode lama
  p.name = items.map(item => item.name).join(', ');
  p.type = items.length === 1 ? items[0].type : 'Campuran';
  p.qty = items.reduce((sum, item) => sum + item.qty, 0);
  p.price = items.reduce(
    (sum, item) => sum + item.qty * item.price, 0
  );

  saveTransactions();

  editingSaleId = null;
  tab = 'sales';
  render();

  toast('Transaksi berhasil diedit!');
}

if (e.target.id === 'saleForm') {
  e.preventDefault();

  const container = document.getElementById('orderItems');
  const payment = document.getElementById('payment').value;
  const rows = [...container.querySelectorAll('.order-item')];

  if (rows.length === 0) {
    toast('Tambahkan minimal satu martabak.');
    return;
  }

  const items = [];

  for (const row of rows) {
    const type = row.querySelector('.item-type').value;
    const flavorValue = row.querySelector('.item-flavor').value;
    const qty = Number(row.querySelector('.item-qty').value);

    const menu = menuItems.find(
      item => item.id === Number(flavorValue)
    );

    if (!type || !menu || menu.type !== type) {
      toast('Pilih jenis dan varian martabak pada semua item.');
      return;
    }

    if (!Number.isInteger(qty) || qty < 1) {
      toast('Jumlah setiap martabak minimal 1 buah.');
      return;
    }

    items.push({
      name: menu.name,
      type: menu.type,
      qty: qty,
      price: menu.price
    });
  }

  const now = new Date();
  const today = todayKey();

  transactions.push({
    id: nextId++,
    items: items,
    name: items.map(item => item.name).join(', '),
    type: 'Campuran',
    qty: items.reduce((sum, item) => sum + item.qty, 0),
    price: items.reduce(
      (sum, item) => sum + item.qty * item.price, 0
    ),
    payment: payment,
    qrisFee: payment === 'QRIS' ? 1000 : 0,
    date: today,
    createdAt: now.toISOString()
  });

    saveTransactions();
    selectedHistoryDate = today;
    tab = 'sales';
    render();

    toast('Penjualan berhasil dicatat!');
  }


if (e.target.id === 'expenseForm') {
  e.preventDefault();

  const category = document.getElementById('expCat').value;
  const container = document.getElementById('expenseItems');

  const rows = [...container.querySelectorAll('.expense-item-row')];

  if (rows.length === 0) {
    toast('Tambahkan minimal satu barang pengeluaran.');
    return;
  }

  const items = [];

  for (const row of rows) {
    const name = row.querySelector('.exp-item-name').value.trim();
    const amountText = row.querySelector('.exp-item-amount').value;
    const amount = Number(amountText.replace(/\./g, ''));

    if (!name || !Number.isFinite(amount) || amount < 1) {
      toast('Isi nama barang dan nominal dengan benar.');
      return;
    }

    items.push({
      name: name,
      amount: amount
    });
  }
  
  const editIndex = e.target.dataset.editIndex;

  if (editIndex !== '') {
    const index = Number(editIndex);
    const oldExpense = expenses[index];

    if (!oldExpense) {
      toast('Pengeluaran tidak ditemukan.');
      return;
    }

    expenses[index] = {
      ...oldExpense,
      category: category,
      items: items,
      name: items.map(item => item.name).join(', '),
      amount: items.reduce(
        (sum, item) => sum + item.amount,
        0
      )
    };

    saveExpenses();
    tab = 'finance';
    render();

    toast('Pengeluaran berhasil diperbarui!');
    return;
  }

  expenses.push({
    id: nextId++,
    category: category,
    items: items,
    name: items.map(item => item.name).join(', '),
    amount: items.reduce(
      (sum, item) => sum + item.amount,
      0
    ),
    date: todayKey(),
    createdAt: Date.now()
  });

  saveExpenses();
  tab = 'finance';
  render();

  toast('Pengeluaran berhasil dicatat!');

}
});

// MULAI APLIKASI
render();

function totalSalesAllTime() {
  return transactions.reduce(
    (sum, t) => sum + transactionTotal(t),
    0
  );
}

function totalNetAllTime() {
  return totalSalesAllTime() -
    expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}
