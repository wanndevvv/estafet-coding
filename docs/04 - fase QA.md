# 04 - Fase QA: Quality Assurance, Bug Fixing & Redesign Clean Light Skeuomorphism

Dokumen ini mencatat secara komprehensif seluruh aktivitas pengujian kualitas (*Quality Assurance*), audit dan perbaikan *bug*, serta transformasi menyeluruh antarmuka pengguna (UI) aplikasi **Personal Financial Cockpit** menuju gaya **Clean Light Skeuomorphism**.

---

## 1. Ikhtisar & Tujuan Fase QA

Tujuan utama dari sesi pengerjaan ini adalah:
1. **Audit & Penyelarasan Blueprint:** Menyelaraskan seluruh fungsi aplikasi dengan dokumen spesifikasi teknis `README.md` dan dokumen historis di folder `docs/`.
2. **Eliminasi Bug & Edge Cases:** Mengidentifikasi dan memperbaiki seluruh potensi kegagalan logika, perulangan render tak hingga (*infinite loop*), validasi mutasi transfer dompet, parser mutasi CSV bank, dan penanganan state.
3. **Transformasi UI ke Clean Light Skeuomorphism:** Mengubah antarmuka dari mode gelap menjadi **Mode Terang (Light Mode)** yang bersih, taktil, lapang, elegan, tidak ramai (*clean & decluttered*), namun tetap mempertahankan identitas fisik skeuomorfik (elevasi bertingkat, bevel cahaya, tekstur bayangan realistis, tombol 3D, microchip emas pada kartu dompet, dan layar instrumen terbenam).
4. **Penyempurnaan Fitur Interaktif:** Menambahkan kontrol rentang tanggal pada tabel transaksi, agregasi arus kas bulanan pada grafik *cashflow*, serta aksi setoran langsung (*deposit*) pada modul *Financial Goals*.

---

## 2. Temuan Audit Bug & Solusi Teknis (Bug Fixes)

Berikut adalah daftar temuan kendala teknis dan solusi perbaikan yang telah diterapkan pada kode:

| No | Komponen / Modul | Temuan Masalah (*Bug / Limitation*) | Solusi & Implementasi Perbaikan |
| :--- | :--- | :--- | :--- |
| **1** | **`assets/js/state.js` & `app.js`** | *Infinite Loop / Rekursi State pada Recurring Transactions.* Pemanggilan `processDueRecurring()` di dalam siklus listener `renderAll()` memicu `addTransaction()` ➔ `saveState()` ➔ `notify()` ➔ `renderAll()` secara terus-menerus. | Memisahkan eksekusi otomatisasi transaksi rutin ke inisialisasi aplikasi awal (`DOMContentLoaded`) dan proses submit baru, serta melakukan mutasi batch transaksi tanpa pemicu rekursif. |
| **2** | **`assets/js/app.js`** | *Validasi Transfer Dompet.* Transaksi bertipe `transfer` dapat dijalankan meski hanya ada 1 dompet atau dompet asal dan tujuan sama. | Menambahkan validasi ketat: minimal 2 dompet terdaftar dan dompet asal tidak boleh sama dengan dompet tujuan. |
| **3** | **`assets/js/app.js`** | *Dropdown Filter Tidak Me-refresh Data.* Fungsi `populateFilterOptions()` tidak memperbarui opsi jika elemen sudah memiliki opsi awal, sehingga dompet baru tidak muncul pada dropdown filter. | Merombak logika `populateFilterOptions()` agar selalu memperbarui daftar kategori dan dompet secara dinamis tanpa merusak nilai yang sedang terpilih (*preserved selection*). |
| **4** | **`assets/js/utils.js`** | *Parser CSV Mutasi Bank Rapuh.* Format tanggal bank lokal Indonesia (`DD/MM/YYYY` atau `DD-MM-YYYY`) dan pemisah titik koma (`;`) gagal di-parse dan jatuh ke tanggal default. | Menambahkan pendeteksian fleksibel pemisah koma/titik koma, normalisasi tanggal format `YYYY-MM-DD` dan `DD/MM/YYYY`, serta pendeteksian tanda debit/kredit secara akurat. |
| **5** | **`assets/js/app.js`** | *Grafik Cashflow Tidak Mengagregasi Bulanan.* Grafik cashflow sebelumnya hanya menampilkan 1 batang total kumulatif seumur hidup. | Mengimplementasikan agregasi data transaksi per bulan (*monthly grouping* `YYYY-MM`) untuk menyajikan tren riil pemasukan vs pengeluaran dari bulan ke bulan. |
| **6** | **`index.html` & `app.js`** | *Filter Rentang Tanggal Belum Tersedia.* Blueprint bagian 3.C mensyaratkan filter rentang tanggal awal dan akhir. | Menambahkan input `filter-start-date` dan `filter-end-date` pada konsol penyaringan transaksi secara *real-time* tanpa reload halaman. |
| **7** | **`index.html` & `app.js`** | *Interaksi Target Menabung (Goals) Terbatas.* Pengguna tidak dapat menyetorkan tabungan ke target yang ada secara langsung. | Menambahkan modal `modal-goal-deposit` ("Setor Tabungan Target") dan tombol hapus target dengan konfirmasi aman. |

---

## 3. Spesifikasi Desain UI: Clean Light Skeuomorphism

Antarmuka pengguna telah dirombak ke tema **Clean Light Skeuomorphism** (*Soft Slate & Porcelain Tactical Instrument*) dengan prinsip desain:
* **Bersih & Lapang (Clean & Decluttered):** Menghilangkan efek glow neon gelap yang terlalu ramai, menggantikannya dengan kanvas cerah yang seimbang, kontras tinggi, dan ruang bernapas yang nyaman bagi mata.
* **Taktil & Fisik (Physical Tactility):** Tetap mempertahankan bayangan ganda halus (*directional ambient shadow*), bevel cahaya tepi atas (*highlight edge*), lekukan terbenam (*sunken wells*), dan tombol fisik 3D dengan respons gerak `:active`.

### Token Desain Light Skeuomorphism

| Token Desain | Nilai Visual | Peruntukan Elemen |
| :--- | :--- | :--- |
| **Porcelain Canvas** | `#f1f5f9` / Radial `#ffffff` ➔ `#e2e8f0` | Latar belakang dasar aplikasi (*viewport background*) |
| **Raised Panel** | `linear-gradient(165deg, #ffffff, #f1f5f9)` | Panel kartu instrumen utama & kontainer modul |
| **Sunken Well (LCD)** | `linear-gradient(180deg, #e2e8f0, #edf2f7)` | Display angka saldo, bidang input form, dan track slider |
| **Polished Rivets** | Radial Chrome `#ffffff` ➔ `#cbd5e1` ➔ `#94a3b8` | Aksen baut rivet logam di setiap sudut sasis panel |
| **Primary Tactile Blue** | `linear-gradient(180deg, #0284c7, #075985)` | Tombol aksi utama (*Catat Transaksi*, *Hitung Investasi*) |
| **Emerald Tactile** | `linear-gradient(180deg, #10b981, #047857)` | Tombol simpan pemasukan, indikator surplus, saldo positif |
| **Rose Tactile** | `linear-gradient(180deg, #f43f5e, #be123c)` | Tombol pengeluaran, badge outflow, tombol reset bahaya |
| **Realistic Cards** | Sapphire Blue, Emerald Forest, Cyan Gradient | Kartu fisik rekening bank, kas fisik, dan dompet digital |
| **Gold IC Microchip** | `linear-gradient(135deg, #fde68a, #d97706, #b45309)` | Sirkuit fisik chip ATM pada setiap kartu rekening |
| **Embossed Text** | *Multi-layer offset shadow* `#ffffff` & `#000000` | Huruf & angka timbul pada kartu dompet |

---

## 4. Matriks Pengujian & Verifikasi Kualitas (QA Test Matrix)

| ID Test | Modul / Fitur | Skenario Pengujian | Hasil Pengujian | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **Net Worth Aggregator** | Menghitung akumulasi saldo seluruh dompet aktif saat transaksi ditambah/dihapus. | Total saldo terkalkulasi tepat secara *real-time*. | **PASSED** |
| **TC-02** | **Transaksi Pemasukan** | Menambah mutasi Income Rp 5.000.000 ke Rekening Utama. | Saldo dompet bertambah Rp 5.000.000 dan tercatat di buku kas. | **PASSED** |
| **TC-03** | **Transaksi Pengeluaran** | Menambah mutasi Expense Rp 150.000 dari Dompet Tunai. | Saldo dompet berkurang Rp 150.000 dan budget meter terupdate. | **PASSED** |
| **TC-04** | **Mutasi Transfer Antar Dompet** | Transfer Rp 500.000 dari BCA ke GoPay. | Saldo BCA -Rp 500.000, GoPay +Rp 500.000, Net Worth tetap seimbang. | **PASSED** |
| **TC-05** | **Auto-Rollback Saldo** | Menghapus transaksi pengeluaran Rp 45.000 yang telah tersimpan. | Saldo dompet terkait otomatis dikembalikan +Rp 45.000. | **PASSED** |
| **TC-06** | **Proteksi Hapus Dompet** | Mencoba menghapus dompet yang masih memiliki riwayat mutasi transaksi. | Sistem menolak penghapusan dan memunculkan toast error informatif. | **PASSED** |
| **TC-07** | **Filter & Pencarian Real-Time** | Menyaring data dengan kata kunci, kategori, jenis dompet, dan rentang tanggal. | Tabel menyaring instan tanpa kedipan/reload halaman. | **PASSED** |
| **TC-08** | **Paginasi Transaksi** | Navigasi halaman tabel transaksi dengan batas 8 data per halaman. | Tombol *Sebelumnya* / *Berikutnya* dan info nomor halaman berfungsi presisi. | **PASSED** |
| **TC-09** | **Simulator Bunga Majemuk** | Menggeser slider modal awal, setoran bulanan, return bunga, dan durasi tahun. | Input angka dan grafik proyeksi sinkron dua arah (*dual-binding*). | **PASSED** |
| **TC-10** | **Impor Mutasi CSV Bank** | Mengunggah file CSV mutasi dengan format `DD/MM/YYYY` dan tanda nominal minus. | Transaksi terkonversi otomatis ke pengeluaran/pemasukan. | **PASSED** |
| **TC-11** | **Ekspor & Pemulihan JSON** | Mengunduh file backup JSON lalu memulihkannya melalui fitur restore. | Seluruh state pulih 100% tanpa kehilangan data. | **PASSED** |
| **TC-12** | **Stealth Mode & PIN Lock** | Mengaktifkan tombol sensor saldo (👁️) dan menetapkan PIN 4-digit. | Seluruh nominal tersamarkan (`Rp ••••••••`) dan PIN tersimpan aman. | **PASSED** |

---

## 5. Ringkasan Perubahan Berkas Kode

1. **`assets/css/styles.css`:**
   - Didesain ulang total menjadi sistem desain *Clean Light Skeuomorphism*.
   - Menyediakan palet permukaan terang bergradien lembut, bayangan elevasi taktil multi-layer, tombol 3D dengan efek tekan, kartu fisik bertekstur, microchip emas, LED status, meter pengukur kapasitas, dan sasis dialog putih melayang.
2. **`index.html`:**
   - Struktur shell SPA diperbarui untuk mendukung tema terang dengan hierarki teks berdaya baca tinggi (*high contrast*).
   - Menambahkan input filter rentang tanggal (*Start Date* & *End Date*) pada tab transaksi.
   - Menambahkan modal dialog baru `modal-goal-deposit` untuk setor tabungan langsung ke target.
3. **`assets/js/utils.js`:**
   - Menyempurnakan parser CSV mutasi bank (`parseBankCSV`) untuk menangani berbagai variasi format tanggal dan pemisah baris.
   - Menambahkan helper penformatan label bulan (`formatMonthLabel`).
4. **`assets/js/state.js`:**
   - Memperbaiki metode eksekusi otomatisasi transaksi berulang (`processDueRecurring`) untuk mencegah *recursion loop*.
   - Menambahkan penanganan mutasi deposit target menabung (`updateGoalDeposit`).
   - Memastikan setelan bawaan tema adalah `light-skeuomorph`.
5. **`assets/js/app.js`:**
   - Mengonfigurasi grafik Chart.js dengan tema terang (garis grid halus, tipografi kontras, dan tooltip bergaya kartu fisik).
   - Mengubah grafik cashflow menjadi agregasi arus kas bulanan.
   - Menghubungkan seluruh kontrol filter baru (pencarian, kategori, dompet, tipe, rentang tanggal, paginasi).
   - Menghubungkan logika setor dana target menabung dan transaksi rutin.

---

## 6. Kesimpulan & Rekomendasi Rilis

Aplikasi **Personal Financial Cockpit** telah berhasil melewati seluruh rangkaian pengujian mutu (*Quality Assurance*), audit logika akuntansi, dan transformasi desain UI ke **Clean Light Skeuomorphism**. Seluruh fitur berjalan stabil, responsif di berbagai ukuran layar (*mobile*, *tablet*, *desktop*), dan 100% selaras dengan blueprint aplikasi pada `README.md`.
