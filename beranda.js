// Dipisahkan dari script.js MartabakKu; fungsi bersama tetap di app.js.

let showMonthlyRevenue = false;
let revenueMonthOffset = 0;
let selectedRevenueDate = null;
let showHomeDetail = false;
let homeDetailType = 'payment';
let detailMonthOffset = 0;
let selectedDetailDate = null;
let selectedHomeBreakdown = null;

function home() {
  if (selectedHomeBreakdown) return homeBreakdownView();
  if (showHomeDetail) return homeMetricDetail();
  if (showMonthlyRevenue) return homeMonthlyRevenue();

  const m = qtyType('Manis');
  const a = qtyType('Asin');

  const tunai = paymentCount('Tunai');
  const qris = paymentCount('QRIS');
  const transfer = paymentCount('Transfer');

  const latest = [...todayTransactions()]
    .sort((x, y) => (y.createdAt || '').localeCompare(x.createdAt || ''))
    .slice(0, 5);

  return `
    <div class="metrics">
      <button type="button" class="metric" data-action="open-monthly-revenue" style="text-align:left; width:100%; cursor:pointer; color:inherit; font:inherit;">
        <div class="emoji">${uiIcon('cash', 22)}</div>
        <div class="label">Total omzet hari ini</div>
        <div class="value">${fmt(totalSales())}</div>
        <div class="hint">${dateLabel(todayKey())}</div>
      </button>

      <button type="button" class="metric" data-action="open-home-detail" data-detail-type="payment" style="text-align:left;width:100%;cursor:pointer;color:inherit;font:inherit;">
        <div class="emoji">${uiIcon('card', 22)}</div>
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
      </button>

      <button type="button" class="metric" data-action="open-home-detail" data-detail-type="manis" style="text-align:left;width:100%;cursor:pointer;color:inherit;font:inherit;">
        <div class="emoji">${uiIcon('pancake', 22)}</div>
        <div class="label">Martabak manis</div>
        <div class="value">${m} buah</div>
        <div class="hint">Terjual hari ini</div>
      </button>

      <button type="button" class="metric" data-action="open-home-detail" data-detail-type="asin" style="text-align:left;width:100%;cursor:pointer;color:inherit;font:inherit;">
        <div class="emoji">${uiIcon('egg', 22)}</div>
        <div class="label">Martabak asin</div>
        <div class="value">${a} buah</div>
        <div class="hint">Terjual hari ini</div>
      </button>
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

function homeBreakdownView() {
  const [source, date] = selectedHomeBreakdown.split(':');

  const dayTransactions = transactions.filter(t => t.date === date);
  const items = dayTransactions.flatMap(t => transactionItems(t));

  const types = ['Manis', 'Asin'];

  const typeSummary = types.map(type => {
    const matching = items.filter(it => it.type === type);

    return {
      type,
      qty: matching.reduce(
        (sum, it) => sum + (Number(it.qty) || 0),
        0
      ),
      omzet: matching.reduce(
        (sum, it) =>
          sum + (Number(it.qty) || 0) * (Number(it.price) || 0),
        0
      )
    };
  });

  const selectedType =
    source === 'manis' ? 'Manis' :
    source === 'asin' ? 'Asin' : null;

  const variants = selectedType
    ? Object.values(
        items
          .filter(it => it.type === selectedType)
          .reduce((result, it) => {
            const name = String(it.name || 'Tanpa nama');
            if (!result[name]) result[name] = { name, qty: 0 };
            result[name].qty += Number(it.qty) || 0;
            return result;
          }, {})
      ).sort((a, b) => b.qty - a.qty)
    : [];

  const content = selectedType
    ? (variants.length
        ? variants.map(item => `
            <div style="
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:12px;
              padding:14px;
              margin-bottom:8px;
              border:1px solid #f0ece6;
              border-radius:13px;
              background:#fff;
            ">
              <div style="font-weight:700;color:#352b22">
                ${item.name}
              </div>
              <div style="font-weight:800;white-space:nowrap">
                ${item.qty} buah
              </div>
            </div>
          `).join('')
        : '<div class="hint" style="padding:16px">Tidak ada penjualan pada tanggal ini.</div>')
    : typeSummary.map(item => `
        <div style="
          padding:16px;
          margin-bottom:10px;
          border:1px solid #f0ece6;
          border-radius:14px;
          background:#fff;
        ">
          <div style="font-weight:700;color:#352b22;margin-bottom:10px">
            ${item.type === 'Manis' ? uiIcon('pancake', 18) + ' Martabak Manis' : uiIcon('egg', 18) + ' Martabak Asin'}
          </div>

          <div style="display:flex;justify-content:space-between;gap:12px">
            <div>
              <div class="hint">Jumlah terjual</div>
              <div style="font-size:20px;font-weight:800">
                ${item.qty} buah
              </div>
            </div>

            <div style="text-align:right">
              <div class="hint">Omzet</div>
              <div style="font-size:18px;font-weight:800">
                ${fmt(item.omzet)}
              </div>
            </div>
          </div>
        </div>
      `).join('');

  const title = selectedType
    ? `Varian Martabak ${selectedType}`
    : 'Rincian Penjualan';

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <button
        type="button"
        class="btn secondary"
        data-home-breakdown-back
        aria-label="Kembali"
        style="font-size:22px;padding:6px 13px"
      >‹</button>

      <div>
        <h2 style="margin:0">${title}</h2>
        <div class="hint">${dateLabel(date)}</div>
      </div>
    </div>

    <div class="panel" style="padding:16px;background:#fff">
      ${content}
    </div>
  `;
}

// HALAMAN DETAIL GRAFIK BERANDA
function homeMetricDetail() {
  const now = new Date();
  const monthDate = new Date(
    now.getFullYear(),
    now.getMonth() + detailMonthOffset,
    1
  );

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthName = monthDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const keyFor = day =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = keyFor(day);
    const ts = transactions.filter(t => t.date === date);

    const payment = {
      Tunai: 0,
      QRIS: 0,
      Transfer: 0
    };

    ts.forEach(t => {
      const method = String(t.payment || t.method || '').toLowerCase();
      const key = Object.keys(payment).find(
        k => k.toLowerCase() === method
      );

      if (key) payment[key]++;
    });

    const manis = ts.reduce(
      (sum, t) =>
        sum +
        transactionItems(t)
          .filter(it => it.type === 'Manis')
          .reduce((n, it) => n + (Number(it.qty) || 0), 0),
      0
    );

    const asin = ts.reduce(
      (sum, t) =>
        sum +
        transactionItems(t)
          .filter(it => it.type === 'Asin')
          .reduce((n, it) => n + (Number(it.qty) || 0), 0),
      0
    );

    return {
      day,
      date,
      ts,
      payment,
      manis,
      asin
    };
  });

  const isPayment = homeDetailType === 'payment';

  const title = isPayment
    ? 'Grafik Metode Pembayaran'
    : `Grafik Martabak ${homeDetailType === 'manis' ? 'Manis' : 'Asin'}`;

  const series = isPayment
    ? [
        {
          key: 'total',
          label: 'Total transaksi',
          color: '#8b4513'
        }
      ]
    : [
        {
          key: homeDetailType === 'manis' ? 'manis' : 'asin',
          color: '#d99b16'
        }
      ];

  const val = (d, key) =>
    isPayment ? d.ts.length : d[key];

  const maxValue = Math.max(
    1,
    ...daily.flatMap(d => series.map(s => val(d, s.key)))
  );

  const W = 700;
  const H = 190;
  const L = 28;
  const R = 12;
  const T = 12;
  const B = 30;
  const PW = W - L - R;
  const PH = H - T - B;

  const x = i =>
    L + (daily.length <= 1 ? PW / 2 : i * PW / (daily.length - 1));

  const y = v =>
    T + PH - (v / maxValue) * PH;

  const selected =
    daily.find(d => d.date === selectedDetailDate) || null;

  const sx = selected ? x(selected.day - 1) : 0;

  const sy = selected
    ? y(Math.max(...series.map(s => val(selected, s.key))))
    : 0;

  const labelW = 190;
  const labelH = isPayment ? 58 : 44;

  const lx = Math.max(
    L,
    Math.min(
      W - R - labelW,
      sx + (sx > W * 0.68 ? -labelW - 10 : 10)
    )
  );

  const ly = Math.max(
    T,
    Math.min(H - B - labelH, sy - labelH - 8)
  );

  const tooltip = selected
    ? `<g pointer-events="none">
        <path
          d="M ${sx} ${sy} L ${Math.max(
            lx + 8,
            Math.min(lx + labelW - 8, sx)
          )} ${ly + labelH}"
          stroke="#8b4513"
          stroke-width="1.5"
        />
        <rect
          x="${lx}"
          y="${ly}"
          width="${labelW}"
          height="${labelH}"
          rx="9"
          fill="#34251b"
          stroke="#fff"
        />
        <text
          x="${lx + 10}"
          y="${ly + 15}"
          font-size="10"
          fill="#f8dca0"
        >${dateLabel(selected.date)}</text>

        ${series.map((s, i) => `
          <text
            x="${lx + 10}"
            y="${ly + 32 + i * 14}"
            font-size="12"
            font-weight="700"
            fill="#fff"
          >${isPayment
            ? (s.label || s.key)
            : s.key === 'manis'
              ? 'Martabak manis'
              : s.key === 'asin'
                ? 'Martabak asin'
                : s.key
          }: ${val(selected, s.key)}${isPayment ? ' transaksi' : ' buah'}</text>
        `).join('')}
      </g>`
    : '';

  const grid = [0, 0.5, 1]
    .map(f => {
      const yy = T + PH * f;

      return `
        <line
          x1="${L}"
          y1="${yy}"
          x2="${W - R}"
          y2="${yy}"
          stroke="#e9e2d8"
        />
        <text
          x="${L - 5}"
          y="${yy + 4}"
          text-anchor="end"
          font-size="10"
          fill="#8b8175"
        >${Math.round(maxValue * (1 - f))}</text>
      `;
    })
    .join('');
  
  const lines = series.map(s => {
    const points = daily
      .map((d, i) => `${x(i)},${y(val(d, s.key))}`)
      .join(' ');

    const areaPoints =
      `${L},${T + PH} ${points} ${W - R},${T + PH}`;

    return `
      <polygon
        points="${areaPoints}"
        fill="${s.color}"
        opacity=".07"
      />
      <polyline
        class="${selectedDetailDate ? '' : 'chart-line-draw'}"
        points="${points}"
        fill="none"
        stroke="${s.color}"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
    `;
  }).join('');

  // Titik grafik tetap diam, tidak ikut animasi garis.
  const dots = daily.map((d,i) => series.map(s => `
    <g
      data-detail-day="${d.date}"
      role="button"
      tabindex="0"
      aria-label="${dateLabel(d.date)}"
      style="cursor:pointer"
    >
      <circle
        cx="${x(i)}"
        cy="${y(val(d,s.key))}"
        r="11"
        fill="transparent"
      />
      <circle
        class="${selectedDetailDate ? 'chart-point' : 'chart-point-appear'}"
        cx="${x(i)}"
        cy="${y(val(d,s.key))}"
        r="${selectedDetailDate === d.date ? 6.5 : 4.5}"
        fill="${s.color}"
        stroke="#fff"
        stroke-width="2"
        pointer-events="none"
      />
    </g>
  `).join('')).join('');

  const dates = daily
    .map((d, i) =>
      d.day === 1 || d.day % 5 === 0 || d.day === daysInMonth
        ? `
          <text
            x="${x(i)}"
            y="${H - 8}"
            text-anchor="middle"
            font-size="10"
            fill="#6b6257"
          >${d.day}</text>
        `
        : ''
    )
    .join('');

  const rows = [...daily]
    .reverse()
    .map(d => {
      const content = isPayment
        ? ['Tunai', 'QRIS', 'Transfer']
            .map((k, i) => `
              <span style="display:inline-flex;align-items:center;gap:4px;margin-left:8px">
                <i style="width:7px;height:7px;border-radius:50%;background:${[
                  '#8b4513',
                  '#d99b16',
                  '#4b8b70'
                ][i]};display:inline-block"></i>
                ${k} <b>${d.payment[k]}</b>
              </span>
            `)
            .join('')
        : `<b style="font-size:14px;color:#352b22">${val(d, homeDetailType)} buah</b>`;

      const total = isPayment
        ? d.ts.length
        : val(d, homeDetailType);

      return `
        <div
          ${!isPayment ? `data-home-breakdown="${homeDetailType}:${d.date}"` : ''}
          style="
          cursor:${!isPayment ? 'pointer' : 'default'};
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:10px;
          padding:12px 14px;
          margin-bottom:8px;
          border:1px solid ${d.date === todayKey() ? '#f0d59a' : '#f0ece6'};
          border-radius:13px;
          background:${d.date === todayKey() ? '#fff9eb' : '#fff'};
          box-shadow:0 2px 7px rgba(54,39,24,.035)
        ">
          <div style="display:flex;align-items:center;gap:11px;min-width:0">
            <div style="
              width:38px;
              height:38px;
              flex:0 0 38px;
              display:flex;
              align-items:center;
              justify-content:center;
              border-radius:11px;
              background:${total ? '#fff0c9' : '#f5f2ed'};
              color:${total ? '#8b5b0a' : '#8a8177'};
              font-weight:800
            ">${String(d.day).padStart(2, '0')}</div>

            <div>
              <div style="font-weight:700;font-size:13px;color:#352b22">
                ${dateLabel(d.date)}
              </div>

              <div style="font-size:11px;color:#9a8f82;margin-top:3px">
                ${d.date === todayKey()
                  ? 'Hari ini'
                  : total
                    ? 'Ada aktivitas'
                    : 'Belum ada aktivitas'}
              </div>

              ${isPayment
                ? `<div style="font-size:11px;margin-top:5px">${content}</div>`
                : ''}
            </div>
          </div>

          ${isPayment
            ? `<b style="white-space:nowrap">${d.ts.length} transaksi</b>`
            : content}
        </div>
      `;
    })
    .join('');

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <button
        type="button"
        class="btn secondary"
        data-action="close-home-detail"
        aria-label="Kembali ke Beranda"
        style="font-size:22px;padding:6px 13px"
      >‹</button>

      <div>
        <h2 style="margin:0">${title}</h2>
        <div class="hint">Ringkasan harian dan riwayat bulanan</div>
      </div>
    </div>

    <div class="panel" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px">
        <button type="button" class="btn secondary" data-action="detail-prev-month">
          ‹ Bulan lalu
        </button>

        <strong style="text-align:center;text-transform:capitalize">
          ${monthName}
        </strong>

        <button
          type="button"
          class="btn secondary"
          data-action="detail-next-month"
          ${detailMonthOffset >= 0 ? 'disabled' : ''}
        >Bulan depan ›</button>
      </div>

      <div class="hint">
        ${isPayment
          ? 'Jumlah transaksi menurut metode'
          : 'Total martabak terjual'}
      </div>

      <div style="font-size:28px;font-weight:800;margin:4px 0 18px">
        ${isPayment
          ? daily.reduce((n, d) => n + d.ts.length, 0) + ' transaksi'
          : daily.reduce((n, d) => n + d[homeDetailType], 0) + ' buah'}
      </div>

      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        ${series.map(s => `
          <span style="font-size:12px;color:#66594b">
            <i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${s.color};margin-right:5px"></i>
            ${isPayment
              ? (s.label || s.key)
              : s.key === 'manis'
                ? 'Martabak manis'
                : s.key === 'asin'
                  ? 'Martabak asin'
                  : s.key}
          </span>
        `).join('')}
      </div>

      <div style="width:100%;overflow:hidden">
        <svg
          viewBox="0 0 ${W} ${H}"
          role="img"
          aria-label="${title} ${monthName}"
          style="display:block;width:100%;height:auto;overflow:visible"
        >
          ${grid}
          ${lines}
          ${dots}
          ${dates}
          ${tooltip}
        </svg>
      </div>
    </div>

    <div class="panel" style="padding:18px;background:linear-gradient(180deg,#fffdf9 0%,#fff 100%)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <div>
          <h3 style="margin:0 0 4px">Rincian harian</h3>
          <div class="hint" style="text-transform:capitalize">${monthName}</div>
        </div>

        <div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#fff0c9;font-size:19px">${uiIcon('calendar', 19)}</div>
      </div>

      ${rows}
    </div>
  `;
}

// GRAFIK OMZET BULANAN

function homeMonthlyRevenue() {
  const now = new Date();

  const monthDate = new Date(
    now.getFullYear(),
    now.getMonth() + revenueMonthOffset,
    1
  );

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();

  const monthName = monthDate.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const keyFor = day =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const daily = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = keyFor(day);

    const dayTransactions = transactions.filter(t => t.date === date);

    return {
      day,
      date,
      total: dayTransactions.reduce(
        (sum, t) => sum + transactionTotal(t),
        0
      ),
      count: dayTransactions.length
    };
  });

  const monthTotal = daily.reduce((sum, d) => sum + d.total, 0);
  const maxValue = Math.max(1, ...daily.map(d => d.total));

  const chartWidth = 700;
  const chartHeight = 190;
  const chartLeft = 24;
  const chartRight = 12;
  const chartTop = 12;
  const chartBottom = 30;

  const plotWidth = chartWidth - chartLeft - chartRight;
  const plotHeight = chartHeight - chartTop - chartBottom;

  const chartY = value =>
    chartTop + plotHeight - (value / maxValue) * plotHeight;

  const chartX = index =>
    chartLeft +
    (daily.length <= 1
      ? plotWidth / 2
      : index * plotWidth / (daily.length - 1));

  const linePoints = daily
    .map((d, i) => `${chartX(i)},${chartY(d.total)}`)
    .join(' ');

  // Titik grafik tetap diam, tidak ikut animasi garis.
  const selectedDay = daily.find(d => d.date === selectedRevenueDate) || null;

  const chartDots = daily.map((d, i) => `
    <g
      data-revenue-day="${d.date}"
      role="button"
      tabindex="0"
      aria-label="${dateLabel(d.date)}: ${fmt(d.total)}"
      style="cursor:pointer"
    >
      <circle
        cx="${chartX(i)}"
        cy="${chartY(d.total)}"
        r="11"
        fill="transparent"
        pointer-events="all"
      />
      <circle
        class="${selectedRevenueDate ? 'chart-point' : 'chart-point-appear'}"
        cx="${chartX(i)}"
        cy="${chartY(d.total)}"
        r="${selectedRevenueDate === d.date ? 6.5 : 4.5}"
        fill="#d99b16"
        stroke="#fff"
        stroke-width="2"
        pointer-events="none"
      />
    </g>
  `).join('');

  const selectedIndex = selectedDay
    ? daily.findIndex(d => d.date === selectedDay.date)
    : -1;

  const selectedX =
    selectedIndex >= 0 ? chartX(selectedIndex) : 0;

  const selectedY =
    selectedIndex >= 0 ? chartY(selectedDay.total) : 0;

  const labelWidth = 154;
  const labelHeight = 44;

  const labelX = Math.max(
    chartLeft,
    Math.min(
      chartWidth - chartRight - labelWidth,
      selectedX +
        (selectedX > chartWidth * 0.68
          ? -labelWidth - 12
          : 12)
    )
  );

  const labelY = Math.max(
    chartTop,
    Math.min(
      chartHeight - chartBottom - labelHeight,
      selectedY - labelHeight - 8
    )
  );

  const selectedTooltip = selectedDay
    ? `
      <g pointer-events="none">
        <path
          d="M ${selectedX} ${selectedY} L ${Math.max(
            labelX + 8,
            Math.min(labelX + labelWidth - 8, selectedX)
          )} ${labelY + labelHeight}"
          stroke="#8b4513"
          stroke-width="1.5"
          opacity=".8"
        />

        <rect
          x="${labelX}"
          y="${labelY}"
          width="${labelWidth}"
          height="${labelHeight}"
          rx="9"
          fill="#34251b"
          stroke="#fff"
          stroke-width="1"
        />

        <text
          x="${labelX + 10}"
          y="${labelY + 15}"
          font-size="10"
          fill="#f8dca0"
        >${dateLabel(selectedDay.date)}</text>

        <text
          x="${labelX + 10}"
          y="${labelY + 33}"
          font-size="13"
          font-weight="700"
          fill="#fff"
        >${fmt(selectedDay.total)}</text>
      </g>
    `
    : '';

  const chartGrid = [0, 0.5, 1]
    .map(f => {
      const y = chartTop + plotHeight * f;

      return `
        <line
          x1="${chartLeft}"
          y1="${y}"
          x2="${chartWidth - chartRight}"
          y2="${y}"
          stroke="#eee8df"
          stroke-width=".8"
        />

        <text
          x="${chartLeft - 5}"
          y="${y + 4}"
          text-anchor="end"
          font-size="10"
          fill="#8b8175"
        >${f === 0
          ? (
              maxValue >= 1000000
                ? (maxValue / 1000000).toFixed(1) + 'jt'
                : Math.round(maxValue / 1000) + 'rb'
            )
          : f === 0.5
            ? (
                maxValue / 2 >= 1000000
                  ? (maxValue / 2000000).toFixed(1) + 'jt'
                  : Math.round(maxValue / 2000) + 'rb'
              )
            : '0'}</text>
      `;
    })
    .join('');

  const chartDates = daily
    .map((d, i) =>
      d.day === 1 || d.day % 5 === 0 || d.day === daysInMonth
        ? `
          <text
            x="${chartX(i)}"
            y="${chartHeight - 8}"
            text-anchor="middle"
            font-size="10"
            fill="#6b6257"
          >${d.day}</text>
        `
        : ''
    )
    .join('');

  const rows = [...daily]
    .reverse()
    .map(d => `
      <div
        data-home-breakdown="revenue:${d.date}"
        style="
          cursor:pointer;
          display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:12px 14px;
        margin-bottom:8px;
        border:1px solid ${d.date === todayKey() ? '#f0d59a' : '#f0ece6'};
        border-radius:13px;
        background:${d.date === todayKey() ? '#fff9eb' : '#fff'};
        box-shadow:0 2px 7px rgba(54,39,24,.035);
      ">
        <div style="display:flex;align-items:center;gap:11px;min-width:0">
          <div style="
            width:38px;
            height:38px;
            flex:0 0 38px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:11px;
            background:${d.total > 0 ? '#fff0c9' : '#f5f2ed'};
            color:${d.total > 0 ? '#8b5b0a' : '#8a8177'};
            font-weight:800;
            font-size:13px;
          ">${String(d.day).padStart(2, '0')}</div>

          <div style="min-width:0">
            <div style="font-weight:700;font-size:13px;color:#352b22">
              ${dateLabel(d.date)}
            </div>

            <div style="font-size:11px;color:#9a8f82;margin-top:3px">
              ${d.date === todayKey()
                ? 'Hari ini'
                : d.total > 0
                  ? 'Ada penjualan'
                  : 'Belum ada penjualan'}
            </div>
          </div>
        </div>

        <div style="
          font-weight:800;
          font-size:13px;
          white-space:nowrap;
          color:${d.total > 0 ? '#352b22' : '#a69b8e'};
        ">${fmt(d.total)}</div>
      </div>
    `)
    .join('');

  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">
      <button
        type="button"
        class="btn secondary"
        data-action="close-monthly-revenue"
        aria-label="Kembali ke Beranda"
        style="font-size:22px;padding:6px 13px"
      >‹</button>

      <div>
        <h2 style="margin:0">Grafik Omzet Bulanan</h2>
        <div class="hint">Omzet harian dan riwayat bulan</div>
      </div>
    </div>

    <div class="panel" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px">
        <button type="button" class="btn secondary" data-action="revenue-prev-month">
          ‹ Bulan lalu
        </button>

        <strong style="text-align:center;text-transform:capitalize">
          ${monthName}
        </strong>

        <button
          type="button"
          class="btn secondary"
          data-action="revenue-next-month"
          ${revenueMonthOffset >= 0 ? 'disabled' : ''}
        >Bulan depan ›</button>
      </div>

      <div class="hint">Total omzet bulan ini</div>

      <div style="font-size:28px;font-weight:800;margin:4px 0 18px">
        ${fmt(monthTotal)}
      </div>

      <div style="width:100%;overflow:hidden">
        <svg
          viewBox="0 0 ${chartWidth} ${chartHeight}"
          role="img"
          aria-label="Grafik garis omzet harian bulan ${monthName}"
          class="home-animated-chart"
          style="display:block;width:100%;height:auto;overflow:visible"
        >
          ${chartGrid}

          <polygon
            class="chart-area-rise"
            points="${chartLeft},${chartTop + plotHeight} ${linePoints} ${chartWidth - chartRight},${chartTop + plotHeight}"
            fill="#f5b82e"
            opacity=".10"
          />
          
          <polyline
            class="${selectedRevenueDate ? '' : 'chart-line-draw'}"
            points="${linePoints}"
            fill="none"
            stroke="#d99b16"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />

          ${chartDots}
          ${chartDates}
          ${selectedTooltip}
        </svg>
      </div>
    </div>

    <div class="panel" style="padding:18px;background:linear-gradient(180deg,#fffdf9 0%,#fff 100%)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px">
        <div>
          <h3 style="margin:0 0 4px">Rincian omzet harian</h3>
          <div class="hint" style="text-transform:capitalize">${monthName}</div>
        </div>

        <div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#fff0c9;font-size:19px">${uiIcon('calendar', 19)}</div>
      </div>

      ${rows}
    </div>
  `;
}