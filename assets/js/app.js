/**
 * Application Entrypoint & UI Router & Rendering Logic
 */

let categoryChartInstance = null;
let cashflowChartInstance = null;
let investmentChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  store.subscribe(renderAll);
  document.getElementById("tx-date").valueAsDate = new Date();
  renderAll();
  runSimulation();
});

function switchTab(tabId) {
  const tabs = ["dashboard", "transactions", "simulator", "settings"];
  tabs.forEach((tab) => {
    const tabEl = document.getElementById(`tab-${tab}`);
    const navEl = document.getElementById(`nav-${tab}`);
    if (tab === tabId) {
      tabEl.classList.remove("hidden");
      navEl.classList.add("bg-indigo-700");
    } else {
      tabEl.classList.add("hidden");
      navEl.classList.remove("bg-indigo-700");
    }
  });
}

function toggleModal(modalId, show) {
  const el = document.getElementById(modalId);
  if (show) {
    el.classList.remove("hidden");
    populateDropdowns();
  } else {
    el.classList.add("hidden");
  }
}

function populateDropdowns() {
  const state = store.getState();
  const walletSelect = document.getElementById("tx-wallet");
  const targetWalletSelect = document.getElementById("tx-target-wallet");
  const catSelect = document.getElementById("tx-category");

  walletSelect.innerHTML = state.wallets
    .map((w) => `<option value="${w.id}">${w.name} (${formatCurrency(w.balance)})</option>`)
    .join("");

  targetWalletSelect.innerHTML = state.wallets
    .map((w) => `<option value="${w.id}">${w.name}</option>`)
    .join("");

  catSelect.innerHTML = state.categories
    .map((c) => `<option value="${c.id}">${c.name} (${c.type === "income" ? "Masuk" : "Keluar"})</option>`)
    .join("");
}

function renderAll() {
  renderMetrics();
  renderWallets();
  renderBudgets();
  renderTransactions();
  renderCharts();
  populateFilterOptions();
}

function renderMetrics() {
  const state = store.getState();
  const netWorth = state.wallets.reduce((acc, w) => acc + w.balance, 0);
  const totalIncome = state.transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  const totalExpense = state.transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + parseFloat(t.amount), 0);

  document.getElementById("stat-net-worth").innerText = formatCurrency(netWorth);
  document.getElementById("stat-income").innerText = formatCurrency(totalIncome);
  document.getElementById("stat-expense").innerText = formatCurrency(totalExpense);
}

function renderWallets() {
  const state = store.getState();
  const container = document.getElementById("wallet-list-container");
  container.innerHTML = state.wallets
    .map(
      (w) => `
    <div class="p-4 rounded-lg border border-gray-100 flex items-center justify-between" style="border-left: 4px solid ${w.color}">
      <div>
        <p class="text-xs text-gray-400 font-medium capitalize">${w.type}</p>
        <h5 class="font-bold text-gray-800">${w.name}</h5>
        <p class="text-sm font-extrabold text-gray-900 mt-1">${formatCurrency(w.balance)}</p>
      </div>
    </div>
  `
    )
    .join("");
}

function renderBudgets() {
  const state = store.getState();
  const container = document.getElementById("budget-meter-container");
  
  if (state.budgets.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400">Belum ada anggaran yang diset.</p>`;
    return;
  }

  container.innerHTML = state.budgets
    .map((b) => {
      const cat = state.categories.find((c) => c.id === b.categoryId);
      const spent = state.transactions
        .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
        .reduce((acc, t) => acc + parseFloat(t.amount), 0);
      const percent = Math.min(100, Math.round((spent / b.monthlyLimit) * 100));

      return `
      <div>
        <div class="flex justify-between text-xs font-semibold mb-1">
          <span>${cat ? cat.name : "Kategori"}</span>
          <span class="${percent > 90 ? "text-rose-600" : "text-gray-600"}">${formatCurrency(spent)} / ${formatCurrency(b.monthlyLimit)} (${percent}%)</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div class="h-2 rounded-full ${percent > 90 ? "bg-rose-500" : "bg-indigo-600"}" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
    })
    .join("");
}

function populateFilterOptions() {
  const state = store.getState();
  const catFilter = document.getElementById("filter-category");
  const walletFilter = document.getElementById("filter-wallet");

  if (catFilter.options.length <= 1) {
    state.categories.forEach((c) => {
      catFilter.add(new Option(c.name, c.id));
    });
  }
  if (walletFilter.options.length <= 1) {
    state.wallets.forEach((w) => {
      walletFilter.add(new Option(w.name, w.id));
    });
  }
}

function renderTransactions() {
  const state = store.getState();
  const tbody = document.getElementById("transaction-table-body");

  const search = document.getElementById("filter-search")?.value.toLowerCase() || "";
  const catId = document.getElementById("filter-category")?.value || "";
  const walletId = document.getElementById("filter-wallet")?.value || "";
  const type = document.getElementById("filter-type")?.value || "";

  const filtered = state.transactions.filter((t) => {
    const matchSearch = (t.notes || "").toLowerCase().includes(search);
    const matchCat = catId ? t.categoryId === catId : true;
    const matchWallet = walletId ? t.walletId === walletId || t.targetWalletId === walletId : true;
    const matchType = type ? t.type === type : true;
    return matchSearch && matchCat && matchWallet && matchType;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-400 text-sm">Tidak ada data transaksi.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((t) => {
      const wallet = state.wallets.find((w) => w.id === t.walletId);
      const targetWallet = state.wallets.find((w) => w.id === t.targetWalletId);
      const category = state.categories.find((c) => c.id === t.categoryId);

      let badgeClass = "bg-gray-100 text-gray-600";
      if (t.type === "income") badgeClass = "bg-emerald-100 text-emerald-700";
      if (t.type === "expense") badgeClass = "bg-rose-100 text-rose-700";
      if (t.type === "transfer") badgeClass = "bg-blue-100 text-blue-700";

      let walletName = wallet ? wallet.name : "-";
      if (t.type === "transfer" && targetWallet) {
        walletName += ` ➔ ${targetWallet.name}`;
      }

      return `
      <tr class="hover:bg-gray-50/50">
        <td class="py-3 px-4 text-xs font-medium text-gray-500">${formatDate(t.date)}</td>
        <td class="py-3 px-4"><span class="px-2 py-1 rounded text-xs font-semibold capitalize ${badgeClass}">${t.type}</span></td>
        <td class="py-3 px-4 font-medium text-gray-700">${walletName}</td>
        <td class="py-3 px-4 text-gray-600">${category ? category.name : "-"}</td>
        <td class="py-3 px-4 text-gray-500">${t.notes || "-"}</td>
        <td class="py-3 px-4 text-right font-bold ${t.type === "income" ? "text-emerald-600" : t.type === "expense" ? "text-rose-600" : "text-blue-600"}">
          ${t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}${formatCurrency(t.amount)}
        </td>
        <td class="py-3 px-4 text-center">
          <button onclick="store.deleteTransaction('${t.id}')" class="text-rose-500 hover:text-rose-700 text-xs font-semibold">Hapus</button>
        </td>
      </tr>
    `;
    })
    .join("");
}

function renderCharts() {
  const state = store.getState();

  // 1. Doughnut Chart: Category Breakdown (Expense)
  const ctxCat = document.getElementById("chart-category").getContext("2d");
  const expenseCats = state.categories.filter((c) => c.type === "expense");
  const catData = expenseCats.map((cat) => {
    return state.transactions
      .filter((t) => t.type === "expense" && t.categoryId === cat.id)
      .reduce((acc, t) => acc + parseFloat(t.amount), 0);
  });

  if (categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(ctxCat, {
    type: "doughnut",
    data: {
      labels: expenseCats.map((c) => c.name),
      datasets: [
        {
          data: catData,
          backgroundColor: expenseCats.map((c) => c.color)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } }
    }
  });

  // 2. Bar Chart: Cashflow Overview
  const ctxCashflow = document.getElementById("chart-cashflow").getContext("2d");
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
      labels: ["Total Akumulasi"],
      datasets: [
        { label: "Pemasukan", data: [totalInc], backgroundColor: "#10B981" },
        { label: "Pengeluaran", data: [totalExp], backgroundColor: "#EF4444" }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function toggleTxTypeFields() {
  const type = document.getElementById("tx-type").value;
  const targetField = document.getElementById("field-wallet-target");
  const catField = document.getElementById("field-category");

  if (type === "transfer") {
    targetField.classList.remove("hidden");
    catField.classList.add("hidden");
  } else {
    targetField.classList.add("hidden");
    catField.classList.remove("hidden");
  }
}

function handleTransactionSubmit(e) {
  e.preventDefault();
  const type = document.getElementById("tx-type").value;
  const amount = parseFloat(document.getElementById("tx-amount").value);
  const walletId = document.getElementById("tx-wallet").value;
  const targetWalletId = document.getElementById("tx-target-wallet").value;
  const categoryId = document.getElementById("tx-category").value;
  const date = document.getElementById("tx-date").value;
  const notes = document.getElementById("tx-notes").value;

  if (!amount || amount <= 0) return alert("Nominal harus lebih dari 0!");
  if (type === "transfer" && walletId === targetWalletId) {
    return alert("Dompet asal dan tujuan tidak boleh sama!");
  }

  store.addTransaction({
    type,
    amount,
    walletId,
    targetWalletId: type === "transfer" ? targetWalletId : null,
    categoryId: type !== "transfer" ? categoryId : null,
    date,
    notes
  });

  toggleModal("modal-transaction", false);
  document.getElementById("form-transaction").reset();
}

function handleWalletSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("wallet-name").value;
  const type = document.getElementById("wallet-type").value;
  const balance = parseFloat(document.getElementById("wallet-balance").value) || 0;
  const color = document.getElementById("wallet-color").value;

  store.addWallet({ name, type, balance, color });
  toggleModal("modal-wallet", false);
  document.getElementById("form-wallet").reset();
}

function runSimulation() {
  const principal = parseFloat(document.getElementById("sim-principal").value) || 0;
  const monthly = parseFloat(document.getElementById("sim-monthly").value) || 0;
  const rate = parseFloat(document.getElementById("sim-rate").value) || 0;
  const years = parseInt(document.getElementById("sim-years").value) || 1;

  const result = calculateCompoundInterest(principal, monthly, rate, years);
  const labels = result.map((r) => `Thn ${r.year}`);
  const totalBalances = result.map((r) => r.totalBalance);
  const totalInvesteds = result.map((r) => r.totalInvested);

  const ctxSim = document.getElementById("chart-investment").getContext("2d");
  if (investmentChartInstance) investmentChartInstance.destroy();

  investmentChartInstance = new Chart(ctxSim, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Total Nilai Portfolio", data: totalBalances, borderColor: "#6366F1", backgroundColor: "rgba(99, 102, 241, 0.1)", fill: true },
        { label: "Total Modal Pokok", data: totalInvesteds, borderColor: "#9CA3AF", borderDash: [5, 5] }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true } }
    }
  });

  const last = result[result.length - 1];
  document.getElementById("sim-summary").innerHTML = `
    <div><span class="block text-xs font-semibold uppercase text-indigo-400">Total Modal Pokok</span><strong class="text-gray-800">${formatCurrency(last.totalInvested)}</strong></div>
    <div><span class="block text-xs font-semibold uppercase text-indigo-400">Estimasi Return Bunga</span><strong class="text-emerald-600">${formatCurrency(last.interestEarned)}</strong></div>
    <div><span class="block text-xs font-semibold uppercase text-indigo-400">Proyeksi Aset Akhir</span><strong class="text-indigo-600">${formatCurrency(last.totalBalance)}</strong></div>
  `;
}

// Backup & Storage Handlers
function exportJSON() {
  const jsonStr = JSON.stringify(store.getState(), null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `financial_cockpit_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
}

function exportCSV() {
  const state = store.getState();
  let csv = "ID,Tanggal,Tipe,Nominal,Dompet Asal,Dompet Tujuan,Kategori,Catatan\n";
  state.transactions.forEach((t) => {
    const w = state.wallets.find((item) => item.id === t.walletId);
    const tw = state.wallets.find((item) => item.id === t.targetWalletId);
    const c = state.categories.find((item) => item.id === t.categoryId);
    csv += `"${t.id}","${t.date}","${t.type}",${t.amount},"${w ? w.name : ""}","${tw ? tw.name : ""}","${c ? c.name : ""}","${t.notes || ""}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.wallets && data.transactions) {
        store.setState(data);
        alert("Data berhasil dipulihkan dari backup JSON!");
      } else {
        alert("Format JSON tidak valid!");
      }
    } catch (err) {
      alert("Gagal membaca file JSON!");
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (confirm("Apakah Anda yakin ingin menghapus semua data dan mengembalikan ke setelan awal?")) {
    store.resetState();
  }
}
