// Dipisahkan dari script.js MartabakKu; fungsi bersama tetap di app.js.

function finance() {
  const historyExpenses = getExpenseHistory();

  const historyTotal = historyExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  return `
    <style>
      .finance-page .metric,
      .finance-page .totalbox,
      .finance-page .panel,
      .finance-page .expense-card,
      .finance-page .expense-details {
        background: #fff !important;
      }

      .finance-page .expense-card {
        display: block;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--line, #e5e7eb);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
      }

      .finance-page .expense-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
      }

      .finance-page .expense-category-label {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        color: #8b5e3c;
        background: #fff4e8;
        padding: 5px 9px;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .finance-page .expense-total {
        font-size: 18px;
        font-weight: 700;
        color: var(--text, #1f2937);
        text-align: right;
      }

      .finance-page .expense-details {
        border: 1px solid var(--line, #e5e7eb);
        border-radius: 10px;
        padding: 10px 12px;
        min-width: 0;
      }

      .finance-page .expense-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 6px 0;
        font-size: 14px;
      }

      .finance-page .expense-item + .expense-item {
        border-top: 1px dashed var(--line, #e5e7eb);
      }

      .finance-page .expense-time {
        display: inline-block;
        margin-top: 0;
        color: var(--muted, #6b7280);
        font-size: 12px;
      }

      .finance-page .expense-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .finance-page .expense-datetime {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
      }

      @media (max-width: 520px) {
        .finance-page .expense-header {
          flex-direction: row;
        }

        .finance-page .expense-total {
          text-align: right;
        }

        .finance-page .expense-actions button {
          flex: 1;
        }
      }
    </style>

    <div class="finance-page">
      ${heading(
        'Keuangan usaha',
        'Ringkasan uang masuk dan keluar'
      )}

      <div class="metrics">
        <div class="metric">
          <div class="emoji">${uiIcon('arrowUp', 22)}</div>
          <div class="label">Uang masuk hari ini</div>
          <div class="value">${fmt(totalSales())}</div>
        </div>

        <div class="metric">
          <div class="emoji">${uiIcon('arrowDown', 22)}</div>
          <div class="label">Uang keluar hari ini</div>
          <div class="value">${fmt(totalExp())}</div>
        </div>
      </div>

      <div class="totalbox">
        <span>Selisih arus kas</span>
        <strong>${fmt(totalSales() - totalExp())}</strong>
      </div>

      ${heading(
        'Pengeluaran',
        'Biaya usaha yang dicatat',
        '<button class="btn" data-action="add-exp">+ Tambah</button>'
      )}

      <div class="panel">
        <label class="field">
          <span>Dari tanggal</span>
          <input
            id="expenseStartDate"
            type="date"
            value="${selectedExpenseStartDate}"
            max="${todayKey()}"
          >
        </label>

        <label class="field">
          <span>Sampai tanggal</span>
          <input
            id="expenseEndDate"
            type="date"
            value="${selectedExpenseEndDate}"
            max="${todayKey()}"
          >
        </label>

        <div class="line-item">
          <span>Periode pengeluaran</span>
          <strong>
            ${dateLabel(selectedExpenseStartDate)} –
            ${dateLabel(selectedExpenseEndDate)}
          </strong>
        </div>

        <div class="line-item">
          <span>Total pengeluaran</span>
          <strong>${fmt(historyTotal)}</strong>
        </div>

        <div class="line-item">
          <span>Jumlah transaksi</span>
          <strong>${historyExpenses.length} transaksi</strong>
        </div>
      </div>

      <div class="panel" style="background:#fff !important;">
        ${
          historyExpenses.length
            ? [...historyExpenses]
                .sort((a, b) => {
                  const getTime = e => {
                    const value = e.createdAt;

                    if (typeof value === 'number') {
                      return value;
                    }

                    const numeric = Number(value);

                    if (value && Number.isFinite(numeric) && numeric > 0) {
                      return numeric;
                    }

                    const parsed = Date.parse(value);

                    return Number.isFinite(parsed) ? parsed : 0;
                  };

                  return getTime(b) - getTime(a);
                })
                .map(e => {
                  const i = expenses.indexOf(e);

                  const details =
                    Array.isArray(e.items) && e.items.length
                      ? e.items
                      : [{
                          name: e.name || 'Pengeluaran',
                          amount: e.amount || 0
                        }];

                  return `
                    <div class="expense-card">
                      <div class="expense-header">
                        <div>
                          <div class="expense-category-label">
                            ${esc(e.category || 'Lainnya')}
                          </div>
                        </div>

                        <div class="expense-total">
                          ${fmt(e.amount || 0)}
                        </div>
                      </div>

                      <div class="expense-details">
                        ${details.map(item => `
                          <div class="expense-item">
                            <span>${esc(item.name || 'Pengeluaran')}</span>
                            <strong>${fmt(item.amount || 0)}</strong>
                          </div>
                        `).join('')}
                      </div>

                      <div class="expense-actions">
                        <button
                          class="btn secondary"
                          data-action="edit-exp"
                          data-index="${i}"
                        >Edit</button>

                        <button
                          class="btn danger"
                          data-action="delete-exp"
                          data-index="${i}"
                        >Hapus</button>
                      </div>

                      <div class="expense-datetime">
                        <small class="expense-time">
                          ${uiIcon('clock', 13)} ${e.createdAt ? timeLabel(e.createdAt) : '-'}
                        </small>

                        <small class="expense-time">
                          ${uiIcon('calendar', 13)} ${e.date
                            ? new Date(e.date + 'T00:00:00').toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                            : '-'}
                        </small>
                      </div>
                    </div>
                  `;
                }).join('')           
            : `<div class="empty">Belum ada pengeluaran pada periode ${dateLabel(selectedExpenseStartDate)} – ${dateLabel(selectedExpenseEndDate)}.</div>`
        }

        <div class="notice">
          Selisih ini merupakan ringkasan arus kas,
          bukan perhitungan laba bersih.
        </div>
      </div>
    </div>
  `;
}

// FORM PENGELUARAN

function expenseForm(editIndex = null) {
  const isEditing = editIndex !== null;
  const expense = isEditing ? expenses[editIndex] : null;

  if (isEditing && !expense) {
    tab = 'finance';
    render();
    return '';
  }

  const categories = [
    'Bahan baku',
    'Operasional',
    'Gaji',
    'Sewa',
    'Lainnya'
  ];

  const escapeHTML = text =>
    String(text ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const items = expense
    ? (
        Array.isArray(expense.items) && expense.items.length
          ? expense.items
          : [{
              name: expense.name || 'Pengeluaran',
              amount: expense.amount || 0
            }]
      )
    : [{ name: '', amount: '' }];

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <button type="button" class="btn secondary" data-action="back-exp" aria-label="Kembali ke Keuangan" style="font-size:22px; padding:6px 13px;">‹</button>
      <div>
        <h2 style="margin:0;font-size:20px;">${isEditing ? 'Edit pengeluaran' : 'Tambah pengeluaran'}</h2>
        <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">${isEditing ? 'Ubah kategori dan rincian pengeluaran' : 'Catat beberapa barang sekaligus'}</p>
      </div>
    </div>

    <div class="panel">
      <form
        id="expenseForm"
        data-edit-index="${isEditing ? editIndex : ''}"
      >
        <label class="field">
          <span>Kategori pengeluaran</span>
          <select id="expCat" required>
            ${categories.map(category => `
              <option
                value="${category}"
                ${(expense?.category || 'Bahan baku') === category
                  ? 'selected'
                  : ''}
              >${category}</option>
            `).join('')}
          </select>
        </label>

        <div id="expenseItems">
          ${items.map(item => `
            <div class="expense-item-row">
              <label class="field">
                <span>Nama barang</span>
                <input
                  type="text"
                  class="exp-item-name"
                  placeholder="Contoh: Telur"
                  value="${escapeHTML(item.name)}"
                  required
                >
              </label>

              <label class="field">
                <span>Nominal (Rp)</span>
                <input
                  type="text"
                  class="exp-item-amount"
                  inputmode="numeric"
                  placeholder="10.000"
                  autocomplete="off"
                  value="${item.amount !== '' && item.amount != null
                    ? Number(item.amount).toLocaleString('id-ID')
                    : ''}"
                  required
                >
              </label>

              ${items.length > 1 ? `
                <button
                  type="button"
                  class="btn danger remove-exp-item"
                  data-action="remove-exp-item"
                >Hapus barang</button>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <button
          class="btn secondary full"
          type="button"
          data-action="add-exp-item"
        >+ Tambah barang</button>

        <div class="totalbox" style="margin-top:16px">
          <span>Total pengeluaran</span>
          <strong id="expGrandTotal">
            ${fmt(items.reduce(
              (sum, item) => sum + (Number(item.amount) || 0),
              0
            ))}
          </strong>
        </div>

        <button
          class="btn full"
          type="submit"
          style="margin-top:16px"
        >
          ${isEditing ? 'Simpan Perubahan' : 'Simpan pengeluaran'}
        </button>
      </form>
    </div>

  `;
}

function editExpense(index) {
  const e = expenses[index];
  if (!e) {
    toast('Pengeluaran tidak ditemukan.');
    return;
  }

  const categories = [
    'Bahan baku',
    'Operasional',
    'Gaji',
    'Sewa',
    'Lainnya'
  ];

  const escapeHTML = (text) =>
    String(text ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);

  const items = Array.isArray(e.items) && e.items.length
    ? e.items
    : [{
        name: e.name || '',
        amount: Number(e.amount) || 0
      }];

  const categoryOptions = categories.map(category => `
    <option value="${category}"
      ${e.category === category ? 'selected' : ''}>
      ${category}
    </option>
  `).join('');

  const itemRows = items.map(item => `
    <div class="expense-item-row">
      <label class="field">
        <span>Nama barang</span>
        <input class="exp-item-name" type="text"
          value="${escapeHTML(item.name)}" required>
      </label>

      <label class="field">
        <span>Nominal (Rp)</span>
        <input class="exp-item-amount" type="text"
          inputmode="numeric"
          value="${Number(item.amount || 0).toLocaleString('id-ID')}"
          required>
      </label>

      <button class="btn danger"
        type="button"
        data-action="remove-exp-item">
        Hapus barang
      </button>
    </div>
  `).join('');

  document.getElementById('content').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <button type="button" class="btn secondary" data-action="back-exp" aria-label="Kembali ke Keuangan" style="font-size:22px; padding:6px 13px;">‹</button>
      <div>
        <h2 style="margin:0;font-size:20px;">Edit pengeluaran</h2>
        <p style="margin:4px 0 0;color:#6b7280;font-size:13px;">Ubah kategori dan detail barang pengeluaran</p>
      </div>
    </div>

    <div class="panel">
      <form id="expenseForm" data-edit-index="${index}">
        <label class="field">
          <span>Kategori pengeluaran</span>
          <select id="expCat" required>
            ${categoryOptions}
          </select>
        </label>

        <div id="expenseItems">
          ${itemRows}
        </div>

        <div style="margin-top: 20px; margin-bottom: 12px;">
          <button class="btn secondary"
            type="button"
            data-action="add-exp-item">
            + Tambah barang
          </button>
        </div>
        
        <div class="field" style="margin-top:16px;">
          <strong>Total pengeluaran: Rp <span id="expGrandTotal">0</span></strong>
        </div>

        <button class="btn full" type="submit">
          Simpan perubahan
        </button>
      </form>
    </div>

  `;

  const container = document.getElementById('expenseItems');

  function formatAmount(input) {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits
      ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      : '';
  }

  function updateTotal() {
    const total = [...container.querySelectorAll('.expense-item-row')]
      .reduce((sum, row) => {
        const value = row.querySelector('.exp-item-amount').value;
        return sum + (Number(value.replace(/\D/g, '')) || 0);
      }, 0);

    document.getElementById('expGrandTotal').textContent =
      total.toLocaleString('id-ID');
  }

  container.querySelectorAll('.exp-item-amount').forEach(input => {
    input.addEventListener('input', () => {
      formatAmount(input);
      updateTotal();
    });
  });

  container.querySelectorAll('.exp-item-name').forEach(input => {
    input.addEventListener('input', updateTotal);
  });

  updateTotal();
}
