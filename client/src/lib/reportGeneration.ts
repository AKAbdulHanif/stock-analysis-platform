import {
  getAllTrades,
  calculateTradeReturn,
  type TradeEntry,
  type TemplatePerformance
} from "./performanceTracking";

export type TimePeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "all";

export interface PeriodReport {
  period: string;
  startDate: string;
  endDate: string;
  trades: TradeEntry[];
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
  bestTrade: number;
  worstTrade: number;
}

export interface StrategyComparisonReport {
  generatedDate: string;
  timePeriod: TimePeriod;
  periodReports: PeriodReport[];
  overallStats: {
    totalTrades: number;
    totalWins: number;
    totalLosses: number;
    overallWinRate: number;
    overallAvgReturn: number;
    bestPeriod: PeriodReport | null;
    worstPeriod: PeriodReport | null;
  };
}

/**
 * Get date range for a specific period
 */
export function getDateRangeForPeriod(
  timePeriod: TimePeriod,
  referenceDate: Date = new Date()
): { startDate: Date; endDate: Date } {
  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(referenceDate);

  switch (timePeriod) {
    case "daily":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      startDate.setDate(startDate.getDate() - startDate.getDay());
      startDate.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "quarterly":
      const quarter = Math.floor(startDate.getMonth() / 3);
      startDate.setMonth(quarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "yearly":
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "all":
      startDate.setTime(0);
      break;
  }

  return { startDate, endDate };
}

/**
 * Get all periods for a time period type (e.g., all months in a year)
 */
export function getAllPeriodsOfType(timePeriod: TimePeriod): { start: Date; end: Date; label: string }[] {
  const periods: { start: Date; end: Date; label: string }[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  switch (timePeriod) {
    case "daily":
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        periods.push({
          start,
          end,
          label: date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        });
      }
      break;

    case "weekly":
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i * 7);
        const start = new Date(date);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        periods.push({
          start,
          end,
          label: `Week ${weekNum} ${date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
        });
      }
      break;

    case "monthly":
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        end.setHours(23, 59, 59, 999);
        periods.push({
          start,
          end,
          label: date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        });
      }
      break;

    case "quarterly":
      // Last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i * 3);
        const quarter = Math.floor(date.getMonth() / 3);
        const start = new Date(date.getFullYear(), quarter * 3, 1);
        const end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
        end.setHours(23, 59, 59, 999);
        periods.push({
          start,
          end,
          label: `Q${quarter + 1} ${date.getFullYear()}`
        });
      }
      break;

    case "yearly":
      // Last 3 years
      for (let i = 2; i >= 0; i--) {
        const year = currentYear - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        end.setHours(23, 59, 59, 999);
        periods.push({
          start,
          end,
          label: year.toString()
        });
      }
      break;

    case "all":
      periods.push({
        start: new Date(0),
        end: new Date(),
        label: "All Time"
      });
      break;
  }

  return periods;
}

/**
 * Filter trades by date range
 */
export function filterTradesByDateRange(trades: TradeEntry[], startDate: Date, endDate: Date): TradeEntry[] {
  return trades.filter((trade) => {
    const tradeDate = new Date(trade.entryDate);
    return tradeDate >= startDate && tradeDate <= endDate;
  });
}

/**
 * Calculate performance metrics for a set of trades
 */
export function calculateTradeMetrics(trades: TradeEntry[]): {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgReturn: number;
  totalReturn: number;
  bestTrade: number;
  worstTrade: number;
} {
  const closedTrades = trades.filter((t) => t.status === "closed");
  const openTrades = trades.filter((t) => t.status === "open");

  let winningTrades = 0;
  let losingTrades = 0;
  let totalReturn = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;

  closedTrades.forEach((trade) => {
    const returnPct = calculateTradeReturn(trade);
    if (returnPct !== null) {
      totalReturn += returnPct;
      if (returnPct > 0) {
        winningTrades++;
        bestTrade = Math.max(bestTrade, returnPct);
      } else if (returnPct < 0) {
        losingTrades++;
        worstTrade = Math.min(worstTrade, returnPct);
      }
    }
  });

  const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
  const avgReturn = closedTrades.length > 0 ? totalReturn / closedTrades.length : 0;

  return {
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: openTrades.length,
    winningTrades,
    losingTrades,
    winRate,
    avgReturn,
    totalReturn,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade
  };
}

/**
 * Generate period reports for a time period type
 */
export function generatePeriodReports(timePeriod: TimePeriod): PeriodReport[] {
  const allTrades = getAllTrades();
  const periods = getAllPeriodsOfType(timePeriod);

  return periods.map((period) => {
    const periodTrades = filterTradesByDateRange(allTrades, period.start, period.end);
    const metrics = calculateTradeMetrics(periodTrades);

    return {
      period: period.label,
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString(),
      trades: periodTrades,
      ...metrics
    };
  });
}

/**
 * Generate complete strategy comparison report
 */
export function generateStrategyComparisonReport(timePeriod: TimePeriod): StrategyComparisonReport {
  const periodReports = generatePeriodReports(timePeriod);
  const allTrades = getAllTrades();
  const overallMetrics = calculateTradeMetrics(allTrades);

  let totalWins = 0;
  let totalLosses = 0;
  let overallAvgReturn = 0;
  let bestPeriod: PeriodReport | null = null;
  let worstPeriod: PeriodReport | null = null;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;

  periodReports.forEach((report) => {
    totalWins += report.winningTrades;
    totalLosses += report.losingTrades;
    overallAvgReturn += report.avgReturn;

    if (report.avgReturn > bestReturn) {
      bestReturn = report.avgReturn;
      bestPeriod = report;
    }
    if (report.avgReturn < worstReturn) {
      worstReturn = report.avgReturn;
      worstPeriod = report;
    }
  });

  overallAvgReturn = periodReports.length > 0 ? overallAvgReturn / periodReports.length : 0;

  return {
    generatedDate: new Date().toISOString(),
    timePeriod,
    periodReports,
    overallStats: {
      totalTrades: overallMetrics.totalTrades,
      totalWins,
      totalLosses,
      overallWinRate: overallMetrics.winRate,
      overallAvgReturn,
      bestPeriod,
      worstPeriod
    }
  };
}

/**
 * Export report to CSV format
 */
export function exportReportToCSV(report: StrategyComparisonReport): string {
  let csv = "Strategy Comparison Report\n";
  csv += `Generated: ${new Date(report.generatedDate).toLocaleString()}\n`;
  csv += `Time Period: ${report.timePeriod}\n\n`;

  // Overall stats
  csv += "Overall Statistics\n";
  csv += `Total Trades,${report.overallStats.totalTrades}\n`;
  csv += `Winning Trades,${report.overallStats.totalWins}\n`;
  csv += `Losing Trades,${report.overallStats.totalLosses}\n`;
  csv += `Win Rate,${report.overallStats.overallWinRate.toFixed(2)}%\n`;
  csv += `Average Return,${report.overallStats.overallAvgReturn.toFixed(2)}%\n`;
  csv += `Best Period,"${report.overallStats.bestPeriod?.period || "N/A"}"\n`;
  csv += `Worst Period,"${report.overallStats.worstPeriod?.period || "N/A"}"\n\n`;

  // Period details
  csv += "Period Details\n";
  csv += "Period,Total Trades,Closed,Open,Wins,Losses,Win Rate %,Avg Return %,Total Return %,Best Trade %,Worst Trade %\n";

  report.periodReports.forEach((period) => {
    csv += `"${period.period}",${period.totalTrades},${period.closedTrades},${period.openTrades},${period.winningTrades},${period.losingTrades},${period.winRate.toFixed(2)},${period.avgReturn.toFixed(2)},${period.totalReturn.toFixed(2)},${period.bestTrade.toFixed(2)},${period.worstTrade.toFixed(2)}\n`;
  });

  return csv;
}

/**
 * Export report to JSON format
 */
export function exportReportToJSON(report: StrategyComparisonReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Download report as file
 */
export function downloadReport(
  report: StrategyComparisonReport,
  format: "csv" | "json" = "csv"
): void {
  const content = format === "csv" ? exportReportToCSV(report) : exportReportToJSON(report);
  const mimeType = format === "csv" ? "text/csv" : "application/json";
  const extension = format === "csv" ? "csv" : "json";

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `strategy-report-${new Date().toISOString().split("T")[0]}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
