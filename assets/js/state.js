/**
 * State Management & LocalStorage Sync
 */
const STORAGE_KEY = "PERSONAL_FINANCIAL_COCKPIT_STATE";

const DEFAULT_STATE = {
  settings: {
    currency: "IDR",
    locale: "id-ID",
    theme: "light"
  },
  wallets: [
    {
      id: "w_main",
      name: "Rekening Utama (BCA)",
      type: "bank",
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
      type: "expense",
      amount: 45000,
      walletId: "w_cash",
      targetWalletId: null,
      categoryId: "cat_exp_1",
      notes: "Makan siang"
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
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Gagal memuat state dari localStorage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Gagal menyimpan state ke localStorage", e);
    }
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = newState;
    this.saveState();
  }

  resetState() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.saveState();
  }

  // Transactions CRUD
  addTransaction(tx) {
    tx.id = "tx_" + Date.now();
    this.state.transactions.unshift(tx);

    // Update Wallet Balance
    if (tx.type === "income") {
      const w = this.state.wallets.find((item) => item.id === tx.walletId);
      if (w) w.balance += parseFloat(tx.amount);
    } else if (tx.type === "expense") {
      const w = this.state.wallets.find((item) => item.id === tx.walletId);
      if (w) w.balance -= parseFloat(tx.amount);
    } else if (tx.type === "transfer") {
      const src = this.state.wallets.find((item) => item.id === tx.walletId);
      const target = this.state.wallets.find((item) => item.id === tx.targetWalletId);
      if (src) src.balance -= parseFloat(tx.amount);
      if (target) target.balance += parseFloat(tx.amount);
    }

    this.saveState();
  }

  deleteTransaction(id) {
    const idx = this.state.transactions.findIndex((t) => t.id === id);
    if (idx !== -1) {
      const tx = this.state.transactions[idx];
      // Rollback Wallet Balance
      if (tx.type === "income") {
        const w = this.state.wallets.find((item) => item.id === tx.walletId);
        if (w) w.balance -= parseFloat(tx.amount);
      } else if (tx.type === "expense") {
        const w = this.state.wallets.find((item) => item.id === tx.walletId);
        if (w) w.balance += parseFloat(tx.amount);
      } else if (tx.type === "transfer") {
        const src = this.state.wallets.find((item) => item.id === tx.walletId);
        const target = this.state.wallets.find((item) => item.id === tx.targetWalletId);
        if (src) src.balance += parseFloat(tx.amount);
        if (target) target.balance -= parseFloat(tx.amount);
      }

      this.state.transactions.splice(idx, 1);
      this.saveState();
    }
  }

  // Wallet Management
  addWallet(wallet) {
    wallet.id = "w_" + Date.now();
    wallet.balance = parseFloat(wallet.balance) || 0;
    this.state.wallets.push(wallet);
    this.saveState();
  }
}

const store = new StateManager();
