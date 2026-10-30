// Dipisahkan dari script.js MartabakKu; fungsi bersama tetap di app.js.

function reports() {
  const validRange = reportStartDate <= reportEndDate;
  const dailyTransactions = validRange
    ? transactions.filter(p =>
        p.date >= reportStartDate &&
        p.date <= reportEndDate
      )
    : [];

  // Uraikan setiap transaksi menjadi item asli supaya transaksi campuran
  // tetap masuk ke filter Semua, Manis, dan Asin dengan benar.
  const soldItems = dailyTransactions.flatMap(p =>
    transactionItems(p).map(item => ({
      name: String(item.name || '').trim(),
      type: String(item.type || '').trim(),
      qty: Number(item.qty) || 0,
      price: Number(item.price) || 0,
      qrisFee: Number(p.qrisFee) || 0,
      payment: p.payment || p.method || ''
    }))
  );

  const selectedItems = soldItems.filter(item =>
    filter === 'Semua' || item.type === filter
  );

  const selectedRevenue = selectedItems.reduce(
    (sum, item) => sum + item.qty * item.price, 0
  ) + (filter === 'Semua'
    ? dailyTransactions.reduce((sum, p) => sum + (Number(p.qrisFee) || 0), 0)
    : 0);
  const selectedQty = selectedItems.reduce((sum, item) => sum + item.qty, 0);

  const omzetByType = type => soldItems
    .filter(item => item.type === type)
    .reduce((sum, item) => sum + item.qty * item.price, 0);
  const manis = omzetByType('Manis');
  const asin = omzetByType('Asin');

  // Total dihitung per nama varian + jenis, bukan per transaksi.
  // Varian berbeda dengan jumlah sama akan tetap berada di baris masing-masing.
  const variantTotals = {};
  soldItems.forEach(item => {
    const key = `${item.type}::${item.name}`;
    if (!variantTotals[key]) {
      variantTotals[key] = { name: item.name, type: item.type, qty: 0 };
    }
    variantTotals[key].qty += item.qty;
  });

  const rank = Object.values(variantTotals)
    .sort((a, b) => b.qty - a.qty || a.name.localeCompare(b.name));

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
        <div class="value">${fmt(selectedRevenue)}</div>
      </div>
      <div class="metric">
        <div class="label">Jumlah terjual</div>
        <div class="value">${selectedQty} buah</div>
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
              <span>${i + 1}. ${esc(p.name)}${p.type && p.type !== 'Campuran' ? ` <small style="color:var(--muted)">(${esc(p.type)})</small>` : ''}</span>
              <strong>${p.qty} buah</strong>
            </div>`
          ).join('')
        : '<div class="empty">Belum ada transaksi pada periode ini.</div>'
      }
    </div>

  `;
}

// HALAMAN PENGATURAN
