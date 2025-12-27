import { getStockQuote } from './yahooFinanceService';

interface PortfolioHolding {
  ticker: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string; // ISO date string
}

interface LossPosition {
  ticker: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  unrealizedLoss: number;
  lossPercentage: number;
  holdingPeriod: number; // days
  isLongTerm: boolean; // > 365 days
  taxRate: number; // 0.20 for long-term, 0.37 for short-term
  taxSavings: number;
  washSaleRisk: boolean;
}

interface ReplacementSuggestion {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  correlation: number; // 0-1, similarity to original stock
  reason: string;
}

interface TaxLossHarvestingResult {
  losingPositions: LossPosition[];
  replacementSuggestions: Map<string, ReplacementSuggestion[]>;
  totalTaxSavings: number;
  totalUnrealizedLoss: number;
  summary: {
    totalPositions: number;
    losingPositions: number;
    shortTermLosses: number;
    longTermLosses: number;
    washSaleWarnings: number;
  };
}

// Predefined replacement suggestions by sector
const REPLACEMENT_MAP: Record<string, ReplacementSuggestion[]> = {
  // Technology / Semiconductors
  AAPL: [
    { ticker: 'MSFT', name: 'Microsoft', sector: 'Technology', currentPrice: 0, correlation: 0.85, reason: 'Large-cap tech with similar fundamentals' },
    { ticker: 'GOOGL', name: 'Alphabet', sector: 'Technology', currentPrice: 0, correlation: 0.82, reason: 'Diversified tech giant' },
    { ticker: 'META', name: 'Meta Platforms', sector: 'Technology', currentPrice: 0, correlation: 0.78, reason: 'Tech leader with strong growth' },
  ],
  NVDA: [
    { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors', currentPrice: 0, correlation: 0.92, reason: 'Direct competitor in GPU/CPU market' },
    { ticker: 'AVGO', name: 'Broadcom', sector: 'Semiconductors', currentPrice: 0, correlation: 0.88, reason: 'Diversified semiconductor company' },
    { ticker: 'QCOM', name: 'Qualcomm', sector: 'Semiconductors', currentPrice: 0, correlation: 0.85, reason: 'Leading chip designer' },
  ],
  TSM: [
    { ticker: 'INTC', name: 'Intel', sector: 'Semiconductors', currentPrice: 0, correlation: 0.87, reason: 'Major chip manufacturer' },
    { ticker: 'MU', name: 'Micron Technology', sector: 'Semiconductors', currentPrice: 0, correlation: 0.84, reason: 'Memory chip leader' },
    { ticker: 'ASML', name: 'ASML Holding', sector: 'Semiconductors', currentPrice: 0, correlation: 0.82, reason: 'Semiconductor equipment supplier' },
  ],
  
  // Healthcare
  UNH: [
    { ticker: 'CVS', name: 'CVS Health', sector: 'Healthcare', currentPrice: 0, correlation: 0.89, reason: 'Integrated healthcare services' },
    { ticker: 'CI', name: 'Cigna', sector: 'Healthcare', currentPrice: 0, correlation: 0.91, reason: 'Health insurance competitor' },
    { ticker: 'HUM', name: 'Humana', sector: 'Healthcare', currentPrice: 0, correlation: 0.88, reason: 'Medicare Advantage focus' },
  ],
  JNJ: [
    { ticker: 'PFE', name: 'Pfizer', sector: 'Healthcare', currentPrice: 0, correlation: 0.86, reason: 'Diversified pharmaceuticals' },
    { ticker: 'ABBV', name: 'AbbVie', sector: 'Healthcare', currentPrice: 0, correlation: 0.84, reason: 'Biopharmaceutical leader' },
    { ticker: 'MRK', name: 'Merck', sector: 'Healthcare', currentPrice: 0, correlation: 0.83, reason: 'Global healthcare company' },
  ],
  
  // Financials
  JPM: [
    { ticker: 'BAC', name: 'Bank of America', sector: 'Financials', currentPrice: 0, correlation: 0.93, reason: 'Major banking competitor' },
    { ticker: 'WFC', name: 'Wells Fargo', sector: 'Financials', currentPrice: 0, correlation: 0.91, reason: 'Large diversified bank' },
    { ticker: 'C', name: 'Citigroup', sector: 'Financials', currentPrice: 0, correlation: 0.89, reason: 'Global banking services' },
  ],
  GS: [
    { ticker: 'MS', name: 'Morgan Stanley', sector: 'Financials', currentPrice: 0, correlation: 0.94, reason: 'Investment banking competitor' },
    { ticker: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', currentPrice: 0, correlation: 0.91, reason: 'Diversified financial services' },
    { ticker: 'BLK', name: 'BlackRock', sector: 'Financials', currentPrice: 0, correlation: 0.87, reason: 'Asset management leader' },
  ],
};

/**
 * Calculate the number of days between two dates
 */
function daysBetween(date1: string, date2: Date): number {
  const d1 = new Date(date1);
  const d2 = date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a position is at risk of wash sale rule (sold within 30 days of purchase)
 */
function checkWashSaleRisk(purchaseDate: string): boolean {
  const today = new Date();
  const daysSincePurchase = daysBetween(purchaseDate, today);
  return daysSincePurchase <= 30;
}

/**
 * Analyze portfolio holdings for tax-loss harvesting opportunities
 */
export async function analyzeTaxLossHarvesting(
  holdings: PortfolioHolding[]
): Promise<TaxLossHarvestingResult> {
  const losingPositions: LossPosition[] = [];
  const replacementSuggestions = new Map<string, ReplacementSuggestion[]>();
  
  let totalTaxSavings = 0;
  let totalUnrealizedLoss = 0;
  let shortTermLosses = 0;
  let longTermLosses = 0;
  let washSaleWarnings = 0;

  // Analyze each holding
  for (const holding of holdings) {
    try {
      // Fetch current price
      const quote = await getStockQuote(holding.ticker);
      const currentPrice = quote.regularMarketPrice;
      
      // Calculate metrics
      const currentValue = currentPrice * holding.shares;
      const costBasis = holding.purchasePrice * holding.shares;
      const unrealizedLoss = currentValue - costBasis;
      
      // Only include losing positions
      if (unrealizedLoss < 0) {
        const today = new Date();
        const holdingPeriod = daysBetween(holding.purchaseDate, today);
        const isLongTerm = holdingPeriod > 365;
        const taxRate = isLongTerm ? 0.20 : 0.37; // Long-term: 20%, Short-term: 37%
        const taxSavings = Math.abs(unrealizedLoss) * taxRate;
        const washSaleRisk = checkWashSaleRisk(holding.purchaseDate);
        
        const lossPosition: LossPosition = {
          ticker: holding.ticker,
          shares: holding.shares,
          purchasePrice: holding.purchasePrice,
          purchaseDate: holding.purchaseDate,
          currentPrice,
          currentValue,
          costBasis,
          unrealizedLoss,
          lossPercentage: (unrealizedLoss / costBasis) * 100,
          holdingPeriod,
          isLongTerm,
          taxRate,
          taxSavings,
          washSaleRisk,
        };
        
        losingPositions.push(lossPosition);
        totalTaxSavings += taxSavings;
        totalUnrealizedLoss += Math.abs(unrealizedLoss);
        
        if (isLongTerm) {
          longTermLosses++;
        } else {
          shortTermLosses++;
        }
        
        if (washSaleRisk) {
          washSaleWarnings++;
        }
        
        // Get replacement suggestions
        const replacements = REPLACEMENT_MAP[holding.ticker] || [];
        if (replacements.length > 0) {
          // Fetch current prices for replacements
          const replacementsWithPrices = await Promise.all(
            replacements.map(async (replacement) => {
              try {
                const replQuote = await getStockQuote(replacement.ticker);
                return {
                  ...replacement,
                  currentPrice: replQuote.regularMarketPrice,
                };
              } catch (error) {
                console.error(`Failed to fetch price for ${replacement.ticker}:`, error);
                return replacement;
              }
            })
          );
          replacementSuggestions.set(holding.ticker, replacementsWithPrices);
        }
      }
    } catch (error) {
      console.error(`Failed to analyze ${holding.ticker}:`, error);
    }
  }

  return {
    losingPositions,
    replacementSuggestions,
    totalTaxSavings,
    totalUnrealizedLoss,
    summary: {
      totalPositions: holdings.length,
      losingPositions: losingPositions.length,
      shortTermLosses,
      longTermLosses,
      washSaleWarnings,
    },
  };
}
