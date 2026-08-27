# 01 - Fase Projek Struktur & Dokumentasi Development

Dokumen gabungan ini berisi spesifikasi teknis arsitektur, rincian struktur direktori proyek, skema data global, matriks modul fungsional, serta catatan riwayat pengembangan (development log) aplikasi **Personal Financial Cockpit**.

---

# Bagian I: Spesifikasi & Struktur Proyek

## 1. Ikhtisar Arsitektur & Tech Stack

Aplikasi ini dirancang sebagai **Single Page Application (SPA)** murni berbasis browser (Client-Side) tanpa ketergantungan pada backend server.

- **Platform:** Client-Side Single Page Application (SPA)
- **Styling Framework:** Tailwind CSS (CDN)
- **Ikonografi:** Lucide Icons (CDN)
- **Engine Visualisasi:** Chart.js (CDN)
- **State & Persistence:** `localStorage` Web API dengan struktur JSON terserialisasi
- **Ekspor/Impor File:** HTML5 File API & Blob API

---

## 2. Struktur Proyek (Directory Tree)

Berikut adalah struktur folder dan direktori aplikasi:

```text
estafet-coding/
├── docs/
│   └── 01 - Fase Projek Struktur.md  # Dokumen gabungan spesifikasi arsitektur & riwayat pengembangan
├── index.html                        # Main Entry Point / Shell SPA (HTML5, Script CDN Tailwind & Chart.js)
├── README.md                         # Dokumen utama blueprint arsitektur aplikasi
└── assets/
    ├── css/
    │   └── styles.css                # CSS kustom & override style Tailwind jika diperlukan
    └── js/
        ├── app.js                    # Inisialisasi aplikasi, router, & event binding global
        ├── state.js                  # Pengelolaan State Global (AppState) & enkapsulasi LocalStorage Sync
        ├── utils.js                  # Helper fungsi (format mata uang, format tanggal, kalkulasi rumus)
        └── modules/
            ├── wallets.js            # Logika & manajemen mutasi dompet/rekening
            ├── transactions.js       # Manajemen transaksi, filter, pagination, & urutan
            ├── dashboard.js          # Visualisasi Chart.js (Cashflow, Category Breakdown, Net Worth)
            ├── investment.js         # Logika simulator kalkulator bunga majemuk (Compound Interest)
            └── storage.js            # Modul Impor/Ekspor data (JSON Backup/Restore & CSV Export)
```

---

## 3. Skema Data Global (State Structure)

Pengelolaan state terpusat disimulasikan menggunakan objek `AppState` dengan skema berikut:

```javascript
const AppState = {
  settings: {
    currency: "IDR",
    locale: "id-ID",
    theme: "light"
  },
  wallets: [
    {
      id: "w_main",
      name: "Rekening Utama (BCA)",
      type: "bank", // 'bank' | 'cash' | 'ewallet'
      balance: 12500000,
      color: "#2563EB"
    },
    {
      id: "w_cash",
      name: "Uang Fisik",
      type: "cash",
      balance: 450000,
      color: "#16A34A"
    }
  ],
  categories: [
    { id: "cat_inc_1", name: "Gaji & Bonus", type: "income", color: "#10B981" },
    { id: "cat_exp_1", name: "Makanan & Minuman", type: "expense", color: "#F59E0B" },
    { id: "cat_exp_2", name: "Transportasi", type: "expense", color: "#6366F1" },
    { id: "cat_exp_3", name: "Tagihan Bulanan", type: "expense", color: "#EF4444" },
    { id: "cat_exp_4", name: "Investasi", type: "expense", color: "#8B5CF6" }
  ],
  budgets: [
    {
      id: "b_1",
      categoryId: "cat_exp_1",
      monthlyLimit: 2000000
    }
  ],
  transactions: [
    {
      id: "tx_101",
      date: "2026-08-27",
      type: "expense", // 'income' | 'expense' | 'transfer'
      amount: 45000,
      walletId: "w_cash",
      targetWalletId: null, // Terisi jika type === 'transfer'
      categoryId: "cat_exp_1",
      notes: "Makan siang"
    }
  ]
};
```

---

## 4. Matriks Modul Fungsional

### A. Modul Akuntansi & Dompet (Wallet Management)
- **Pencatatan Multi-Wallet:** Saldo tiap dompet dihitung secara mandiri.
- **Mutasi Pemasukan (Income):** `wallet.balance += amount`
- **Mutasi Pengeluaran (Expense):** `wallet.balance -= amount`
- **Mutasi Transfer:** `sourceWallet.balance -= amount` dan `targetWallet.balance += amount`
- **Auto-rollback:** Jika transaksi dihapus, saldo dompet terkait dikembalikan ke kondisi semula.

### B. Modul Dashboard & Visual Analytics
- **Net Worth Aggregator:** Kalkulasi nilai total seluruh aset likuid.
- **Cashflow Tracker (Line/Bar Chart):** Agregasi pemasukan dan pengeluaran per bulan berdasarkan field `date`.
- **Category Breakdown (Donut Chart):** Menghitung persentase alokasi pengeluaran per kategori pada bulan berjalan.
- **Budget Meter:** Bar indikator pemakaian anggaran terhadap limit bulanan (`total spent / monthlyLimit * 100%`).

### C. Modul Filter & Manajemen Data
- **Real-time Query Filtering:** Filter data multi-kriteria (kata kunci teks, kategori, jenis dompet, rentang tanggal awal/akhir) tanpa reload halaman.
- **Sorting:** Urutkan berdasarkan nominal atau tanggal (Ascending / Descending).
- **Pagination / Virtual Scroll:** Limit render tabel (misal: 10 data per halaman) untuk menjaga performa DOM.

### D. Modul Simulator Investasi (Compound Interest)
- **Kalkulasi Pertumbuhan Aset:** Rumus bunga majemuk dengan setoran berkala bulanan:
  $$A = P (1 + r/n)^{nt} + PMT \times \frac{(1 + r/n)^{nt} - 1}{r/n}$$
- **Output:** Grafik proyeksi nilai investasi dari tahun ke tahun beserta rincian modal pokok vs return bunga.

### E. Modul Persistence & I/O
- **Local Storage Sync:** State disinkronkan otomatis pada setiap event mutasi (tambah, edit, hapus).
- **CSV Exporter:** Format parsing baris transaksi ke file teks berformat CSV (comma-separated).
- **JSON Backup & Restore:** Fitur ekspor full payload `AppState` dan impor file JSON dengan validasi schema dasar.

---

# Bagian II: Riwayat Pencatatan Development (Development Changelog)

## [2026-08-27] - Inisialisasi Proyek & Dokumentasi Blueprint

### Added (Penambahan)
- **Dokumentasi Blueprint:** Membaca dan memetakan blueprint dari `README.md` ke dalam dokumentasi terstruktur.
- **Struktur Proyek (`docs/project-structure.md`):** Membuat spesifikasi arsitektur, peta direktori/folder proyek, skema `AppState` global, dan matriks fungsional modul.
- **Riwayat Pengembangan (`docs/development-history.md`):** Membuat berkas log riwayat pengembangan ini untuk melacak setiap tahapan pengerjaan proyek.
- **Prototipe Aplikasi SPA Penuh:**
  - `index.html`: Shell SPA berbasis Tailwind CSS, Lucide Icons, dan Chart.js dengan navigasi tab dan modal dialog.
  - `assets/js/state.js`: State manager terpusat dengan dukungan sinkronisasi `localStorage`, mutasi saldo otomatis, dan pemicu re-render reaktif.
  - `assets/js/utils.js`: Helper utilitas penformatan mata uang, tanggal, dan simulator rumus kalkulasi bunga majemuk.
  - `assets/js/app.js`: Logika interaktif antarmuka, routing tab, form handler transaksi/dompet, visualisasi grafik Chart.js, serta ekspor-impor (JSON/CSV).

### Architectural Decisions (Keputusan Arsitektur)
- Menetapkan tech stack berbasis **Client-Side SPA** murni tanpa backend (HTML5, Tailwind CSS via CDN, Chart.js via CDN, Lucide Icons).
- Menggunakan `localStorage` Web API sebagai mekanisme persistensi data lokal.
- Mengadopsi modularitas JavaScript terpisah berdasarkan domain fungsi (`wallets`, `transactions`, `dashboard`, `investment`, `storage`).

---

## Status Proyek Saat Ini
- Prototipe interaktif aplikasi **Personal Financial Cockpit** telah berhasil diimplementasikan sepenuhnya sesuai spesifikasi arsitektur di `README.md`.

---

## [2026-08-27] - Pembaruan Log Pengembangan Prototipe

### Added (Penambahan)
- **Implementasi Lengkap Prototipe SPA:**
  - `index.html`: Shell utama antarmuka SPA dengan sistem tab (*Dashboard*, *Transaksi*, *Simulator Investasi*, *Backup & Storage*) dan form modal.
  - `assets/js/state.js`: State manager terpusat dengan dukungan sinkronisasi `localStorage`, mutasi saldo otomatis, dan event listener reaktif.
  - `assets/js/utils.js`: Utility helper untuk format angka Rupiah (`IDR`), tanggal lokal (`id-ID`), dan rumus kalkulasi bunga majemuk.
  - `assets/js/app.js`: Pengendali UI, integrasi grafik Chart.js (Doughnut breakdown & Bar cashflow), penyaringan transaksi *real-time*, serta ekspor CSV & backup JSON.
