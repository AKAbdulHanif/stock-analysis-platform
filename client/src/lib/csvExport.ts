interface Stock {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  target: string;
  upside: string;
  upsideMin: number;
  upsideMax: number;
  thesis: string;
  pe: number;
  growth: string;
}

/**
 * Escape CSV values to handle commas, quotes, and newlines
 */
function escapeCSV(value: string | number): string {
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert an array of stocks to CSV format
 */
function stocksToCSV(stocks: Stock[]): string {
  const headers = [
    "Ticker",
    "Company Name",
    "Sector",
    "Current Price",
    "Target Price",
    "Upside Potential",
    "Min Upside %",
    "Max Upside %",
    "P/E Ratio",
    "Revenue Growth",
    "Investment Thesis"
  ];

  const rows = stocks.map((stock) => [
    escapeCSV(stock.ticker),
    escapeCSV(stock.name),
    escapeCSV(stock.sector),
    `$${stock.price}`,
    escapeCSV(stock.target),
    escapeCSV(stock.upside),
    stock.upsideMin,
    stock.upsideMax,
    stock.pe,
    escapeCSV(stock.growth),
    escapeCSV(stock.thesis)
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  return csvContent;
}

/**
 * Generate comparison table CSV with aggregate statistics
 */
function comparisonToCSV(stocks: Stock[]): string {
  if (stocks.length === 0) {
    return "No stocks selected for comparison";
  }

  const headers = [
    "Ticker",
    "Company Name",
    "Sector",
    "Current Price",
    "P/E Ratio",
    "Upside Potential",
    "Revenue Growth",
    "Target Price"
  ];

  const rows = stocks.map((stock) => [
    escapeCSV(stock.ticker),
    escapeCSV(stock.name),
    escapeCSV(stock.sector),
    `$${stock.price}`,
    stock.pe,
    escapeCSV(stock.upside),
    escapeCSV(stock.growth),
    escapeCSV(stock.target)
  ]);

  // Calculate aggregate statistics
  const avgPE = (stocks.reduce((sum, s) => sum + s.pe, 0) / stocks.length).toFixed(2);
  const avgUpside = (stocks.reduce((sum, s) => sum + s.upsideMax, 0) / stocks.length).toFixed(2);
  const avgPrice = (stocks.reduce((sum, s) => sum + s.price, 0) / stocks.length).toFixed(2);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
    "", // blank line
    "Summary Statistics",
    `Average P/E Ratio,${avgPE}x`,
    `Average Upside Potential,${avgUpside}%`,
    `Average Stock Price,$${avgPrice}`,
    `Number of Stocks,${stocks.length}`,
    `Sectors Represented,"${Array.from(new Set(stocks.map((s) => s.sector))).join("; ")}"`,
    "",
    "Export Date," + new Date().toISOString().split("T")[0],
    "Report Title,2026 Investment Outlook - Stock Comparison"
  ].join("\n");

  return csvContent;
}

/**
 * Download CSV file to user's device
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Export filtered stocks list as CSV
 */
export function exportFilteredStocksAsCSV(stocks: Stock[]): void {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `investment-outlook-stocks-${timestamp}.csv`;
  const csvContent = stocksToCSV(stocks);
  downloadCSV(csvContent, filename);
}

/**
 * Export comparison table as CSV
 */
export function exportComparisonAsCSV(stocks: Stock[]): void {
  if (stocks.length === 0) {
    alert("Please select at least one stock to export.");
    return;
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `stock-comparison-${timestamp}.csv`;
  const csvContent = comparisonToCSV(stocks);
  downloadCSV(csvContent, filename);
}

/**
 * Export detailed report with all filtered stocks and comparison
 */
export function exportDetailedReport(
  filteredStocks: Stock[],
  selectedStocks: Stock[]
): void {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `investment-report-${timestamp}.csv`;

  const sections = [
    "2026 INVESTMENT OUTLOOK - DETAILED REPORT",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    "FILTERED STOCKS LIST",
    `Total Stocks: ${filteredStocks.length}`,
    "",
    stocksToCSV(filteredStocks),
    "",
    "",
    "SELECTED STOCKS COMPARISON",
    `Selected Stocks: ${selectedStocks.length}`,
    "",
    comparisonToCSV(selectedStocks)
  ].join("\n");

  downloadCSV(sections, filename);
}
