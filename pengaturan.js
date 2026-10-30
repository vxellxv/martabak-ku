// Dipisahkan dari script.js MartabakKu; fungsi bersama tetap di app.js.

function settings() {
  return `
    
    ${heading('Edit Menu Martabak', 'Kelola daftar menu dan harga jual')}

    <div class="panel">
      <button
        class="btn full"
        data-action="open-menu-category">
        ${uiIcon('utensils', 18)} Edit Menu Martabak
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
