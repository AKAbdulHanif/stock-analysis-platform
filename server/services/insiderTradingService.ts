/**
 * Insider Trading Service
 * Fetches and analyzes SEC Form 4 insider trading data
 */

import { callDataApi } from '../_core/dataApi';

export interface InsiderTransaction {
  id: string;
  ticker: string;
  insiderName: string;
  relation: string; // Officer, Director, 10% Owner, etc.
  transactionDate: string;
  transactionType: 'buy' | 'sell' | 'option_exercise' | 'gift' | 'other';
  shares: number;
  sharesFormatted: string;
  pricePerShare?: number;
  transactionValue?: number;
  transactionValueFormatted?: string;
  positionDirect: number;
  positionDirectFormatted: string;
  positionDirectDate: string;
  transactionDescription: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

export interface InsiderSentiment {
  ticker: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  bullishSignals: number;
  bearishSignals: number;
  neutralSignals: number;
  recentBuys: number;
  recentSells: number;
  totalTransactions: number;
  clusteringDetected: boolean;
  clusteringDescription?: string;
}

/**
 * Fetch insider trading data for a stock
 */
export async function getInsiderTransactions(ticker: string): Promise<InsiderTransaction[]> {
  try {
    const response = await callDataApi('YahooFinance/get_stock_holders', {
      query: {
        symbol: ticker,
        region: 'US',
        lang: 'en-US'
      }
    });

    if (!response || !response.quoteSummary || !response.quoteSummary.result) {
      return [];
    }

    const result = response.quoteSummary.result[0];
    const insiderHolders = result?.insiderHolders?.holders || [];

    const transactions: InsiderTransaction[] = insiderHolders.map((holder: any, index: number) => {
      const transactionType = determineTransactionType(holder.transactionDescription || '');
      const sentiment = determineTransactionSentiment(transactionType, holder.transactionDescription || '');
      
      // Extract shares and position
      const shares = holder.positionDirect?.raw || 0;
      const sharesFormatted = holder.positionDirect?.fmt || '0';
      
      // Extract dates
      const transactionDate = holder.latestTransDate?.fmt || 'Unknown';
      const positionDirectDate = holder.positionDirectDate?.fmt || 'Unknown';

      return {
        id: `${ticker}-${holder.name}-${index}`,
        ticker,
        insiderName: holder.name || 'Unknown',
        relation: holder.relation || 'Unknown',
        transactionDate,
        transactionType,
        shares,
        sharesFormatted,
        pricePerShare: undefined, // Not available in this API
        transactionValue: undefined,
        transactionValueFormatted: undefined,
        positionDirect: shares,
        positionDirectFormatted: sharesFormatted,
        positionDirectDate,
        transactionDescription: holder.transactionDescription || 'No description',
        sentiment
      };
    });

    // Sort by transaction date (most recent first)
    return transactions.sort((a, b) => {
      const dateA = new Date(a.transactionDate).getTime();
      const dateB = new Date(b.transactionDate).getTime();
      return dateB - dateA;
    });

  } catch (error) {
    console.error(`[Insider Trading] Error fetching data for ${ticker}:`, error);
    return [];
  }
}

/**
 * Calculate insider sentiment based on recent transactions
 */
export async function getInsiderSentiment(ticker: string): Promise<InsiderSentiment> {
  const transactions = await getInsiderTransactions(ticker);
  
  let bullishSignals = 0;
  let bearishSignals = 0;
  let neutralSignals = 0;
  let recentBuys = 0;
  let recentSells = 0;

  // Analyze transactions from the last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  transactions.forEach(transaction => {
    const transactionDate = new Date(transaction.transactionDate);
    
    if (transactionDate >= ninetyDaysAgo) {
      if (transaction.sentiment === 'bullish') {
        bullishSignals++;
        if (transaction.transactionType === 'buy') recentBuys++;
      } else if (transaction.sentiment === 'bearish') {
        bearishSignals++;
        if (transaction.transactionType === 'sell') recentSells++;
      } else {
        neutralSignals++;
      }
    }
  });

  // Determine overall sentiment
  let overallSentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bullishSignals > bearishSignals && bullishSignals >= 2) {
    overallSentiment = 'bullish';
  } else if (bearishSignals > bullishSignals && bearishSignals >= 2) {
    overallSentiment = 'bearish';
  }

  // Detect clustering (multiple insiders buying/selling within 30 days)
  const clusteringDetected = detectClustering(transactions);
  let clusteringDescription: string | undefined;
  
  if (clusteringDetected) {
    if (recentBuys >= 3) {
      clusteringDescription = `${recentBuys} insiders bought shares recently, suggesting strong confidence`;
    } else if (recentSells >= 3) {
      clusteringDescription = `${recentSells} insiders sold shares recently, suggesting caution`;
    }
  }

  return {
    ticker,
    overallSentiment,
    bullishSignals,
    bearishSignals,
    neutralSignals,
    recentBuys,
    recentSells,
    totalTransactions: transactions.length,
    clusteringDetected,
    clusteringDescription
  };
}

/**
 * Determine transaction type from description
 */
function determineTransactionType(description: string): 'buy' | 'sell' | 'option_exercise' | 'gift' | 'other' {
  const desc = description.toLowerCase();
  
  if (desc.includes('purchase') || desc.includes('buy') || desc.includes('acquisition')) {
    return 'buy';
  } else if (desc.includes('sale') || desc.includes('sell') || desc.includes('disposition')) {
    return 'sell';
  } else if (desc.includes('option') || desc.includes('exercise')) {
    return 'option_exercise';
  } else if (desc.includes('gift')) {
    return 'gift';
  }
  
  return 'other';
}

/**
 * Determine sentiment from transaction type and description
 */
function determineTransactionSentiment(
  type: string,
  description: string
): 'bullish' | 'bearish' | 'neutral' {
  // Buys are generally bullish
  if (type === 'buy') {
    return 'bullish';
  }
  
  // Sells are generally bearish, but check for exceptions
  if (type === 'sell') {
    const desc = description.toLowerCase();
    
    // Tax planning, estate planning, or diversification are neutral
    if (desc.includes('tax') || desc.includes('estate') || desc.includes('diversif') || desc.includes('10b5-1')) {
      return 'neutral';
    }
    
    return 'bearish';
  }
  
  // Option exercises can be neutral or bullish depending on whether shares are held
  if (type === 'option_exercise') {
    if (description.toLowerCase().includes('hold')) {
      return 'bullish';
    }
    return 'neutral';
  }
  
  // Gifts and other transactions are neutral
  return 'neutral';
}

/**
 * Detect clustering patterns (multiple insiders trading within 30 days)
 */
function detectClustering(transactions: InsiderTransaction[]): boolean {
  if (transactions.length < 3) return false;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate >= thirtyDaysAgo;
  });
  
  // Clustering detected if 3+ insiders traded within 30 days
  return recentTransactions.length >= 3;
}

/**
 * Get insider transactions filtered by type
 */
export async function getInsiderTransactionsByType(
  ticker: string,
  type: 'buy' | 'sell' | 'all'
): Promise<InsiderTransaction[]> {
  const transactions = await getInsiderTransactions(ticker);
  
  if (type === 'all') {
    return transactions;
  }
  
  return transactions.filter(t => t.transactionType === type);
}

/**
 * Get insider transactions within a date range
 */
export async function getInsiderTransactionsByDateRange(
  ticker: string,
  startDate: Date,
  endDate: Date
): Promise<InsiderTransaction[]> {
  const transactions = await getInsiderTransactions(ticker);
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.transactionDate);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}
