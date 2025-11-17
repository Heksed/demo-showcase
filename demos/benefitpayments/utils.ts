// Utility functions for benefit payments

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("fi-FI", { 
    style: "currency", 
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    // Format: DD.MM.YYYY (e.g. "1.8.2026")
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

