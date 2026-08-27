# 03 - Fase Fitur Lanjutan & Keamanan (Advanced Features & Security)

Dokumen ini mendokumentasikan spesifikasi teknis dan implementasi fitur tingkat lanjut pada aplikasi **Personal Financial Cockpit** pada Fase 3, meliputi analitik cerdas, otomatisasi, fitur keamanan & privasi, serta kemudahan impor mutasi bank.

---

## 1. Ikhtisar Fitur Baru (Fase 3)

### A. Smart Analytics & Otomatisasi
1. **Transaksi Rutin Berulang (Recurring Transactions):**
   - Mendukung pendaftaran transaksi bulanan berulang (seperti langganan streaming, internet, atau tagihan kos).
   - Eksekutor otomatis `processDueRecurring()` yang memeriksa tanggal hari ini dan mencatat mutasi secara otomatis tanpa input manual ulang.
2. **Financial Goals Tracker (Target Menabung):**
   - Modul pencapaian target tabungan (seperti Dana Darurat atau Pembelian Workstation).
   - Dilengkapi bilah persentase kemajuan (*progress bar*) dan estimasi pencapaian relatif terhadap saldo saat ini.

### B. Keamanan & Privasi (Security & Stealth)
1. **Stealth / Privacy Mode (Toggle Saldo):**
   - Tombol ikon mata (👁️) pada header untuk menyembunyikan nominal angka saldo di seluruh tampilan dashboard (`Rp ••••••••`).
2. **Security PIN Lock:**
   - Fitur penguncian keamanan berbasis PIN 4-digit yang tersimpan secara lokal pada `localStorage`.

### C. Kemudahan Pengelolaan Data
1. **Impor Mutasi Bank (Bank CSV Parser):**
   - Parsing otomatis berkas `.csv` mutasi rekening bank menjadi transaksi pemasukan atau pengeluaran secara langsung.
2. **Multi-Tagging / Tag Transaksi:**
   - Mendukung pelabelan fleksibel (seperti `#kuliner`, `#gaji`, `#tagihan`, `#impor-bank`) pada setiap entitas transaksi.

---

## 2. Rincian Pembaruan Berkas Kode

| Berkas | Perubahan & Deskripsi |
| :--- | :--- |
| **`assets/js/state.js`** | Menambahkan array `recurring` & `goals` pada `DEFAULT_STATE`, metode `addRecurring()`, `deleteRecurring()`, `processDueRecurring()`, `addGoal()`, `toggleStealthMode()`, dan `setSecurityPin()`. |
| **`assets/js/utils.js`** | Memperbarui `formatCurrency()` untuk menyokong penyamaran saldo (*Stealth Mode*) serta menambahkan parser `parseBankCSV()`. |
| **`index.html`** | Menambahkan tombol toggle Stealth & PIN di header, panel Target Menabung (Goals) & Transaksi Rutin di dashboard, opsi Impor CSV Bank di tab Backup, serta Modal Dialog `modal-goal` & `modal-recurring`. |
| **`assets/js/app.js`** | Mengimplementasikan pengendali UI `toggleStealthUI()`, `promptSecurityPin()`, `renderGoals()`, `renderRecurring()`, `handleGoalSubmit()`, `handleRecurringSubmit()`, dan `handleBankCSVImport()`. |

---

## 3. Log Riwayat Development (Fase 3 Changelog)

### [2026-08-27] - Rilis Fase 3: Smart Analytics, Automation & Security

#### Ditambahkan (Added)
- Modul Transaksi Rutin Berulang (Recurring Transactions) dengan eksekusi otomatis.
- Modul Target Menabung (Financial Goals Tracker) lengkap dengan indikator progress bar.
- Tombol Mode Penyamaran Saldo (*Stealth Mode*) untuk menjaga privasi di tempat umum.
- Kunci Keamanan PIN 4-digit lokal.
- Importer berkas CSV mutasi bank pada tab Backup & Storage.
- Berkas dokumentasi `docs/03 - Fase Fitur Lanjutan & Keamanan.md`.
