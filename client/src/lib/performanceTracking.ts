export interface TradeEntry {
  id: string;
  ticker: string;
  templateId: string;
  templateName: string;
  entryPrice: number;
  entryDate: string;
  exitPrice?: number;
  exitDate?: string;
  quantity?: number;
  notes?: string;
  status: "open" | "closed" | "cancelled";
}

export interface TemplatePerformance {
  templateId: string;
  templateName: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  openTrades: number;
  winRate: number; // percentage
  avgGain: number; // percentage
  avgLoss: number; // percentage
  profitFactor: number; // total gains / total losses
  totalReturn: number; // percentage
  bestTrade: number; // percentage
  worstTrade: number; // percentage
  lastUpdated: string;
}

export interface StockPerformance {
  ticker: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalReturn: number; // percentage
  winRate: number; // percentage
  lastUpdated: string;
}

const TRADES_STORAGE_KEY = "investment_outlook_trades";
const PERFORMANCE_CACHE_KEY = "investment_outlook_performance_cache";

/**
 * Get all recorded trades
 */
export function getAllTrades(): TradeEntry[] {
  try {
    const data = localStorage.getItem(TRADES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading trades:", error);
    return [];
  }
}

/**
 * Record a new trade entry
 */
export function recordTradeEntry(
  ticker: string,
  templateId: string,
  templateName: string,
  entryPrice: number,
  quantity: number = 1,
  notes?: string
): TradeEntry {
  const trades = getAllTrades();
  const trade: TradeEntry = {
    id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ticker,
    templateId,
    templateName,
    entryPrice,
    entryDate: new Date().toISOString(),
    quantity,
    notes,
    status: "open"
  };

  trades.push(trade);
  localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  clearPerformanceCache();

  return trade;
}

/**
 * Close a trade with exit price
 */
export function closeTradeEntry(
  tradeId: string,
  exitPrice: number,
  notes?: string
): TradeEntry | null {
  const trades = getAllTrades();
  const trade = trades.find((t) => t.id === tradeId);

  if (!trade) return null;

  trade.exitPrice = exitPrice;
  trade.exitDate = new Date().toISOString();
  trade.status = "closed";
  if (notes) trade.notes = notes;

  localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  clearPerformanceCache();

  return trade;
}

/**
 * Cancel a trade
 */
export function cancelTradeEntry(tradeId: string): TradeEntry | null {
  const trades = getAllTrades();
  const trade = trades.find((t) => t.id === tradeId);

  if (!trade) return null;

  trade.status = "cancelled";
  localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  clearPerformanceCache();

  return trade;
}

/**
 * Delete a trade
 */
export function deleteTradeEntry(tradeId: string): boolean {
  const trades = getAllTrades();
  const filtered = trades.filter((t) => t.id !== tradeId);

  if (filtered.length === trades.length) return false;

  localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(filtered));
  clearPerformanceCache();

  return true;
}

/**
 * Calculate return percentage for a trade
 */
export function calculateTradeReturn(trade: TradeEntry): number | null {
  if (!trade.exitPrice) return null;
  return ((trade.exitPrice - trade.entryPrice) / trade.entryPrice) * 100;
}

/**
 * Calculate performance metrics for a template
 */
export function calculateTemplatePerformance(templateId: string): TemplatePerformance | null {
  const trades = getAllTrades().filter((t) => t.templateId === templateId);

  if (trades.length === 0) return null;

  const closedTrades = trades.filter((t) => t.status === "closed");
  const openTrades = trades.filter((t) => t.status === "open");

  let winningTrades = 0;
  let losingTrades = 0;
  let totalGain = 0;
  let totalLoss = 0;
  let bestReturn = -Infinity;
  let worstReturn = Infinity;

  closedTrades.forEach((trade) => {
    const returnPct = calculateTradeReturn(trade);
    if (returnPct !== null) {
      if (returnPct > 0) {
        winningTrades++;
        totalGain += returnPct;
        bestReturn = Math.max(bestReturn, returnPct);
      } else if (returnPct < 0) {
        losingTrades++;
        totalLoss += Math.abs(returnPct);
        worstReturn = Math.min(worstReturn, returnPct);
      }
    }
  });

  const totalClosedTrades = closedTrades.length;
  const totalTrades = trades.length;
  const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
  const avgGain = winningTrades > 0 ? totalGain / winningTrades : 0;
  const avgLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
  const profitFactor = totalLoss > 0 ? totalGain / totalLoss : totalGain > 0 ? Infinity : 0;
  const totalReturn = totalClosedTrades > 0 ? (totalGain - totalLoss) / totalClosedTrades : 0;

  const templateName = trades[0]?.templateName || templateId;

  return {
    templateId,
    templateName,
    totalTrades,
    winningTrades,
    losingTrades,
    openTrades: openTrades.length,
    winRate,
    avgGain,
    avgLoss,
    profitFactor,
    totalReturn,
    bestTrade: bestReturn === -Infinity ? 0 : bestReturn,
    worstTrade: worstReturn === Infinity ? 0 : worstReturn,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Calculate performance for all templates
 */
export function getAllTemplatePerformance(): TemplatePerformance[] {
  const trades = getAllTrades();
  const templateIds = new Set(trades.map((t) => t.templateId));
  const performances: TemplatePerformance[] = [];

  templateIds.forEach((templateId) => {
    const perf = calculateTemplatePerformance(templateId);
    if (perf) performances.push(perf);
  });

  return performances.sort((a, b) => b.totalReturn - a.totalReturn);
}

/**
 * Calculate performance for a specific stock
 */
export function calculateStockPerformance(ticker: string): StockPerformance | null {
  const trades = getAllTrades().filter((t) => t.ticker === ticker);

  if (trades.length === 0) return null;

  const closedTrades = trades.filter((t) => t.status === "closed");

  let winningTrades = 0;
  let losingTrades = 0;
  let totalReturn = 0;

  closedTrades.forEach((trade) => {
    const returnPct = calculateTradeReturn(trade);
    if (returnPct !== null) {
      totalReturn += returnPct;
      if (returnPct > 0) {
        winningTrades++;
      } else if (returnPct < 0) {
        losingTrades++;
      }
    }
  });

  const totalClosedTrades = closedTrades.length;
  const winRate = totalClosedTrades > 0 ? (winningTrades / totalClosedTrades) * 100 : 0;
  const avgReturn = totalClosedTrades > 0 ? totalReturn / totalClosedTrades : 0;

  return {
    ticker,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    totalReturn: avgReturn,
    winRate,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Get trades for a specific template
 */
export function getTemplateTradeHistory(templateId: string): TradeEntry[] {
  return getAllTrades()
    .filter((t) => t.templateId === templateId)
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

/**
 * Get trades for a specific stock
 */
export function getStockTradeHistory(ticker: string): TradeEntry[] {
  return getAllTrades()
    .filter((t) => t.ticker === ticker)
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(): {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  totalWins: number;
  totalLosses: number;
  overallWinRate: number;
  overallReturn: number;
  bestTemplate: TemplatePerformance | null;
  worstTemplate: TemplatePerformance | null;
} {
  const trades = getAllTrades();
  const closedTrades = trades.filter((t) => t.status === "closed");
  const openTrades = trades.filter((t) => t.status === "open");

  let totalWins = 0;
  let totalLosses = 0;
  let totalReturn = 0;

  closedTrades.forEach((trade) => {
    const returnPct = calculateTradeReturn(trade);
    if (returnPct !== null) {
      totalReturn += returnPct;
      if (returnPct > 0) {
        totalWins++;
      } else if (returnPct < 0) {
        totalLosses++;
      }
    }
  });

  const overallWinRate = closedTrades.length > 0 ? (totalWins / closedTrades.length) * 100 : 0;
  const overallReturn = closedTrades.length > 0 ? totalReturn / closedTrades.length : 0;

  const allPerformance = getAllTemplatePerformance();
  const bestTemplate = allPerformance.length > 0 ? allPerformance[0] : null;
  const worstTemplate = allPerformance.length > 0 ? allPerformance[allPerformance.length - 1] : null;

  return {
    totalTrades: trades.length,
    closedTrades: closedTrades.length,
    openTrades: openTrades.length,
    totalWins,
    totalLosses,
    overallWinRate,
    overallReturn,
    bestTemplate,
    worstTemplate
  };
}

/**
 * Clear performance cache
 */
function clearPerformanceCache(): void {
  localStorage.removeItem(PERFORMANCE_CACHE_KEY);
}

/**
 * Generate sample data for demo purposes
 */
export function generateSampleTradeData(): void {
  const templates = [
    { id: "profit-taking", name: "Profit Taking Levels" },
    { id: "risk-management", name: "Risk Management" },
    { id: "momentum", name: "Momentum Trading" },
    { id: "mean-reversion", name: "Mean Reversion" }
  ];

  const stocks = ["TSMC", "NVIDIA", "UNH", "JPM", "BRK.B", "BROADCOM"];

  // Generate 20-30 sample trades
  for (let i = 0; i < 25; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const entryPrice = 100 + Math.random() * 200;
    const isWinner = Math.random() > 0.4; // 60% win rate
    const returnMultiplier = isWinner ? 1 + Math.random() * 0.3 : 1 - Math.random() * 0.2;
    const exitPrice = entryPrice * returnMultiplier;

    const trade: TradeEntry = {
      id: `trade_${Date.now()}_${i}`,
      ticker: stock,
      templateId: template.id,
      templateName: template.name,
      entryPrice,
      entryDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      exitPrice,
      exitDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      quantity: 1,
      status: "closed"
    };

    const trades = getAllTrades();
    trades.push(trade);
    localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
  }

  clearPerformanceCache();
}

/**
 * Clear all trade data
 */
export function clearAllTradeData(): void {
  localStorage.removeItem(TRADES_STORAGE_KEY);
  clearPerformanceCache();
}
