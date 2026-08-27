# Dokumentasi & Struktur Proyek: Personal Financial Cockpit

Dokumen ini berisi gambaran umum arsitektur, rincian struktur direktori proyek, skema data global, serta matriks modul fungsional dari aplikasi **Personal Financial Cockpit**.

---

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

Berikut adalah struktur folder dan direktori yang diproyeksikan untuk pengembangan aplikasi:

```text
estafet-coding/
├── docs/
│   ├── project-structure.md    # Spesifikasi arsitektur & struktur folder proyek (file ini)
│   └── development-history.md  # Catatan riwayat & log progres pengembangan proyek
├── index.html                  # Main Entry Point / Shell SPA (HTML5, Script CDN Tailwind & Chart.js)
├── README.md                   # Dokumen utama blueprint arsitektur aplikasi
└── assets/
    ├── css/
    │   └── styles.css          # CSS kustom & override style Tailwind jika diperlukan
    └── js/
        ├── app.js              # Inisialisasi aplikasi, router, dan event binding global
        ├── state.js            # Pengelolaan State Global (AppState) & enkapsulasi LocalStorage Sync
        ├── utils.js            # Helper fungsi (format mata uang, format tanggal, kalkulasi rumus)
        └── modules/
            ├── wallets.js      # Logika & manajemen mutasi dompet/rekening
            ├── transactions.js # Manajemen transaksi, filter, pagination, & urutan
            ├── dashboard.js    # Visualisasi Chart.js (Cashflow, Category Breakdown, Net Worth)
            ├── investment.js   # Logika simulator kalkulator bunga majemuk (Compound Interest)
            └── storage.js      # Modul Impor/Ekspor data (JSON Backup/Restore & CSV Export)
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
