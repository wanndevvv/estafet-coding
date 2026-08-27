# 02 - Fase Pembuatan UI Apps: Skeuomorphism UI Tema Biru Navy

Dokumen ini mendokumentasikan secara komprehensif seluruh proses perancangan, spesifikasi sistem desain, implementasi komponen, dan pencatatan perubahan antarmuka pengguna (UI) aplikasi **Personal Financial Cockpit** dengan pendekatan **Skeuomorphism UI bertema warna Biru Navy (*Deep Navy Cockpit & Tactical Metallic Glass*)**.

---

## 1. Ikhtisar & Konsep Desain (Design Philosophy)

Tujuan utama dari fase ini adalah mentransformasi tampilan antarmuka SPA standar menjadi kokpit keuangan personal yang taktil, realistis, dan berkelas tinggi menggunakan prinsip **Modern Skeuomorphism**:

* **Tema Visual:** *Deep Navy Cockpit & High-Precision Financial Instrument*.
* **Karakteristik Skeuomorfik:**
  * **Bevel & Raised Surfaces:** Panel memiliki elevasi 3D bertingkat dengan batas cahaya tepi atas (*highlight edge*) dan bayangan bawah ganda (*ambient + directional drop shadows*).
  * **Sunken / Recessed Wells:** Display meter, layar kalkulator, dan bidang input seolah dipahat/dibenamkan ke dalam panel instrumen utama dengan bayangan dalam (*inner shadow*).
  * **Tactile 3D Buttons:** Tombol tekan fisik dengan efek pantulan cahaya atas, bayangan kedalaman samping, serta animasi tekanan nyata saat diklik (`:active` *translateY + compressed shadow*).
  * **Physical Realistic Wallet Cards:** Representasi kartu rekening bank dan dompet digital yang menyerupai kartu ATM/kredit fisik asli, lengkap dengan tekstur sirkuit *Gold Microchip IC*, efek kilau holografik diagonal, dan teks cetak timbul (*embossed lettering*).
  * **Backlit LED Status Indicators:** Lampu indikator status bulat dengan pendaran cahaya radial (*radial glow*) dalam 4 status: Hijau (Normal/Inflow), Merah (Warning/Outflow), Cyan (Sistem/Aktif), dan Amber (Peringatan Kapasitas).
  * **Fuel/Liquid Gauge Meters:** Bar pemantauan anggaran bulanan menyerupai pengukur kapasitas mekanis dengan saluran logam terbenam dan cairan indikator berpendar.

---

## 2. Palet Warna & Token Desain (Navy Skeuomorphism Palette)

| Kategori Token | Nilai Warna Hex / RGBA | Peruntukan Elemen |
| :--- | :--- | :--- |
| **Navy Abyss (Base)** | `#060a14` | Latar belakang dasar (*canvas background*) |
| **Navy Deep Radial** | `#172a54` ➔ `#0c162b` | Gradien pencahayaan atmosfer kokpit |
| **Navy Card Raised** | `#18284c` ➔ `#111d38` | Panel kartu elevasi dan kontainer utama |
| **Navy Sunken Well** | `#090e1b` ➔ `#0e172a` | Bidang input terbenam, tabel mutasi, & display LCD |
| **Sky / Ice Cyan** | `#38bdf8` / `#0284c7` | Aksen tombol primer, slider knob, & glow telemetry |
| **Tactical Emerald** | `#10b981` / `#059669` | Indikator pemasukan (*inflow*), status verified, LED aktif |
| **Tactical Rose/Crimson** | `#f43f5e` / `#be123c` | Indikator pengeluaran (*outflow*), tombol bahaya/reset, overlimit |
| **Tactical Amber/Gold** | `#f59e0b` / `#fbbf24` | Chip kartu, peringatan budget 80%, & angka proyeksi aset |
| **Metallic Textures** | `#cbd5e1` ➔ `#94a3b8` | Aksen teks terukir, pelat merk, & baut rivet kokpit |

---

## 3. Rincian Implementasi Berkas & Komponen

### A. Berkas Baru: Stylesheet Sistem Desain (`assets/css/styles.css`)
Dibuat berkas stylesheet mandiri yang mencakup:
1. **Tipografi Modern Berkepadatan Tinggi:** Mengintegrasikan font `Plus Jakarta Sans` untuk hierarki antarmuka dan `JetBrains Mono` untuk seluruh nominal angka keuangan dan pembacaan telemetri.
2. **Preset Bayangan Berlapis (*Multi-Layer Shadows*):**
   * `--shadow-raised-lg`: Digunakan pada kartu modul utama dan popup dialog.
   * `--shadow-sunken`: Digunakan pada area input teks, display meter, dan tabel.
   * `--shadow-btn` & `--shadow-btn-pressed`: Digunakan untuk interaktivitas tombol fisik.
3. **Komponen Skeuomorfik Khusus:**
   * `.skeuo-panel`: Panel bergradien navy dengan garis batas cahaya atas dan bayangan dasar.
   * `.skeuo-rivet`: Aksen baut rivet logam di keempat sudut kartu untuk nuansa konsol instrumen.
   * `.skeuo-card-credit`: Kartu dompet dengan *holographic sheen overlay*.
   * `.skeuo-chip`: Komponen fisik sirkuit IC kartu berbahan dasar emas (*gold brushed*).
   * `.embossed-text`: Efek timbul pada angka saldo dan nama pemegang dompet.
   * `.skeuo-slider`: *Range slider* dengan *sunken track* dan *metallic dial knob*.
   * `.skeuo-modal-box`: Kotak dialog sasis kokpit mengambang (*floating plate*).
   * `.skeuo-badge`: Lencana transaksi taktil untuk *Income*, *Expense*, dan *Transfer*.

### B. Pembaruan Shell SPA (`index.html`)
1. **Cockpit Command Bar (Header):**
   * Pelat identitas *"FINANCIAL COCKPIT"* dengan teks metalik dan lampu LED hijau berstatus *live*.
   * *Segmented Switch Navigation* yang terbenam (*nav-track*) dengan status aktif bercahaya *cyan bar*.
   * Tombol taktil pintas `+ Catat Transaksi` di bilah atas.
2. **Tab 1: Dashboard:**
   * **3 Display Pembacaan Utama:** Total Net Worth (instrumen sentral), Total Pemasukan (LED hijau), dan Total Pengeluaran (LED merah + kalkulasi *Net Surplus*).
   * **Grid Dompet Realistis:** Kartu bank/kas/e-wallet berselubung microchip emas beserta kartu slot `+ Tambah Dompet`.
   * **Budget Gauges:** Bar pengukur dengan persentase real-time dan indikator perubahan status warna dinamis.
   * **Dual Analytics Console:** Visualisasi donat kategori pengeluaran dan grafik batang arus kas.
3. **Tab 2: Riwayat Transaksi & Filtering:**
   * Konsol penyaringan 5 kolom (Pencarian kata kunci, Dropdown Kategori, Dropdown Dompet, Dropdown Tipe, dan Dropdown Pengurutan Data).
   * Tombol *Reset Filter* taktis.
   * Tabel buku besar (*ledger table*) dengan baris terukir dan tombol hapus taktis merah.
   * Kontrol paginasi terpadu (navigasi halaman sebelum/berikutnya dengan batas 8 transaksi per halaman).
4. **Tab 3: Simulator Investasi Bunga Majemuk:**
   * Konsol parameter ganda (*Dual-Binding*): Setiap nilai (Modal Awal, Setoran Bulanan, Bunga Tahunan, dan Durasi) dapat diatur melalui kotak angka maupun *range slider* secara bersamaan.
   * Area grafik proyeksi pertumbuhan aset dengan pendaran gradien *cyan* halus.
   * 3 Panel LCD Ringkasan: Total Modal Pokok, Estimasi Return Bunga, dan Proyeksi Aset Akhir.
5. **Tab 4: Backup & Telemetri Penyimpanan:**
   * Kartu telemetri hardware menampilkan total transaksi, total dompet, ukuran memori *localStorage* (KB), dan waktu sinkronisasi terakhir.
   * Tombol operasional: Ekspor JSON, Ekspor CSV, Impor JSON, dan *Factory Reset Emergency Switch* dengan garis bahaya.
6. **Modals Dialog & Toast Notifications:**
   * Modal Tambah Transaksi dengan selektor tipe tersegmentasi (*Expense / Income / Transfer*).
   * Modal Tambah Dompet dengan selektor jenis akun dan palet warna.
   * Kontainer *Floating Toast Notification* taktis dengan status LED (hijau untuk sukses, merah untuk error, kuning untuk warning).

### C. Penyesuaian Logika & Pengendali (`assets/js/`)
1. **`assets/js/app.js`:**
   * Integrasi tema gelap Chart.js (gridline `rgba(255,255,255,0.06)`, label warna slate, dan *skeuomorphic tooltip*).
   * Sinkronisasi slider investasi dengan input numerik secara dua arah.
   * Logika paginasi, filter pencarian multi-kriteria, dan pengurutan data transaksi.
   * Sistem notifikasi `showToast()` pengganti `alert()` standar browser.
2. **`assets/js/state.js`:**
   * Penambahan fungsi telemetri penyimpanan lokal (`getStorageTelemetry()`).
   * Validasi penghapusan dompet agar mencegah hilangnya dompet yang terikat pada riwayat transaksi.
   * Dukungan sinkronisasi otomatis status timestamp dan persistensi data.
3. **`assets/js/utils.js`:**
   * Helper `formatCompactNumber()` untuk penyederhanaan label sumbu grafik (misal: 10 Juta, 1 Miliar).
   * Helper `formatDateISO()` untuk penyesuaian nilai input tanggal default.

---

## 4. Log Perubahan Proyek (Changelog UI Phase)

### [2026-08-27] - Rilis Desain Skeuomorphism UI Tema Biru Navy

#### Ditambahkan (Added)
- Berkas stylesheet `assets/css/styles.css` berisi sistem desain skeuomorfik tema biru navy lengkap.
- Komponen fisik sirkuit *Gold Microchip IC* dan teks timbul pada kartu dompet rekening.
- Konsol telemetri status penyimpanan lokal pada modul Backup & Storage.
- Sistem notifikasi *floating toast* taktis dengan iluminasi LED.
- Mekanisme paginasi data dan pengurutan (Sort by Date / Amount) pada modul transaksi.
- Sinkronisasi dua arah (*dual-binding*) kontrol slider dan input angka pada modul simulator investasi.

#### Diperbarui (Changed)
- `index.html`: Dirombak total dengan layout kokpit skeuomorfik, sistem navigasi tersegmentasi, sasis modal rivet, dan panel instrumen finansial.
- `assets/js/app.js`: Diperbarui untuk mendukung visualisasi Chart.js tema navy gelap, penanganan notifikasi toast, paginasi, dan interaksi slider.
- `assets/js/state.js`: Dilengkapi dengan fungsi telemetri memori dan proteksi relasi dompet-transaksi.
- `assets/js/utils.js`: Ditambahkan fungsi utilitas penformatan angka ringkas dan tanggal ISO.
