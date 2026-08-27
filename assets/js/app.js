/**
 * Application Controller & Skeuomorphic UI Renderer
 * Personal Financial Cockpit (Navy Blue Skeuomorphism Edition)
 */

let categoryChartInstance = null;
let cashflowChartInstance = null;
let investmentChartInstance = null;

// Pagination & Sorting State for Transactions
let txCurrentPage = 1;
const TX_PER_PAGE = 8;
let txSortBy = "date_desc";

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // Subscribe UI to State changes
  store.subscribe(renderAll);

  // Set default date for transaction form
  const dateInput = document.getElementById("tx-date");
  if (dateInput) {
    dateInput.value = formatDateISO();
  }

  // Setup dual bindings for investment sliders
  setupInvestmentSliders();

  // Initial full render
  renderAll();
  runSimulation();
  updateTelemetry();
});

/* ==========================================================================
   NAVIGATION & TAB ROUTING
   ========================================================================== */

function switchTab(tabId) {
  const tabs = ["dashboard", "transactions", "simulator", "settings"];
  
  tabs.forEach((tab) => {
    const tabEl = document.getElementById(`tab-${tab}`);
    const navEl = document.getElementById(`nav-${tab}`);
    
    if (tab === tabId) {
      if (tabEl) tabEl.classList.remove("hidden");
      if (navEl) navEl.classList.add("active");
    } else {
      if (tabEl) tabEl.classList.add("hidden");
      if (navEl) navEl.classList.remove("active");
    }
  });

  // Re-render icons and charts if needed on tab switch
  if (window.lucide) lucide.createIcons();
  
  if (tabId === "dashboard") {
    setTimeout(renderCharts, 50);
  } else if (tabId === "simulator") {
    setTimeout(runSimulation, 50);
  } else if (tabId === "settings") {
    updateTelemetry();
  }
}

/* ==========================================================================
   TOAST NOTIFICATION SYSTEM (SKEUOMORPHIC)
   ========================================================================== */

function showToast(message, type = "info") {
  const container = document.getElementById("cockpit-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `skeuo-panel p-4 flex items-center gap-3 shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 border`;
  
  let ledClass = "skeuo-led-cyan";
  let borderColor = "border-sky-500/40";
  let iconName = "info";

  if (type === "success") {
    ledClass = "skeuo-led-green";
    borderColor = "border-emerald-500/40";
    iconName = "check-circle-2";
  } else if (type === "error") {
    ledClass = "skeuo-led-red";
    borderColor = "border-rose-500/40";
    iconName = "alert-octagon";
  } else if (type === "warning") {
    ledClass = "skeuo-led-amber";
    borderColor = "border-amber-500/40";
    iconName = "alert-triangle";
  }

  toast.classList.add(borderColor);
  toast.innerHTML = `
    <div class="skeuo-led ${ledClass} shrink-0"></div>
    <div class="text-sm font-semibold text-slate-100 flex-1">${message}</div>
    <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-white text-xs">&times;</button>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  }, 10);

  // Auto dismiss after 3.5s
  setTimeout(() => {
    toast.classList.add("translate-y-4", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/* ==========================================================================
   MODAL CONTROLLERS
   ========================================================================== */

function toggleModal(modalId, show) {
  const el = document.getElementById(modalId);
  if (!el) return;

  if (show) {
    el.classList.remove("hidden");
    if (modalId === "modal-transaction") {
      populateDropdowns();
      setTxType('expense');
    }
  } else {
    el.classList.add("hidden");
  }
  if (window.lucide) lucide.createIcons();
}

function setTxType(type) {
  const hiddenInput = document.getElementById("tx-type");
  if (hiddenInput) hiddenInput.value = type;

  // Update visual buttons
  const buttons = document.querySelectorAll(".tx-type-selector-btn");
  buttons.forEach((btn) => {
    if (btn.dataset.type === type) {
      btn.className = "tx-type-selector-btn skeuo-btn flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all " + 
        (type === 'expense' ? 'skeuo-btn-rose text-white' : type === 'income' ? 'skeuo-btn-emerald text-white' : 'skeuo-btn-primary text-white');
    } else {
      btn.className = "tx-type-selector-btn skeuo-btn skeuo-btn-secondary flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold text-slate-300";
    }
  });

  const targetField = document.getElementById("field-wallet-target");
  const catField = document.getElementById("field-category");

  if (type === "transfer") {
    if (targetField) targetField.classList.remove("hidden");
    if (catField) catField.classList.add("hidden");
  } else {
    if (targetField) targetField.classList.add("hidden");
    if (catField) catField.classList.remove("hidden");
  }

  // Filter categories by type (income vs expense)
  filterCategoryDropdown(type);
}

function filterCategoryDropdown(type) {
  const state = store.getState();
  const catSelect = document.getElementById("tx-category");
  if (!catSelect) return;

  const validCats = state.categories.filter((c) => c.type === type);
  catSelect.innerHTML = validCats
    .map((c) => `<option value="${c.id}">${c.name}</option>`)
    .join("");
}

function populateDropdowns() {
  const state = store.getState();
  const walletSelect = document.getElementById("tx-wallet");
  const targetWalletSelect = document.getElementById("tx-target-wallet");

  if (walletSelect) {
    walletSelect.innerHTML = state.wallets
      .map((w) => `<option value="${w.id}">${w.name} — (${formatCurrency(w.balance)})</option>`)
      .join("");
  }

  if (targetWalletSelect) {
    targetWalletSelect.innerHTML = state.wallets
      .map((w) => `<option value="${w.id}">${w.name} — (${formatCurrency(w.balance)})</option>`)
      .join("");
  }
}

/* ==========================================================================
   MASTER RENDER LOGIC
   ========================================================================== */

function renderAll() {
  renderMetrics();
  renderWallets();
  renderBudgets();
  renderTransactions();
  renderCharts();
  populateFilterOptions();
  updateTelemetry();
}

/* 1. Cockpit Metrics */
function renderMetrics() {
  const state = store.getState();
  const netWorth = state.wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  const netSavings = totalIncome - totalExpense;

  const netWorthEl = document.getElementById("stat-net-worth");
  const incomeEl = document.getElementById("stat-income");
  const expenseEl = document.getElementById("stat-expense");
  const savingsEl = document.getElementById("stat-savings");
  const walletCountEl = document.getElementById("stat-wallet-count");

  if (netWorthEl) netWorthEl.innerText = formatCurrency(netWorth);
  if (incomeEl) incomeEl.innerText = formatCurrency(totalIncome);
  if (expenseEl) expenseEl.innerText = formatCurrency(totalExpense);
  if (savingsEl) {
    savingsEl.innerText = (netSavings >= 0 ? "+" : "") + formatCurrency(netSavings);
    savingsEl.className = `text-sm font-bold ${netSavings >= 0 ? "text-emerald-400" : "text-rose-400"}`;
  }
  if (walletCountEl) {
    walletCountEl.innerText = `${state.wallets.length} Dompet Aktif`;
  }
}

/* 2. Wallets (Skeuomorphic Physical Cards) */
function renderWallets() {
  const state = store.getState();
  const container = document.getElementById("wallet-list-container");
  if (!container) return;

  const walletCardsHtml = state.wallets
    .map((w) => {
      let iconType = "credit-card";
      let typeLabel = "BANK REKENING";
      let gradientStyle = `background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);`;

      if (w.type === "cash") {
        iconType = "banknote";
        typeLabel = "UANG TUNAI";
        gradientStyle = `background: linear-gradient(135deg, #065f46 0%, #064e3b 100%);`;
      } else if (w.type === "ewallet") {
        iconType = "smartphone";
        typeLabel = "DOMPET DIGITAL";
        gradientStyle = `background: linear-gradient(135deg, #0e7490 0%, #155e75 100%);`;
      }

      return `
      <div class="skeuo-card-credit p-5 flex flex-col justify-between min-h-[175px] relative" style="${gradientStyle}">
        <div class="flex justify-between items-start z-10">
          <div class="flex items-center gap-2">
            <div class="skeuo-chip"></div>
            <span class="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-black/40 text-sky-200 border border-white/10 uppercase">${typeLabel}</span>
          </div>
          <button onclick="handleDeleteWallet('${w.id}')" title="Hapus Dompet" class="text-white/40 hover:text-rose-400 hover:scale-110 transition p-1">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>

        <div class="my-auto pt-2 z-10">
          <p class="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">${w.name}</p>
          <h4 class="text-2xl font-extrabold font-mono text-white embossed-text mt-0.5 tracking-tight">${formatCurrency(w.balance)}</h4>
        </div>

        <div class="flex justify-between items-center text-[10px] font-mono text-slate-300/80 uppercase tracking-widest pt-2 border-t border-white/10 z-10">
          <span>COCKPIT VERIFIED</span>
          <span class="flex items-center gap-1 font-bold text-white"><i data-lucide="${iconType}" class="w-3.5 h-3.5 text-sky-300"></i> ${w.id.toUpperCase()}</span>
        </div>
      </div>
    `;
    })
    .join("");

  // Add "Tambah Dompet" Slot Card
  const addWalletSlot = `
    <button onclick="toggleModal('modal-wallet', true)" class="skeuo-panel border-2 border-dashed border-sky-500/30 hover:border-sky-400/70 p-5 rounded-2xl flex flex-col items-center justify-center min-h-[175px] group transition-all text-slate-400 hover:text-sky-300 cursor-pointer">
      <div class="w-12 h-12 rounded-full skeuo-sunken flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition">
        <i data-lucide="plus" class="w-6 h-6 text-sky-400"></i>
      </div>
      <span class="font-bold text-xs uppercase tracking-wider text-slate-300 group-hover:text-sky-300">+ Tambah Dompet / Rekening</span>
      <span class="text-[11px] text-slate-500 mt-1">Multi-rekening & Bank</span>
    </button>
  `;

  container.innerHTML = walletCardsHtml + addWalletSlot;
  if (window.lucide) lucide.createIcons();
}

function handleDeleteWallet(id) {
  const state = store.getState();
  const wallet = state.wallets.find((w) => w.id === id);
  if (!wallet) return;

  if (confirm(`Apakah Anda yakin ingin menghapus dompet "${wallet.name}"?`)) {
    const res = store.deleteWallet(id);
    if (!res.success) {
      showToast(res.message, "error");
    } else {
      showToast(`Dompet "${wallet.name}" berhasil dihapus.`, "success");
    }
  }
}

/* 3. Budget Meters (Gauge Style) */
function renderBudgets() {
  const state = store.getState();
  const container = document.getElementById("budget-meter-container");
  if (!container) return;

  if (state.budgets.length === 0) {
    container.innerHTML = `
      <div class="skeuo-sunken p-6 text-center text-xs text-slate-400 rounded-xl">
        <i data-lucide="pie-chart" class="w-8 h-8 mx-auto mb-2 text-slate-500"></i>
        Belum ada limit anggaran. Klik tombol di atas untuk menambah anggaran.
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = state.budgets
    .map((b) => {
      const cat = state.categories.find((c) => c.id === b.categoryId);
      const spent = state.transactions
        .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
      const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));
      const isExceeded = spent > b.monthlyLimit;
      const isWarning = percent >= 80;

      let meterColor = "background: linear-gradient(90deg, #38bdf8 0%, #2563eb 100%);";
      let ledType = "skeuo-led-cyan";

      if (isExceeded) {
        meterColor = "background: linear-gradient(90deg, #f43f5e 0%, #be123c 100%); box-shadow: 0 0 10px rgba(244,63,94,0.6);";
        ledType = "skeuo-led-red";
      } else if (isWarning) {
        meterColor = "background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);";
        ledType = "skeuo-led-amber";
      }

      return `
      <div class="skeuo-card-flat p-4 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="skeuo-led ${ledType}"></div>
            <span class="text-xs font-bold text-slate-200">${cat ? cat.name : "Kategori"}</span>
          </div>
          <span class="text-xs font-mono font-bold ${isExceeded ? "text-rose-400" : isWarning ? "text-amber-400" : "text-sky-300"}">
            ${percent}%
          </span>
        </div>

        <!-- Gauge Bar -->
        <div class="skeuo-meter-track h-3.5">
          <div class="skeuo-meter-fill" style="width: ${percent}%; ${meterColor}"></div>
        </div>

        <div class="flex justify-between items-center text-[11px] text-slate-400 font-mono pt-1">
          <span>Terpakai: <strong class="text-slate-200">${formatCurrency(spent)}</strong></span>
          <span>Limit: <strong class="text-slate-200">${formatCurrency(b.monthlyLimit)}</strong></span>
        </div>
      </div>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
}

/* 4. Transactions List with Filter, Sort, and Pagination */
function renderTransactions() {
  const state = store.getState();
  const tbody = document.getElementById("transaction-table-body");
  if (!tbody) return;

  const search = document.getElementById("filter-search")?.value.toLowerCase() || "";
  const catId = document.getElementById("filter-category")?.value || "";
  const walletId = document.getElementById("filter-wallet")?.value || "";
  const type = document.getElementById("filter-type")?.value || "";
  const sort = document.getElementById("filter-sort")?.value || txSortBy;
  txSortBy = sort;

  let filtered = state.transactions.filter((t) => {
    const matchSearch = (t.notes || "").toLowerCase().includes(search);
    const matchCat = catId ? t.categoryId === catId : true;
    const matchWallet = walletId ? t.walletId === walletId || t.targetWalletId === walletId : true;
    const matchType = type ? t.type === type : true;
    return matchSearch && matchCat && matchWallet && matchType;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (txSortBy === "date_desc") return new Date(b.date) - new Date(a.date);
    if (txSortBy === "date_asc") return new Date(a.date) - new Date(b.date);
    if (txSortBy === "amount_desc") return parseFloat(b.amount) - parseFloat(a.amount);
    if (txSortBy === "amount_asc") return parseFloat(a.amount) - parseFloat(b.amount);
    return 0;
  });

  // Pagination Calculation
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / TX_PER_PAGE));
  if (txCurrentPage > totalPages) txCurrentPage = totalPages;
  if (txCurrentPage < 1) txCurrentPage = 1;

  const startIndex = (txCurrentPage - 1) * TX_PER_PAGE;
  const paginatedData = filtered.slice(startIndex, startIndex + TX_PER_PAGE);

  // Update Pagination Controls Info
  const pageInfoEl = document.getElementById("tx-page-info");
  const prevBtn = document.getElementById("tx-prev-page");
  const nextBtn = document.getElementById("tx-next-page");

  if (pageInfoEl) pageInfoEl.innerText = `Hal ${txCurrentPage} dari ${totalPages} (${totalItems} data)`;
  if (prevBtn) prevBtn.disabled = txCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = txCurrentPage >= totalPages;

  if (paginatedData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-10 text-center text-slate-400">
          <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-2 text-slate-600"></i>
          <p class="text-sm font-semibold">Tidak ada data transaksi ditemukan.</p>
          <p class="text-xs text-slate-500 mt-1">Coba sesuaikan kriteria filter atau buat transaksi baru.</p>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = paginatedData
    .map((t) => {
      const wallet = state.wallets.find((w) => w.id === t.walletId);
      const targetWallet = state.wallets.find((w) => w.id === t.targetWalletId);
      const category = state.categories.find((c) => c.id === t.categoryId);

      let badgeHtml = `<span class="skeuo-badge skeuo-badge-expense"><i data-lucide="arrow-up-right" class="w-3 h-3"></i> Pengeluaran</span>`;
      let amountColor = "text-rose-400";
      let amountPrefix = "-";

      if (t.type === "income") {
        badgeHtml = `<span class="skeuo-badge skeuo-badge-income"><i data-lucide="arrow-down-left" class="w-3 h-3"></i> Pemasukan</span>`;
        amountColor = "text-emerald-400";
        amountPrefix = "+";
      } else if (t.type === "transfer") {
        badgeHtml = `<span class="skeuo-badge skeuo-badge-transfer"><i data-lucide="refresh-cw" class="w-3 h-3"></i> Transfer</span>`;
        amountColor = "text-sky-400";
        amountPrefix = "";
      }

      let walletName = wallet ? wallet.name : "-";
      if (t.type === "transfer" && targetWallet) {
        walletName = `<span class="text-slate-300 font-semibold">${wallet ? wallet.name : "-"}</span> <span class="text-sky-400 font-bold">➔</span> <span class="text-slate-300 font-semibold">${targetWallet.name}</span>`;
      }

      return `
      <tr class="hover:bg-slate-800/40 border-b border-slate-800/80 transition-colors">
        <td class="py-3.5 px-4 font-mono text-xs text-slate-300 whitespace-nowrap">${formatDate(t.date)}</td>
        <td class="py-3.5 px-4 whitespace-nowrap">${badgeHtml}</td>
        <td class="py-3.5 px-4 text-xs text-slate-200 font-medium">${walletName}</td>
        <td class="py-3.5 px-4 text-xs text-slate-300">${category ? category.name : '<span class="text-slate-500">-</span>'}</td>
        <td class="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate" title="${t.notes || ""}">${t.notes || '<span class="text-slate-600">Tanpa catatan</span>'}</td>
        <td class="py-3.5 px-4 text-right font-mono font-bold text-sm ${amountColor} whitespace-nowrap">
          ${amountPrefix}${formatCurrency(t.amount)}
        </td>
        <td class="py-3.5 px-4 text-center whitespace-nowrap">
          <button onclick="handleDeleteTx('${t.id}')" title="Hapus Transaksi" class="skeuo-btn skeuo-btn-rose px-2.5 py-1 text-[11px] rounded">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  if (window.lucide) lucide.createIcons();
}

function changeTxPage(delta) {
  txCurrentPage += delta;
  renderTransactions();
}

function resetTxFilters() {
  const s = document.getElementById("filter-search");
  const c = document.getElementById("filter-category");
  const w = document.getElementById("filter-wallet");
  const t = document.getElementById("filter-type");
  const so = document.getElementById("filter-sort");

  if (s) s.value = "";
  if (c) c.value = "";
  if (w) w.value = "";
  if (t) t.value = "";
  if (so) so.value = "date_desc";

  txCurrentPage = 1;
  renderTransactions();
  showToast("Filter transaksi telah direset", "info");
}

function handleDeleteTx(id) {
  if (confirm("Hapus transaksi ini? Saldo dompet akan dikembalikan secara otomatis.")) {
    const success = store.deleteTransaction(id);
    if (success) {
      showToast("Transaksi berhasil dihapus & saldo dompet dipulihkan!", "success");
    }
  }
}

function populateFilterOptions() {
  const state = store.getState();
  const catFilter = document.getElementById("filter-category");
  const walletFilter = document.getElementById("filter-wallet");

  if (catFilter && catFilter.options.length <= 1) {
    state.categories.forEach((c) => {
      catFilter.add(new Option(c.name, c.id));
    });
  }
  if (walletFilter && walletFilter.options.length <= 1) {
    state.wallets.forEach((w) => {
      walletFilter.add(new Option(w.name, w.id));
    });
  }
}

/* 5. Chart.js Skeuomorphic Visualizations */
function renderCharts() {
  const state = store.getState();

  // 1. Doughnut Chart: Category Breakdown
  const catCanvas = document.getElementById("chart-category");
  if (catCanvas) {
    const ctxCat = catCanvas.getContext("2d");
    const expenseCats = state.categories.filter((c) => c.type === "expense");
    const catData = expenseCats.map((cat) => {
      return state.transactions
        .filter((t) => t.type === "expense" && t.categoryId === cat.id)
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
    });

    const hasData = catData.some((v) => v > 0);

    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctxCat, {
      type: "doughnut",
      data: {
        labels: expenseCats.map((c) => c.name),
        datasets: [
          {
            data: hasData ? catData : [1],
            backgroundColor: hasData
              ? expenseCats.map((c) => c.color)
              : ["#1e293b"],
            borderColor: "#101a33",
            borderWidth: 3,
            hoverOffset: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#94a3b8",
              boxWidth: 12,
              padding: 12,
              font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }
            }
          },
          tooltip: {
            backgroundColor: "#0b1325",
            titleColor: "#38bdf8",
            bodyColor: "#f8fafc",
            borderColor: "rgba(56, 189, 248, 0.4)",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (ctx) {
                if (!hasData) return " Belum ada data pengeluaran";
                return ` ${ctx.label}: ${formatCurrency(ctx.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  // 2. Bar Chart: Cashflow Overview
  const cashflowCanvas = document.getElementById("chart-cashflow");
  if (cashflowCanvas) {
    const ctxCashflow = cashflowCanvas.getContext("2d");
    const totalInc = state.transactions
      .filter((t) => t.type === "income")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
    const totalExp = state.transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);

    if (cashflowChartInstance) cashflowChartInstance.destroy();

    cashflowChartInstance = new Chart(ctxCashflow, {
      type: "bar",
      data: {
        labels: ["Ringkasan Kas Masuk vs Keluar"],
        datasets: [
          {
            label: "Pemasukan",
            data: [totalInc],
            backgroundColor: "#10b981",
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 45
          },
          {
            label: "Pengeluaran",
            data: [totalExp],
            backgroundColor: "#f43f5e",
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 45
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "rgba(255, 255, 255, 0.06)" },
            ticks: {
              color: "#94a3b8",
              font: { family: "JetBrains Mono", size: 10 },
              callback: (v) => formatCompactNumber(v)
            }
          },
          x: {
            grid: { display: false },
            ticks: {
              color: "#cbd5e1",
              font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: "#94a3b8",
              boxWidth: 12,
              font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }
            }
          },
          tooltip: {
            backgroundColor: "#0b1325",
            titleColor: "#38bdf8",
            bodyColor: "#f8fafc",
            borderColor: "rgba(56, 189, 248, 0.4)",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (ctx) {
                return ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`;
              }
            }
          }
        }
      }
    });
  }
}

/* ==========================================================================
   FORM SUBMISSION HANDLERS
   ========================================================================== */

function handleTransactionSubmit(e) {
  e.preventDefault();
  const type = document.getElementById("tx-type").value;
  const amount = parseFloat(document.getElementById("tx-amount").value);
  const walletId = document.getElementById("tx-wallet").value;
  const targetWalletId = document.getElementById("tx-target-wallet").value;
  const categoryId = document.getElementById("tx-category").value;
  const date = document.getElementById("tx-date").value;
  const notes = document.getElementById("tx-notes").value;

  if (!amount || amount <= 0) {
    showToast("Nominal transaksi harus lebih dari 0!", "error");
    return;
  }

  if (type === "transfer" && walletId === targetWalletId) {
    showToast("Dompet asal dan tujuan tidak boleh sama!", "error");
    return;
  }

  store.addTransaction({
    type,
    amount,
    walletId,
    targetWalletId: type === "transfer" ? targetWalletId : null,
    categoryId: type !== "transfer" ? categoryId : null,
    date: date || formatDateISO(),
    notes
  });

  toggleModal("modal-transaction", false);
  document.getElementById("form-transaction").reset();
  showToast("Transaksi berhasil dicatat ke Cockpit!", "success");
}

function handleWalletSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("wallet-name").value.trim();
  const type = document.getElementById("wallet-type").value;
  const balance = parseFloat(document.getElementById("wallet-balance").value) || 0;
  const color = document.getElementById("wallet-color").value || "#2563EB";

  if (!name) {
    showToast("Nama dompet tidak boleh kosong!", "error");
    return;
  }

  store.addWallet({ name, type, balance, color });
  toggleModal("modal-wallet", false);
  document.getElementById("form-wallet").reset();
  showToast(`Dompet "${name}" berhasil ditambahkan!`, "success");
}

/* ==========================================================================
   SIMULATOR INVESTASI (COMPOUND INTEREST)
   ========================================================================== */

function setupInvestmentSliders() {
  const syncPairs = [
    { num: "sim-principal", range: "sim-principal-range" },
    { num: "sim-monthly", range: "sim-monthly-range" },
    { num: "sim-rate", range: "sim-rate-range" },
    { num: "sim-years", range: "sim-years-range" }
  ];

  syncPairs.forEach(({ num, range }) => {
    const numEl = document.getElementById(num);
    const rangeEl = document.getElementById(range);
    if (!numEl || !rangeEl) return;

    rangeEl.addEventListener("input", (e) => {
      numEl.value = e.target.value;
      runSimulation();
    });

    numEl.addEventListener("input", (e) => {
      rangeEl.value = e.target.value;
      runSimulation();
    });
  });
}

function runSimulation() {
  const principal = parseFloat(document.getElementById("sim-principal")?.value) || 0;
  const monthly = parseFloat(document.getElementById("sim-monthly")?.value) || 0;
  const rate = parseFloat(document.getElementById("sim-rate")?.value) || 0;
  const years = parseInt(document.getElementById("sim-years")?.value) || 1;

  const result = calculateCompoundInterest(principal, monthly, rate, years);
  const labels = result.map((r) => `Thn ${r.year}`);
  const totalBalances = result.map((r) => r.totalBalance);
  const totalInvesteds = result.map((r) => r.totalInvested);

  const simCanvas = document.getElementById("chart-investment");
  if (!simCanvas) return;
  const ctxSim = simCanvas.getContext("2d");

  if (investmentChartInstance) investmentChartInstance.destroy();

  // Create Gradient
  const grad = ctxSim.createLinearGradient(0, 0, 0, 300);
  grad.addColorStop(0, "rgba(56, 189, 248, 0.4)");
  grad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

  investmentChartInstance = new Chart(ctxSim, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Total Nilai Portfolio",
          data: totalBalances,
          borderColor: "#38bdf8",
          backgroundColor: grad,
          borderWidth: 3,
          pointBackgroundColor: "#38bdf8",
          pointRadius: 4,
          fill: true,
          tension: 0.35
        },
        {
          label: "Total Modal Pokok",
          data: totalInvesteds,
          borderColor: "#94a3b8",
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255, 255, 255, 0.06)" },
          ticks: {
            color: "#94a3b8",
            font: { family: "JetBrains Mono", size: 10 },
            callback: (v) => formatCompactNumber(v)
          }
        },
        x: {
          grid: { color: "rgba(255, 255, 255, 0.04)" },
          ticks: {
            color: "#94a3b8",
            font: { family: "Plus Jakarta Sans", size: 11 }
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: "#cbd5e1",
            font: { family: "Plus Jakarta Sans", size: 11, weight: "600" }
          }
        },
        tooltip: {
          backgroundColor: "#0b1325",
          titleColor: "#38bdf8",
          bodyColor: "#f8fafc",
          borderColor: "rgba(56, 189, 248, 0.4)",
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function (ctx) {
              return ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`;
            }
          }
        }
      }
    }
  });

  const last = result[result.length - 1];
  const summaryEl = document.getElementById("sim-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="skeuo-card-flat p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Modal Pokok</span>
        <strong class="text-base font-mono text-slate-200 mt-1">${formatCurrency(last.totalInvested)}</strong>
      </div>
      <div class="skeuo-card-flat p-4 flex flex-col items-center justify-center">
        <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Estimasi Return Bunga</span>
        <strong class="text-base font-mono text-emerald-400 mt-1">+${formatCurrency(last.interestEarned)}</strong>
      </div>
      <div class="skeuo-card-flat p-4 flex flex-col items-center justify-center border-sky-500/30">
        <span class="text-[10px] font-bold uppercase tracking-wider text-sky-400">Proyeksi Aset Akhir</span>
        <strong class="text-lg font-mono golden-text mt-1">${formatCurrency(last.totalBalance)}</strong>
      </div>
    `;
  }
}

/* ==========================================================================
   BACKUP & STORAGE TELEMETRY HANDLERS
   ========================================================================== */

function updateTelemetry() {
  const telemetry = store.getStorageTelemetry();
  const txCountEl = document.getElementById("tel-tx-count");
  const walletCountEl = document.getElementById("tel-wallet-count");
  const sizeEl = document.getElementById("tel-storage-size");
  const syncEl = document.getElementById("tel-last-sync");

  if (txCountEl) txCountEl.innerText = telemetry.txCount;
  if (walletCountEl) walletCountEl.innerText = telemetry.walletCount;
  if (sizeEl) sizeEl.innerText = `${telemetry.kb} KB`;
  if (syncEl) syncEl.innerText = formatDate(telemetry.lastSync);
}

function exportJSON() {
  const jsonStr = JSON.stringify(store.getState(), null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financial_cockpit_backup_${formatDateISO()}.json`;
  a.click();
  showToast("File backup JSON berhasil diunduh!", "success");
}

function exportCSV() {
  const state = store.getState();
  let csv = "ID,Tanggal,Tipe,Nominal,Dompet Asal,Dompet Tujuan,Kategori,Catatan\n";
  state.transactions.forEach((t) => {
    const w = state.wallets.find((item) => item.id === t.walletId);
    const tw = state.wallets.find((item) => item.id === t.targetWalletId);
    const c = state.categories.find((item) => item.id === t.categoryId);
    csv += `"${t.id}","${t.date}","${t.type}",${t.amount},"${w ? w.name : ""}","${tw ? tw.name : ""}","${c ? c.name : ""}","${(t.notes || "").replace(/"/g, '""')}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cockpit_transactions_${formatDateISO()}.csv`;
  a.click();
  showToast("Data transaksi berhasil diekspor ke format CSV!", "success");
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.wallets && Array.isArray(data.wallets) && data.transactions && Array.isArray(data.transactions)) {
        store.setState(data);
        showToast("State Cockpit berhasil dipulihkan dari JSON!", "success");
      } else {
        showToast("Format JSON tidak valid atau struktur tidak cocok!", "error");
      }
    } catch (err) {
      showToast("Gagal membaca atau mem-parsing file JSON!", "error");
    }
  };
  reader.readAsText(file);
  // reset file input
  event.target.value = "";
}

function resetData() {
  if (confirm("PERINGATAN: Apakah Anda yakin ingin mereset seluruh data aplikasi ke kondisi bawaan awal? Tindakan ini tidak dapat dibatalkan.")) {
    store.resetState();
    showToast("Seluruh data telah direset ke setelan awal pabrik.", "warning");
  }
}

/* ==========================================================================
   FASE 3: STEALTH, PIN, GOALS, RECURRING & BANK CSV HANDLERS
   ========================================================================== */

function toggleStealthUI() {
  const isStealth = store.toggleStealthMode();
  showToast(isStealth ? "Mode Penyamaran Saldo DIBUKA (Stealth Active)" : "Mode Penyamaran Saldo DIMATIKAN", isStealth ? "warning" : "info");
  renderAll();
}

function promptSecurityPin() {
  const currentPin = store.getState().settings.securityPin;
  if (!currentPin) {
    const pin = prompt("Buat 4-digit Kode PIN Keamanan Baru:");
    if (pin && pin.length >= 4) {
      store.setSecurityPin(pin);
      showToast("PIN Keamanan berhasil diaktifkan!", "success");
    }
  } else {
    const input = prompt("Masukkan PIN Keamanan untuk membuka/merubah:");
    if (input === currentPin) {
      if (confirm("Hapus kunci PIN keamanan saat ini?")) {
        store.setSecurityPin(null);
        showToast("PIN Keamanan dinonaktifkan.", "info");
      }
    } else {
      showToast("PIN Salah! Akses ditolak.", "error");
    }
  }
}

function renderGoals() {
  const state = store.getState();
  const container = document.getElementById("goals-list-container");
  if (!container) return;

  if (state.goals.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500">Belum ada target menabung.</p>`;
    return;
  }

  container.innerHTML = state.goals
    .map((g) => {
      const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
      return `
      <div class="skeuo-card-flat p-3 space-y-2">
        <div class="flex justify-between items-center text-xs font-bold text-slate-200">
          <span>${g.name}</span>
          <span class="text-sky-400 font-mono">${percent}%</span>
        </div>
        <div class="skeuo-meter-track h-2.5">
          <div class="skeuo-meter-fill bg-sky-400" style="width: ${percent}%;"></div>
        </div>
        <div class="flex justify-between items-center text-[10px] font-mono text-slate-400">
          <span>Terkumpul: ${formatCurrency(g.currentAmount)}</span>
          <span>Target: ${formatCurrency(g.targetAmount)}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

function renderRecurring() {
  const state = store.getState();
  const container = document.getElementById("recurring-list-container");
  if (!container) return;

  if (state.recurring.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 col-span-2">Belum ada transaksi rutin otomatis.</p>`;
    return;
  }

  container.innerHTML = state.recurring
    .map((r) => {
      const cat = state.categories.find((c) => c.id === r.categoryId);
      const wallet = state.wallets.find((w) => w.id === r.walletId);
      return `
      <div class="skeuo-card-flat p-3.5 flex items-center justify-between">
        <div>
          <h5 class="text-xs font-bold text-slate-200">${r.name}</h5>
          <p class="text-[10px] font-mono text-slate-400 mt-0.5">${cat ? cat.name : "Rutin"} • ${wallet ? wallet.name : "-"}</p>
        </div>
        <div class="text-right">
          <span class="text-xs font-mono font-bold ${r.type === "income" ? "text-emerald-400" : "text-rose-400"}">${formatCurrency(r.amount)}</span>
          <button onclick="store.deleteRecurring('${r.id}')" class="block text-[10px] text-rose-400 hover:underline mt-1">Hapus</button>
        </div>
      </div>
    `;
    })
    .join("");
}

function handleGoalSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("goal-name").value;
  const targetAmount = document.getElementById("goal-target").value;
  const currentAmount = document.getElementById("goal-current").value;
  const deadline = document.getElementById("goal-deadline").value;

  store.addGoal({ name, targetAmount, currentAmount, deadline });
  toggleModal("modal-goal", false);
  document.getElementById("form-goal").reset();
  showToast("Target menabung berhasil ditambahkan!", "success");
}

function handleRecurringSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("rec-name").value;
  const type = document.getElementById("rec-type").value;
  const amount = document.getElementById("rec-amount").value;
  const walletId = document.getElementById("rec-wallet").value;
  const categoryId = document.getElementById("rec-category").value;

  store.addRecurring({ name, type, amount, walletId, categoryId, frequency: "monthly", lastProcessed: null });
  toggleModal("modal-recurring", false);
  document.getElementById("form-recurring").reset();
  showToast("Otomatisasi transaksi rutin disimpan!", "success");
}

function handleBankCSVImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const transactions = parseBankCSV(evt.target.result);
    if (transactions.length > 0) {
      const state = store.getState();
      const defaultWallet = state.wallets[0]?.id || "w_main";
      const defaultCatInc = state.categories.find((c) => c.type === "income")?.id || "cat_inc_1";
      const defaultCatExp = state.categories.find((c) => c.type === "expense")?.id || "cat_exp_1";

      transactions.forEach((tx) => {
        store.addTransaction({
          ...tx,
          walletId: defaultWallet,
          targetWalletId: null,
          categoryId: tx.type === "income" ? defaultCatInc : defaultCatExp,
          tags: ["impor-bank"]
        });
      });

      showToast(`Berhasil mengimpor ${transactions.length} mutasi bank dari CSV!`, "success");
    } else {
      showToast("File CSV tidak valid atau tidak memiliki baris transaksi!", "error");
    }
  };
  reader.readAsText(file);
  e.target.value = "";
}

// Hook renderGoals & renderRecurring into master renderAll
const originalRenderAll = renderAll;
renderAll = function () {
  originalRenderAll();
  renderGoals();
  renderRecurring();
  store.processDueRecurring();
};

