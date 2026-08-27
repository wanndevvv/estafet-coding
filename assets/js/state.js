/**
 * State Management & LocalStorage Synchronization
 * Personal Financial Cockpit
 */
const STORAGE_KEY = "PERSONAL_FINANCIAL_COCKPIT_STATE";

const DEFAULT_STATE = {
  settings: {
    currency: "IDR",
    locale: "id-ID",
    theme: "navy-skeuomorph",
    lastSync: new Date().toISOString()
  },
  wallets: [
    {
      id: "w_main",
      name: "Rekening Utama (BCA)",
      type: "bank", // 'bank' | 'cash' | 'ewallet'
      balance: 14500000,
      color: "#2563EB"
    },
    {
      id: "w_cash",
      name: "Dompet Tunai Fisik",
      type: "cash",
      balance: 850000,
      color: "#10B981"
    },
    {
      id: "w_ewallet",
      name: "GoPay / OVO",
      type: "ewallet",
      balance: 620000,
      color: "#06B6D4"
    }
  ],
  categories: [
    { id: "cat_inc_1", name: "Gaji & Bonus", type: "income", color: "#10B981" },
    { id: "cat_inc_2", name: "Freelance & Proyek", type: "income", color: "#34D399" },
    { id: "cat_exp_1", name: "Makanan & Minuman", type: "expense", color: "#F59E0B" },
    { id: "cat_exp_2", name: "Transportasi & Bensin", type: "expense", color: "#6366F1" },
    { id: "cat_exp_3", name: "Tagihan & Utilitas", type: "expense", color: "#EF4444" },
    { id: "cat_exp_4", name: "Belanja Kebutuhan", type: "expense", color: "#EC4899" },
    { id: "cat_exp_5", name: "Investasi & Tabungan", type: "expense", color: "#8B5CF6" }
  ],
  budgets: [
    {
      id: "b_1",
      categoryId: "cat_exp_1",
      monthlyLimit: 2500000
    },
    {
      id: "b_2",
      categoryId: "cat_exp_2",
      monthlyLimit: 1200000
    },
    {
      id: "b_3",
      categoryId: "cat_exp_3",
      monthlyLimit: 1500000
    }
  ],
  transactions: [
    {
      id: "tx_101",
      date: "2026-08-27",
      type: "expense",
      amount: 45000,
      walletId: "w_cash",
      targetWalletId: null,
      categoryId: "cat_exp_1",
      notes: "Makan siang Bento & Es Teh"
    },
    {
      id: "tx_102",
      date: "2026-08-26",
      type: "income",
      amount: 15000000,
      walletId: "w_main",
      targetWalletId: null,
      categoryId: "cat_inc_1",
      notes: "Gaji Bulanan PT Tech Nusantara"
    },
    {
      id: "tx_103",
      date: "2026-08-25",
      type: "expense",
      amount: 450000,
      walletId: "w_main",
      targetWalletId: null,
      categoryId: "cat_exp_3",
      notes: "Tagihan Listrik PLN & Internet Wi-Fi"
    },
    {
      id: "tx_104",
      date: "2026-08-24",
      type: "transfer",
      amount: 500000,
      walletId: "w_main",
      targetWalletId: "w_ewallet",
      categoryId: null,
      notes: "Top-up saldo GoPay / OVO"
    },
    {
      id: "tx_105",
      date: "2026-08-23",
      type: "expense",
      amount: 120000,
      walletId: "w_ewallet",
      targetWalletId: null,
      categoryId: "cat_exp_2",
      notes: "Bensin Pertamax & Parkir"
    }
  ]
};

class StateManager {
  constructor() {
    this.state = this.loadState();
    this.listeners = [];
  }

  loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure defaults merge if older format
        return {
          ...DEFAULT_STATE,
          ...parsed,
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
          wallets: parsed.wallets || DEFAULT_STATE.wallets,
          categories: parsed.categories || DEFAULT_STATE.categories,
          budgets: parsed.budgets || DEFAULT_STATE.budgets,
          transactions: parsed.transactions || DEFAULT_STATE.transactions
        };
      }
    } catch (e) {
      console.error("Gagal memuat state dari localStorage:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      this.state.settings.lastSync = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Gagal menyimpan state ke localStorage:", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.error("Error in state subscriber listener:", err);
      }
    });
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = {
      ...DEFAULT_STATE,
      ...newState,
      settings: { ...DEFAULT_STATE.settings, ...(newState.settings || {}) }
    };
    this.saveState();
  }

  resetState() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  getStorageTelemetry() {
    const raw = localStorage.getItem(STORAGE_KEY) || "";
    const bytes = new Blob([raw]).size;
    return {
      bytes,
      kb: (bytes / 1024).toFixed(2),
      txCount: this.state.transactions.length,
      walletCount: this.state.wallets.length,
      budgetCount: this.state.budgets.length,
      lastSync: this.state.settings.lastSync || new Date().toISOString()
    };
  }

  // ==================== TRANSACTIONS ====================
  addTransaction(tx) {
    tx.id = "tx_" + Date.now();
    tx.amount = parseFloat(tx.amount);
    this.state.transactions.unshift(tx);

    // Mutasi saldo dompet
    if (tx.type === "income") {
      const w = this.state.wallets.find((item) => item.id === tx.walletId);
      if (w) w.balance += tx.amount;
    } else if (tx.type === "expense") {
      const w = this.state.wallets.find((item) => item.id === tx.walletId);
      if (w) w.balance -= tx.amount;
    } else if (tx.type === "transfer") {
      const src = this.state.wallets.find((item) => item.id === tx.walletId);
      const target = this.state.wallets.find((item) => item.id === tx.targetWalletId);
      if (src) src.balance -= tx.amount;
      if (target) target.balance += tx.amount;
    }

    this.saveState();
    return tx;
  }

  deleteTransaction(id) {
    const idx = this.state.transactions.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const tx = this.state.transactions[idx];
      const amount = parseFloat(tx.amount);

      // Auto-rollback saldo dompet
      if (tx.type === "income") {
        const w = this.state.wallets.find((item) => item.id === tx.walletId);
        if (w) w.balance -= amount;
      } else if (tx.type === "expense") {
        const w = this.state.wallets.find((item) => item.id === tx.walletId);
        if (w) w.balance += amount;
      } else if (tx.type === "transfer") {
        const src = this.state.wallets.find((item) => item.id === tx.walletId);
        const target = this.state.wallets.find((item) => item.id === tx.targetWalletId);
        if (src) src.balance += amount;
        if (target) target.balance -= amount;
      }

      this.state.transactions.splice(idx, 1);
      this.saveState();
      return true;
    }
    return false;
  }

  // ==================== WALLETS ====================
  addWallet(wallet) {
    wallet.id = "w_" + Date.now();
    wallet.balance = parseFloat(wallet.balance) || 0;
    if (!wallet.color) wallet.color = "#2563EB";
    this.state.wallets.push(wallet);
    this.saveState();
    return wallet;
  }

  deleteWallet(id) {
    if (this.state.wallets.length <= 1) {
      return { success: false, message: "Minimal harus memiliki satu dompet aktif!" };
    }
    
    // Check if wallet is used in transactions
    const hasTx = this.state.transactions.some(
      (t) => t.walletId === id || t.targetWalletId === id
    );
    if (hasTx) {
      return { 
        success: false, 
        message: "Dompet tidak dapat dihapus karena masih memiliki riwayat transaksi terkait." 
      };
    }

    const idx = this.state.wallets.findIndex((w) => w.id === id);
    if (idx !== -1) {
      this.state.wallets.splice(idx, 1);
      this.saveState();
      return { success: true };
    }
    return { success: false, message: "Dompet tidak ditemukan." };
  }

  // ==================== BUDGETS ====================
  setBudget(categoryId, monthlyLimit) {
    const limit = parseFloat(monthlyLimit) || 0;
    const existing = this.state.budgets.find((b) => b.categoryId === categoryId);
    if (existing) {
      existing.monthlyLimit = limit;
    } else {
      this.state.budgets.push({
        id: "b_" + Date.now(),
        categoryId,
        monthlyLimit: limit
      });
    }
    this.saveState();
  }

  deleteBudget(id) {
    const idx = this.state.budgets.findIndex((b) => b.id === id);
    if (idx !== -1) {
      this.state.budgets.splice(idx, 1);
      this.saveState();
    }
  }
}

const store = new StateManager();
