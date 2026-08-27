/**
 * Helper Utility Functions
 */

function formatCurrency(amount, currency = "IDR", locale = "id-ID") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateStr).toLocaleDateString("id-ID", options);
}

function calculateCompoundInterest(principal, monthlyContrib, annualRatePercent, years) {
  const r = annualRatePercent / 100 / 12;
  const totalMonths = years * 12;
  let data = [];
  
  let currentBalance = principal;
  let totalInvested = principal;

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      currentBalance = (currentBalance + monthlyContrib) * (1 + r);
      totalInvested += monthlyContrib;
    }
    const interestEarned = currentBalance - totalInvested;
    data.push({
      year,
      totalBalance: Math.round(currentBalance),
      totalInvested: Math.round(totalInvested),
      interestEarned: Math.round(interestEarned)
    });
  }

  return data;
}
