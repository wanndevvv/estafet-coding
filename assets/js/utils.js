/**
 * Helper Utility Functions for Personal Financial Cockpit
 * Light Skeuomorphism Edition
 */

function formatCurrency(amount, currency = "IDR", locale = "id-ID") {
  if (window.store && window.store.getState().settings.stealthMode) {
    return "Rp ••••••••";
  }
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0
  }).format(num);
}

function parseBankCSV(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parsedTx = [];

  lines.forEach((line) => {
    // Check delimiter (comma or semicolon)
    const delimiter = line.includes(";") && !line.includes(",") ? ";" : ",";
    const parts = line.split(delimiter).map((p) => p.replace(/^["']|["']$/g, "").trim());

    if (parts.length >= 3) {
      const dateRaw = parts[0];
      const amountRaw = parts[1];
      const notes = parts[2] || "Impor Mutasi Bank";

      // Detect date formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
      let cleanDate = new Date().toISOString().split("T")[0];
      const matchIso = dateRaw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
      const matchDmy = dateRaw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);

      if (matchIso) {
        const y = matchIso[1];
        const m = matchIso[2].padStart(2, "0");
        const d = matchIso[3].padStart(2, "0");
        cleanDate = `${y}-${m}-${d}`;
      } else if (matchDmy) {
        const d = matchDmy[1].padStart(2, "0");
        const m = matchDmy[2].padStart(2, "0");
        const y = matchDmy[3];
        cleanDate = `${y}-${m}-${d}`;
      }

      // Detect negative/positive amount
      const isNegative = amountRaw.includes("-") || amountRaw.includes("(") || amountRaw.toLowerCase().includes("dr");
      const cleanNumStr = amountRaw.replace(/[^0-9.]/g, "");
      const amount = parseFloat(cleanNumStr);

      if (!isNaN(amount) && amount > 0) {
        parsedTx.push({
          date: cleanDate,
          type: isNegative ? "expense" : "income",
          amount: amount,
          notes: notes
        });
      }
    }
  });

  return parsedTx;
}

function formatCompactNumber(amount) {
  const num = parseFloat(amount) || 0;
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + " M";
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + " Jt";
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(0) + " Rb";
  }
  return num.toLocaleString("id-ID");
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const options = { year: "numeric", month: "short", day: "numeric" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", options);
}

function formatMonthLabel(yearMonthStr) {
  if (!yearMonthStr) return "-";
  const [year, month] = yearMonthStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
}

function formatDateISO(date = new Date()) {
  return date.toISOString().split("T")[0];
}

function calculateCompoundInterest(principal, monthlyContrib, annualRatePercent, years) {
  const p = parseFloat(principal) || 0;
  const pmt = parseFloat(monthlyContrib) || 0;
  const annualRate = parseFloat(annualRatePercent) || 0;
  const y = parseInt(years) || 1;

  const r = annualRate / 100 / 12;
  let data = [];
  
  let currentBalance = p;
  let totalInvested = p;

  for (let year = 1; year <= y; year++) {
    for (let month = 1; month <= 12; month++) {
      currentBalance = (currentBalance + pmt) * (1 + r);
      totalInvested += pmt;
    }
    const interestEarned = Math.max(0, currentBalance - totalInvested);
    data.push({
      year,
      totalBalance: Math.round(currentBalance),
      totalInvested: Math.round(totalInvested),
      interestEarned: Math.round(interestEarned)
    });
  }

  return data;
}
