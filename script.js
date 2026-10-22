
const fmt = n => 'Rp' + Math.round(n).toLocaleString('id-ID');

let tab = 'home';
let menuCategoryPage = false;
let filter = 'Semua';
let selectedHistoryDate = todayKey();
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

// DATA PENGELUARAN

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
    expenses = [
      {
        name: 'Belanja bahan baku',
        category: 'Bahan baku',
        amount: 220000,
        date: todayKey(),
        createdAt: Date.now() - 1000
      },
      {
        name: 'Gas dan operasional',
        category: 'Operasional',
        amount: 80000,
        date: todayKey(),
        createdAt: Date.now()
      }
    ];

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
    .sort((a, b) => b.createdAt - a.createdAt);
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

function totalSales() {
  return todayTransactions().reduce(
    (sum,t) => sum + t.price*t.qty, 0
  );
}

function totalSalesAllTime() {
  return transactions.reduce(
    (sum, t) => sum + (Number(t.price) || 0) * (Number(t.qty) || 0),
    0
  );
}

function totalQty() {
  return todayTransactions().reduce(
    (sum,t) => sum + t.qty, 0
  );
}

function paymentCount(method) {
  return todayTransactions().filter(t =>
    (t.payment || t.method || '').toLowerCase() === method.toLowerCase()
  ).length;
}

function totalExp() {
  return todayExpenses().reduce(
    (sum, e) => sum + e.amount, 0
  );
}

function qtyType(type) {
  return todayTransactions()
    .filter(t => t.type === type)
    .reduce((sum,t) => sum+t.qty,0);
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

  return list.map(p => `
    <div class="product">
      <div class="food">
        ${p.type === 'Manis' ? '🥞' : '🍳'}
      </div>

      <div class="product-info">
        <strong>${esc(p.name)}</strong>
        <small>
          ${p.qty} buah × ${fmt(p.price)}
          ${p.createdAt ? ' · ' + timeLabel(p.createdAt) : ''}
          ${p.payment ? ' · ' + esc(p.payment) : ''}
        </small>
      </div>

      <div>
        <div class="price">${fmt(p.qty * p.price)}</div>

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
  `).join('');
}

// HALAMAN BERANDA
function home() {
  const m = qtyType('Manis');
  const a = qtyType('Asin');

  const tunai = paymentCount('Tunai');
  const qris = paymentCount('QRIS');
  const transfer = paymentCount('Transfer');

  const latest = [...todayTransactions()]
    .sort((x,y) => (y.createdAt||'').localeCompare(x.createdAt||''))
    .slice(0,5);

  return `
    <div class="metrics">
      <div class="metric">
        <div class="emoji">💵</div>
        <div class="label">Total omzet hari ini</div>
        <div class="value">${fmt(totalSales())}</div>
        <div class="hint">${dateLabel(todayKey())}</div>
      </div>

      <div class="metric">
        <div class="emoji">💳</div>
        <div class="label">Metode Pembayaran</div>

        <div style="display:flex; justify-content:space-between; gap:10px; margin-top:12px;">
          <div>
            <div class="hint">Tunai</div>
            <div class="value">${tunai}</div>
          </div>

          <div>
            <div class="hint">QRIS</div>
            <div class="value">${qris}</div>
          </div>

          <div>
            <div class="hint">Transfer</div>
            <div class="value">${transfer}</div>
          </div>
        </div>

        <div class="hint">Jumlah transaksi hari ini</div>
      </div>

      <div class="metric">
        <div class="emoji">🥞</div>
        <div class="label">Martabak manis</div>
        <div class="value">${m} buah</div>
        <div class="hint">Terjual hari ini</div>
      </div>

      <div class="metric">
        <div class="emoji">🍳</div>
        <div class="label">Martabak asin</div>
        <div class="value">${a} buah</div>
        <div class="hint">Terjual hari ini</div>
      </div>
    </div>

    ${heading(
      'Histori Penjualan',
      '5 transaksi terakhir hari ini',
      '<button class="btn secondary" data-go="sales">+ Tambah</button>'
    )}

    <div class="panel">${productRows(latest)}</div>

    <div class="notice">
      Omzet, jumlah terjual, dan metode pembayaran dihitung khusus untuk transaksi hari ini.
    </div>
  `;
}

// HALAMAN CATAT PENJUALAN DAN HISTORI
function salesPage() {
  const history = transactions
    .filter(t => t.date === selectedHistoryDate)
    .sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  const historyTotal = history.reduce(
    (sum,t) => sum+t.price*t.qty, 0
  );

  const historyQty = history.reduce(
    (sum,t) => sum+t.qty, 0
  );

  return `
    ${heading('Catat penjualan','Pilih jenis, rasa, dan jumlah')}

    <div class="panel">
      <form id="saleForm">
        <label class="field">
          <span>Jenis martabak</span>
          <select id="type" required>
            <option value="" selected disabled hidden>Pilih jenis martabak</option>
            <option value="Manis">Manis</option>
            <option value="Asin">Asin</option>
          </select>
        </label>

        <label class="field">
          <span>Varian / rasa</span>
          <select id="flavor"></select>
        </label>

        <div class="two">
          <label class="field">
            <span>Jumlah (buah)</span>
            <input id="qty" type="number" min="1" step="1"
              value="1" required>
          </label>

          <label class="field">
            <span>Harga satuan (Rp)</span>
            <input id="price" type="number" min="1" step="1"
              value="18000" readonly required>
          </label>
        </div>

        <label class="field">
          <span>Pembayaran</span>
          <select id="payment">
            <option>Tunai</option>
            <option>QRIS</option>
            <option>Transfer</option>
          </select>
        </label>

        <div class="totalbox">
          <span>Total penjualan</span>
          <strong id="saleTotal">Rp18.000</strong>
        </div>

        <button class="btn full" type="submit">
          Simpan penjualan
        </button>
      </form>
    </div>

    ${heading('Rincian penjualan','Pilih tanggal untuk mengecek penjualan sebelumnya')}

    <div class="panel">
      <label class="field">
        <span>Pilih tanggal dan bulan</span>
        <input id="historyDate" type="date"
          value="${selectedHistoryDate}" max="${todayKey()}">
      </label>

      <div class="line-item">
        <span>Tanggal penjualan</span>
        <strong>${dateLabel(selectedHistoryDate)}</strong>
      </div>

      <div class="line-item">
        <span>Total omzet</span>
        <strong>${fmt(historyTotal)}</strong>
      </div>

      <div class="line-item">
        <span>Total martabak terjual</span>
        <strong>${historyQty} buah</strong>
      </div>

      <div class="line-item">
        <span>Jumlah transaksi</span>
        <strong>${history.length} transaksi</strong>
      </div>

      ${productRows(history)}
    </div>
  `;
}

// HALAMAN KEUANGAN
function finance() {
  return `
    ${heading('Keuangan usaha','Ringkasan uang masuk dan keluar')}

    <div class="metrics">
      <div class="metric">
        <div class="emoji">↗️</div>
        <div class="label">Uang masuk hari ini</div>
        <div class="value">${fmt(totalSales())}</div>
      </div>

      <div class="metric">
        <div class="emoji">↘️</div>
        <div class="label">Uang keluar</div>
        <div class="value">${fmt(totalExp())}</div>
      </div>
    </div>

    <div class="totalbox">
      <span>Selisih arus kas</span>
      <strong>${fmt(totalSales()-totalExp())}</strong>
    </div>

    ${heading(
      'Pengeluaran',
      'Biaya usaha yang dicatat',
      '<button class="btn" data-action="add-exp">+ Tambah</button>'
    )}

    <div class="panel">
      
${todayExpenses().length ? todayExpenses().map(e => {
  const i = expenses.indexOf(e);

  return `
    <div class="product">
      <div class="food">🧾</div>

      <div class="product-info">
        <strong>${esc(e.name)}</strong>
        <small>${esc(e.category)}</small>
        <small>${timeLabel(e.createdAt)}</small>
      </div>

      <div>
        <div class="price">${fmt(e.amount)}</div>

        <div style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn secondary"
            data-action="edit-exp"
            data-index="${i}">
            Edit
          </button>

          <button class="btn danger"
            data-action="delete-exp"
            data-index="${i}">
            Hapus
          </button>
        </div>
      </div>
    </div>
  `;
}).join('') : '<div class="empty">Belum ada pengeluaran hari ini.</div>'}
</div>

    <div class="notice">
      Selisih ini merupakan ringkasan arus kas, bukan perhitungan laba bersih.
    </div>
  `;
}

// FORM PENGELUARAN

function expenseForm() {
  return `
    ${heading('Tambah pengeluaran', 'Catat biaya usaha')}

    <div class="panel">
      <form id="expenseForm">

        <label class="field">
          <span>Kategori pengeluaran</span>
          <select id="expCat" required>
            <option value="Bahan baku">Bahan baku</option>
            <option value="Operasional">Operasional</option>
            <option value="Gaji">Gaji</option>
            <option value="Sewa">Sewa</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </label>

        <label class="field">
          <span>Nama pengeluaran</span>
          <input
            id="expName"
            type="text"
            placeholder="Contoh: Beli telur"
            required
          >
        </label>

        <label class="field">
          <span>Nominal (Rp)</span>
          <input
            id="expAmount"
            type="text"
            inputmode="numeric"
            placeholder="Contoh: 10.000"
            autocomplete="off"
            required
          >
        </label>

        <button class="btn full" type="submit">
          Simpan pengeluaran
        </button>
      </form>
    </div>

    <button class="btn outline full" data-action="back-exp">
      Kembali ke keuangan
    </button>
  `;
}

function editExpense(index) {
  const e = expenses[index];
  if (!e) return;

  const categories = [
    'Bahan baku',
    'Operasional',
    'Gaji',
    'Sewa',
    'Lainnya'
  ];

  const escapeHTML = (text) =>
    String(text).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const categoryOptions = categories.map(category => `
    <option value="${category}"
      ${e.category === category ? 'selected' : ''}>
      ${category}
    </option>
  `).join('');

  document.getElementById('content').innerHTML = `
    <div class="heading-row">
      <div>
        <div class="heading">Edit pengeluaran</div>
        <div class="muted">Ubah detail pengeluaran usaha</div>
      </div>
    </div>

    <div class="panel">
      <form id="editExpenseForm">
        <label class="field">
          <span>Kategori pengeluaran</span>
          <select id="editExpCat" required>
            ${categoryOptions}
          </select>
        </label>

        <label class="field">
          <span>Nama pengeluaran</span>
          <input id="editExpName" type="text"
            value="${escapeHTML(e.name)}" required>
        </label>

        <label class="field">
          <span>Nominal (Rp)</span>
          <input id="editExpAmount" type="text"
            inputmode="numeric"
            value="${e.amount.toLocaleString('id-ID')}"
            required>
        </label>

        <button class="btn full" type="submit">
          Simpan perubahan
        </button>
      </form>
    </div>

    <button class="btn outline full" id="cancelEditExpense">
      Batal
    </button>
  `;

  document.getElementById('editExpAmount').addEventListener('input', event => {
    const digits = event.target.value.replace(/\D/g, '');
    event.target.value = digits
      ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      : '';
  });

  document.getElementById('editExpenseForm').addEventListener('submit', event => {
    event.preventDefault();

    const name = document.getElementById('editExpName').value.trim();
    const category = document.getElementById('editExpCat').value;
    const amount = Number(
      document.getElementById('editExpAmount').value.replace(/\D/g, '')
    );

    if (!name || !categories.includes(category) ||
        !Number.isFinite(amount) || amount < 1) {
      toast('Periksa kembali nama, kategori, dan nominal!');
      return;
    }

    e.name = name;
    e.category = category;
    e.amount = amount;
    saveExpenses();

    tab = 'finance';
    render();
    toast('Pengeluaran berhasil diedit!');
  });

  document.getElementById('cancelEditExpense').addEventListener('click', () => {
    tab = 'finance';
    render();
  });
}

function formatNominal(value) {
  const angka = value.replace(/\D/g, '');
  return angka.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// HALAMAN LAPORAN
function reports() {
  const validRange = reportStartDate <= reportEndDate;
  const dailyTransactions = validRange
    ? transactions.filter(p =>
        p.date >= reportStartDate &&
        p.date <= reportEndDate
      )
    : [];

  const list = dailyTransactions.filter(
    p => filter === 'Semua' || p.type === filter
  );

  const manis = dailyTransactions
    .filter(p => p.type === 'Manis')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const asin = dailyTransactions
    .filter(p => p.type === 'Asin')
    .reduce((sum, p) => sum + p.qty * p.price, 0);

  const variantTotals = {};
  list.forEach(p => {
    const name = p.name.trim();

    if (!variantTotals[name]) {
      variantTotals[name] = 0;
    }

    variantTotals[name] += Number(p.qty) || 0;
  });

  const rank = Object.entries(variantTotals)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  return `
    ${heading('Laporan usaha', 'Rekap berdasarkan rentang tanggal')}

    <div class="panel">
      <label class="field">
        <span>Tanggal awal</span>
        <input
          id="reportStartDate"
          type="date"
          value="${reportStartDate}"
          max="${todayKey()}"
        >
      </label>

      <label class="field">
        <span>Tanggal akhir</span>
        <input
          id="reportEndDate"
          type="date"
          value="${reportEndDate}"
          max="${todayKey()}"
        >
      </label>

      ${!validRange
        ? '<div class="notice">Tanggal akhir tidak boleh sebelum tanggal awal.</div>'
        : `<div class="notice">Periode: ${dateLabel(reportStartDate)} – ${dateLabel(reportEndDate)}</div>`
      }
    </div>

    <div class="chips">
      ${['Semua', 'Manis', 'Asin'].map(f =>
        `<button class="chip ${filter === f ? 'active' : ''}"
          data-filter="${f}">${f}</button>`
      ).join('')}
    </div>

    <div class="metrics">
      <div class="metric">
        <div class="label">Omzet terpilih</div>
        <div class="value">${fmt(list.reduce(
          (sum, p) => sum + p.qty * p.price, 0
        ))}</div>
      </div>
      <div class="metric">
        <div class="label">Jumlah terjual</div>
        <div class="value">${list.reduce(
          (sum, p) => sum + p.qty, 0
        )} buah</div>
      </div>
    </div>

    ${heading('Omzet per jenis', 'Sesuai periode yang dipilih')}
    <div class="panel">
      <div class="line-item">
        <span>Martabak manis</span><strong>${fmt(manis)}</strong>
      </div>
      <div class="line-item">
        <span>Martabak asin</span><strong>${fmt(asin)}</strong>
      </div>
    </div>

    ${heading('Varian terlaris', 'Urutan berdasarkan jumlah terjual')}
    <div class="panel">
      ${rank.length
        ? rank.map((p, i) =>
            `<div class="line-item">
              <span>${i + 1}. ${esc(p.name)}</span>
              <strong>${p.qty} buah</strong>
            </div>`
          ).join('')
        : '<div class="empty">Belum ada transaksi pada periode ini.</div>'
      }
    </div>

    <button class="btn outline full" data-action="export">
      Unduh laporan CSV
    </button>
  `;
}

// HALAMAN PENGATURAN
function settings() {
  return `
    
    ${heading('Edit Menu Martabak', 'Kelola daftar menu dan harga jual')}

    <div class="panel">
      <button
        class="btn full"
        data-action="open-menu-category">
        🍽️ Edit Menu Martabak
      </button>
    </div>

    ${heading('Informasi penyimpanan','Data aplikasi')}

    <div class="notice">
      Riwayat penjualan disimpan di browser ini. Data tidak otomatis
      tersinkron ke perangkat lain. Hindari menghapus data browser
      jika ingin mempertahankan riwayat transaksi.
    </div>
  `;
}

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
      <button
        type="button"
        data-action="back-menu-category"
        aria-label="Kembali"
        style="
          width:36px;
          height:36px;
          border:none;
          border-radius:50%;
          background:#f3f4f6;
          color:#374151;
          font-size:21px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          padding:0;
        ">&lt;</button>

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
            ${type === 'Manis' ? '🥞' : '🍳'}
          </div>

          <div class="product-info">
            <strong>${esc(item.name)}</strong>
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
      ">🗑️</div>

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
function render() {
  sync();

  document.querySelectorAll('.nav button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );

  document.getElementById('content').innerHTML =
    tab === 'home' ? home() :
    tab === 'sales' ? salesPage() :
    tab === 'editSale' ? editSalePage() :
    tab === 'finance' ? finance() :
    tab === 'reports' ? reports() :
    tab === 'expenseForm' ? expenseForm() :
    menuCategoryPage ? menuCategoryPageView() :
    settings();

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
      <button
        type="button"
        data-action="back-menu-category-settings"
        aria-label="Kembali ke Pengaturan"
        style="
          width:36px;
          height:36px;
          border:none;
          border-radius:50%;
          background:#f3f4f6;
          color:#374151;
          font-size:21px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-shrink:0;
          padding:0;
        ">&lt;</button>

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
        🍳 Edit Martabak Asin
      </button>

      <button
        class="btn secondary full"
        data-action="menu-category"
        data-type="Manis">
        🥞 Edit Martabak Manis
      </button>
    </div>
  `;
}

// FORM PENJUALAN
function setupSaleForm() {
  const type = document.getElementById('type');
  const flavor = document.getElementById('flavor');
  const price = document.getElementById('price');
  const qty = document.getElementById('qty');

  if (!type || !flavor || !price || !qty) return;

  function syncFlavor() {
    const items = menuItems.filter(
      item => item.type === type.value
    );

    flavor.innerHTML =
      '<option value="" selected disabled hidden>Pilih varian/rasa</option>' +
      items.map(item =>
        `<option value="${item.id}">${esc(item.name)}</option>`
      ).join('');

    flavor.value = '';
    price.value = '';

    updateTotal();
  }

  function updatePrice() {
    const selectedMenu = menuItems.find(
      item => item.id === Number(flavor.value)
    );

    price.value = selectedMenu ? selectedMenu.price : '';

    updateTotal();
  }

  type.addEventListener('change', syncFlavor);
  flavor.addEventListener('change', updatePrice);
  qty.addEventListener('input', updateTotal);

  // Pilihan awal jenis martabak
  type.value = '';

  // Pilihan awal varian/rasa
  flavor.innerHTML =
    '<option value="" selected>Pilih jenis martabak dulu</option>';

  flavor.value = '';
  price.value = '';

  updateTotal();
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

  return `
    ${heading('Edit penjualan', 'Ubah jenis, varian, dan jumlah martabak')}
    
<div class="panel">
  <div class="notice" style="margin-bottom:16px">
    <strong>Data transaksi sebelumnya</strong>
    <div style="margin-top:8px">
      Varian: ${esc(p.name)}
    </div>
    <div style="margin-top:4px">
      Jumlah: ${p.qty} buah
    </div>
    <div style="margin-top:4px">
      Jenis: ${esc(p.type)}
    </div>
  </div>

  <form id="editSaleForm">

        <label class="field">
          <span>Jenis martabak</span>
          <select id="editType">
            <option value="Manis" ${p.type === 'Manis' ? 'selected' : ''}>Manis</option>
            <option value="Asin" ${p.type === 'Asin' ? 'selected' : ''}>Asin</option>
          </select>
        </label>

        <label class="field">
          <span>Varian / rasa</span>
          <select id="editFlavor"></select>
        </label>

        <label class="field">
          <span>Jumlah (buah)</span>
          <input id="editQty" type="number" min="1" step="1"
            value="${p.qty}" required>
        </label>

        <label class="field">
          <span>Harga satuan (Rp)</span>
          <input id="editPrice" type="number"
            value="${p.price}" readonly>
        </label>

        <div class="totalbox">
          <span>Total penjualan</span>
          <strong id="editTotal">${fmt(p.qty * p.price)}</strong>
        </div>

        <button class="btn full" type="submit">
          Simpan perubahan
        </button>

        <button class="btn outline full" type="button"
          data-action="cancel-edit">
          Batal
        </button>
      </form>
    </div>
  `;
}

function setupEditSaleForm() {
  const type = document.getElementById('editType');
  const flavor = document.getElementById('editFlavor');
  const qty = document.getElementById('editQty');
  const price = document.getElementById('editPrice');

  if (!type || !flavor || !qty || !price) return;

  const p = transactions.find(t => t.id === editingSaleId);
  if (!p) return;

  function updatePrice() {
    const item = menuItems.find(
      m => m.id === Number(flavor.value)
    );

    if (item) price.value = item.price;

    updateEditTotal();
  }

  function updateFlavors() {
    const items = menuItems.filter(
      m => m.type === type.value
    );

    flavor.innerHTML = items.map(item =>
      `<option value="${item.id}">${esc(item.name)} - ${fmt(item.price)}</option>`
    ).join('');

    // Pertahankan varian lama jika jenisnya tidak berubah
    const current = items.find(m => m.name === p.name);

    if (current && current.type === type.value) {
      flavor.value = String(current.id);
    }
    updatePrice();
  }

  type.addEventListener('change', updateFlavors);
  flavor.addEventListener('change', updatePrice);
  qty.addEventListener('input', updateEditTotal);

  updateFlavors();
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
  const b = e.target.closest('button');
  if (!b) return;
  
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

  if (b.dataset.action==='back-exp') {
    tab = 'finance';
    render();
  }

  if (b.dataset.action === 'edit-sale') {
  editSale(Number(b.dataset.id));

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
      ">🗑️</div>

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
        ">🗑️</div>

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

  if (b.dataset.action==='export') {
    const rows = [
      ['Tanggal','Waktu','Jenis','Varian','Jumlah',
       'Harga satuan','Pembayaran','Total'],

      ...transactions.map(p => [
        p.date,
        timeLabel(p.createdAt),
        p.type,
        p.name,
        p.qty,
        p.price,
        p.payment,
        p.qty*p.price
      ])
    ];

    const csv = rows.map(r =>
      r.map(v => '"'+String(v??'').replace(/"/g,'""')+'"').join(';')
    ).join('\r\n');

    const url = URL.createObjectURL(
      new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'})
    );

    const a = document.createElement('a');
    a.href = url;
    a.download = 'riwayat-penjualan-martabak.csv';
    a.click();

    URL.revokeObjectURL(url);
    toast('Laporan CSV berhasil dibuat.');
  }
});

// FORMAT NOMINAL PENGELUARAN
document.getElementById('content').addEventListener('input', e => {
  if (e.target.id === 'expAmount') {
    e.target.value = formatNominal(e.target.value);
  }
});

// MEMILIH TANGGAL HISTORI
document.getElementById('content').addEventListener('change', e => {
  if (e.target.id === 'historyDate') {
    selectedHistoryDate = e.target.value || todayKey();
    render();
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

  const selectedId = Number(
    document.getElementById('editFlavor').value
  );

  const selectedMenu = menuItems.find(m => m.id === selectedId);
  const qty = Number(document.getElementById('editQty').value);

  if (!selectedMenu) {
    toast('Pilih varian martabak terlebih dahulu.');
    return;
  }

  if (!Number.isInteger(qty) || qty < 1) {
    toast('Jumlah harus minimal 1 buah.');
    return;
  }

  p.type = selectedMenu.type;
  p.name = selectedMenu.name;
  p.price = selectedMenu.price;
  p.qty = qty;

  saveTransactions();

  editingSaleId = null;
  tab = 'sales';
  render();

  toast('Transaksi berhasil diedit!');
}

if (e.target.id === 'saleForm') {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const flavorValue = document.getElementById('flavor').value;

  if (!type) {
    toast('Pilih jenis martabak terlebih dahulu.');
    return;
  }

  if (!flavorValue) {
    toast('Pilih varian/rasa martabak terlebih dahulu.');
    return;
  }

  const selectedId = Number(flavorValue);
  const selectedMenu = menuItems.find(p => p.id === selectedId);

  if (!selectedMenu) {
    toast('Pilih varian martabak yang valid.');
    return;
  }

  const qty = Number(document.getElementById('qty').value);
  const price = selectedMenu.price;
  const payment = document.getElementById('payment').value;

    if (!Number.isInteger(qty) || qty<1) {
      toast('Jumlah harus minimal 1 buah.');
      return;
    }

    const now = new Date();
    
const today = todayKey();
const found = transactions.find(t =>
  t.name === selectedMenu.name &&
  t.type === type &&
  t.price === price &&
  t.payment === payment &&
  t.date === today
);

if (found) {
  found.qty += qty;
} else {
  transactions.push({
    id: nextId++,
    name: selectedMenu.name,
    type,
    qty,
    price,
    payment,
    date: today,
    createdAt: now.toISOString()
  });
}

    saveTransactions();
    selectedHistoryDate = todayKey();
    tab = 'sales';
    render();

    toast('Penjualan berhasil dicatat!');
  }

  if (e.target.id==='expenseForm') {
    e.preventDefault();

    const name = document.getElementById('expName').value.trim();
    const category = document.getElementById('expCat').value;
    const amount = Number(document.getElementById('expAmount').value.replace(/\./g, ''));

    if (!name || amount<1) {
      toast('Isi nama dan nominal pengeluaran dengan benar.');
      return;
    }

    expenses.push({
  name,
  category,
  amount,
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
    (sum, t) => sum + (Number(t.price) || 0) * (Number(t.qty) || 0),
    0
  );
}

function totalNetAllTime() {
  return totalSalesAllTime() -
    expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}