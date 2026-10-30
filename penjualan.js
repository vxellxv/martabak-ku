// Dipisahkan dari script.js MartabakKu; fungsi bersama tetap di app.js.

function salesPage() {
  const history = transactions
    .filter(t => t.date === selectedHistoryDate)
    .sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));

  const historyTotal = history.reduce(
    (sum, t) => sum + transactionTotal(t), 0
  );

  const historyQty = history.reduce(
    (sum, t) => sum + transactionQty(t), 0
  );
  return `
    ${heading('Catat penjualan','Pilih jenis, rasa, dan jumlah')}

    <div class="panel">
      <form id="saleForm">
        <div id="orderItems"></div>

        <button
          class="btn secondary full"
          type="button"
          id="addOrderItem"
          style="margin-bottom:16px;"
        >
          + Tambah martabak
        </button>

        <label class="field">
          <span>Pembayaran</span>
          <select id="payment">
            <option value="Tunai">Tunai</option>
            <option value="QRIS">QRIS</option>
            <option value="Transfer">Transfer</option>
          </select>
        </label>

        <div class="totalbox">
          <span>Total seluruh pesanan</span>
          <strong id="saleTotal">Rp0</strong>
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
