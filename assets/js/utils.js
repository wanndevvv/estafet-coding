/**
 * Helper Utility Functions for Personal Financial Cockpit
 */

function formatCurrency(amount, currency = "IDR", locale = "id-ID") {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0
  }).format(num);
}

function formatCompactNumber(amount) {
  const num = parseFloat(amount) || 0;
  if (Math.abs(num) >= 1000000000) {
    return (num / 1000000000).toFixed(1) + " Miliar";
  }
  if (Math.abs(num) >= 1000000) {
    return (num / 1000000).toFixed(1) + " Juta";
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + " Ribu";
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
