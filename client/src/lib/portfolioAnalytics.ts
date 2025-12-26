/**
 * Portfolio Analytics - Aggregates trades and calculates portfolio metrics
 */

import { getAllTrades, type TradeEntry } from "./performanceTracking";
import { getStockPrice } from "./priceService";

export interface PortfolioMetrics {
  totalInvested: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  activeTradesCount: number;
  closedTradesCount: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
  averageReturn: number;
}

export interface SectorAllocation {
  sector: string;
  value: number;
  percent: number;
  tradeCount: number;
  return: number;
  returnPercent: number;
}

export interface StockPosition {
  ticker: string;
  sector: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryValue: number;
  currentValue: number;
  unrealizedReturn: number;
  unrealizedReturnPercent: number;
  status: "active" | "closed";
  templateName: string;
}

// Sector mapping for stocks
const SECTOR_MAP: Record<string, string> = {
  TSM: "Semiconductors",
  NVDA: "Semiconductors",
  AVGO: "Semiconductors",
  ASML: "Semiconductors",
  UNH: "Healthcare",
  JNJ: "Healthcare",
  JPM: "Financials",
  BAC: "Financials",
  GLD: "Precious Metals",
  SLV: "Precious Metals"
};

/**
 * Get all active trades
 */
function getActiveTrades(): TradeEntry[] {
  const trades = getAllTrades();
  return trades.filter((t: TradeEntry) => !t.exitPrice);
}

/**
 * Get all closed trades
 */
function getClosedTrades(): TradeEntry[] {
  const trades = getAllTrades();
  return trades.filter((t: TradeEntry) => t.exitPrice);
}

/**
 * Calculate portfolio metrics
 */
export function calculatePortfolioMetrics(): PortfolioMetrics {
  const allTrades = getAllTrades();
  const activeTrades = getActiveTrades();
  const closedTrades = getClosedTrades();

  let totalInvested = 0;
  let currentValue = 0;
  let totalReturn = 0;
  let winCount = 0;
  let bestTrade = -Infinity;
  let worstTrade = Infinity;

  // Calculate metrics for active trades
  activeTrades.forEach((trade) => {
    const quantity = trade.quantity || 1;
    const entryValue = trade.entryPrice * quantity;
    const currentPrice = getStockPrice(trade.ticker).currentPrice;
    const currentVal = currentPrice * quantity;
    const tradeReturn = currentVal - entryValue;

    totalInvested += entryValue;
    currentValue += currentVal;
    totalReturn += tradeReturn;

    if (tradeReturn > 0) winCount++;
    bestTrade = Math.max(bestTrade, tradeReturn);
    worstTrade = Math.min(worstTrade, tradeReturn);
  });

  // Calculate metrics for closed trades
  closedTrades.forEach((trade: TradeEntry) => {
    const quantity = trade.quantity || 1;
    const entryValue = trade.entryPrice * quantity;
    const exitValue = (trade.exitPrice || 0) * quantity;
    const tradeReturn = exitValue - entryValue;

    totalInvested += entryValue;
    currentValue += exitValue;
    totalReturn += tradeReturn;

    if (tradeReturn > 0) winCount++;
    bestTrade = Math.max(bestTrade, tradeReturn);
    worstTrade = Math.min(worstTrade, tradeReturn);
  });

  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;
  const winRate = allTrades.length > 0 ? (winCount / allTrades.length) * 100 : 0;
  const averageReturn = allTrades.length > 0 ? totalReturn / allTrades.length : 0;

  return {
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    totalReturn: parseFloat(totalReturn.toFixed(2)),
    totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
    activeTradesCount: activeTrades.length,
    closedTradesCount: closedTrades.length,
    winRate: parseFloat(winRate.toFixed(2)),
    bestTrade: bestTrade === -Infinity ? 0 : parseFloat(bestTrade.toFixed(2)),
    worstTrade: worstTrade === Infinity ? 0 : parseFloat(worstTrade.toFixed(2)),
    averageReturn: parseFloat(averageReturn.toFixed(2))
  };
}

/**
 * Calculate sector allocation
 */
export function calculateSectorAllocation(): SectorAllocation[] {
  const allTrades = getAllTrades();
  const sectorData: Record<string, SectorAllocation> = {};

  allTrades.forEach((trade: TradeEntry) => {
    const sector = SECTOR_MAP[trade.ticker] || "Other";
    const quantity = trade.quantity || 1;
    const entryValue = trade.entryPrice * quantity;
    const currentPrice = getStockPrice(trade.ticker).currentPrice;
    const currentValue = currentPrice * quantity;
    const tradeReturn = currentValue - entryValue;
    const tradeReturnPercent = (tradeReturn / entryValue) * 100;

    if (!sectorData[sector]) {
      sectorData[sector] = {
        sector,
        value: 0,
        percent: 0,
        tradeCount: 0,
        return: 0,
        returnPercent: 0
      };
    }

    sectorData[sector].value += currentValue;
    sectorData[sector].tradeCount += 1;
    sectorData[sector].return += tradeReturn;
  });

  // Calculate percentages
  const totalValue = Object.values(sectorData).reduce((sum, s) => sum + s.value, 0);

  const result = Object.values(sectorData).map((sector) => ({
    ...sector,
    percent: totalValue > 0 ? parseFloat(((sector.value / totalValue) * 100).toFixed(2)) : 0,
    returnPercent: sector.value > 0 ? parseFloat(((sector.return / sector.value) * 100).toFixed(2)) : 0
  }));

  return result.sort((a, b) => b.value - a.value);
}

/**
 * Get individual stock positions
 */
export function getStockPositions(): StockPosition[] {
  const allTrades = getAllTrades();
  const positionMap: Record<string, StockPosition> = {};

  allTrades.forEach((trade: TradeEntry) => {
    const sector = SECTOR_MAP[trade.ticker] || "Other";
    const quantity = trade.quantity || 1;
    const currentPrice = getStockPrice(trade.ticker).currentPrice;
    const entryValue = trade.entryPrice * quantity;
    const currentValue = currentPrice * quantity;
    const unrealizedReturn = currentValue - entryValue;
    const unrealizedReturnPercent = (unrealizedReturn / entryValue) * 100;

    if (!positionMap[trade.ticker]) {
      positionMap[trade.ticker] = {
        ticker: trade.ticker,
        sector,
        quantity: 0,
        entryPrice: 0,
        currentPrice,
        entryValue: 0,
        currentValue: 0,
        unrealizedReturn: 0,
        unrealizedReturnPercent: 0,
        status: "active",
        templateName: trade.templateName
      };
    }

    const position = positionMap[trade.ticker];
    position.quantity += quantity;
    position.entryValue += entryValue;
    position.currentValue += currentValue;
    position.unrealizedReturn += unrealizedReturn;
    position.unrealizedReturnPercent = (position.unrealizedReturn / position.entryValue) * 100;
    position.entryPrice = position.entryValue / position.quantity;
    position.currentPrice = currentPrice;
    position.status = trade.exitPrice ? "closed" : "active";
  });

  return Object.values(positionMap)
    .map((pos) => ({
      ...pos,
      entryPrice: parseFloat(pos.entryPrice.toFixed(2)),
      currentPrice: parseFloat(pos.currentPrice.toFixed(2)),
      entryValue: parseFloat(pos.entryValue.toFixed(2)),
      currentValue: parseFloat(pos.currentValue.toFixed(2)),
      unrealizedReturn: parseFloat(pos.unrealizedReturn.toFixed(2)),
      unrealizedReturnPercent: parseFloat(pos.unrealizedReturnPercent.toFixed(2))
    }))
    .sort((a, b) => b.currentValue - a.currentValue);
}

/**
 * Get portfolio summary by status
 */
export function getPortfolioSummary() {
  const metrics = calculatePortfolioMetrics();
  const sectors = calculateSectorAllocation();
  const positions = getStockPositions();

  return {
    metrics,
    sectors,
    positions,
    topSector: sectors[0] || null,
    largestPosition: positions[0] || null
  };
}
