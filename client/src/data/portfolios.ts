/**
 * Risk-Based Portfolio Data
 * 
 * Contains the three portfolio strategies from Phase 3 research:
 * - Conservative: Capital preservation and dividend income (8-12% target return)
 * - Moderate: Balanced growth and income (12-18% target return)
 * - Aggressive: Maximum capital appreciation (20-30%+ target return)
 */

export interface PortfolioStock {
  ticker: string;
  name: string;
  sector: 'Semiconductors' | 'Healthcare' | 'Financials';
  allocation: number; // Percentage
  currentPrice: number;
  targetPriceLow: number;
  targetPriceHigh: number;
  peRatio: number;
  dividendYield: number;
  thesis: string;
}

export interface Portfolio {
  id: string;
  name: string;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  description: string;
  targetReturn: string;
  maxDrawdown: string;
  avgPE: number;
  avgDividendYield: number;
  sectorAllocation: {
    Healthcare: number;
    Semiconductors: number;
    Financials: number;
  };
  stocks: PortfolioStock[];
  investorProfile: {
    ageRange: string;
    investmentHorizon: string;
    riskTolerance: string;
  };
}

export const CONSERVATIVE_PORTFOLIO: Portfolio = {
  id: 'conservative',
  name: 'Conservative Portfolio',
  riskLevel: 'Conservative',
  description: 'Prioritizes capital preservation and dividend income with defensive healthcare and stable financial stocks.',
  targetReturn: '8-12%',
  maxDrawdown: '15-20%',
  avgPE: 16,
  avgDividendYield: 2.4,
  sectorAllocation: {
    Healthcare: 50,
    Financials: 30,
    Semiconductors: 20,
  },
  stocks: [
    {
      ticker: 'JNJ',
      name: 'Johnson & Johnson',
      sector: 'Healthcare',
      allocation: 20,
      currentPrice: 206.35,
      targetPriceLow: 220,
      targetPriceHigh: 240,
      peRatio: 15,
      dividendYield: 2.49,
      thesis: 'Defensive quality with consistent dividend growth. Diversified business model across pharmaceuticals, medical devices, and consumer health. Trading at 33% discount to S&P 500 despite strong fundamentals.',
    },
    {
      ticker: 'UNH',
      name: 'UnitedHealth Group',
      sector: 'Healthcare',
      allocation: 15,
      currentPrice: 485,
      targetPriceLow: 580,
      targetPriceHigh: 650,
      peRatio: 18,
      dividendYield: 2.5,
      thesis: 'Managed care leader with dominant market position. Recent concerns create attractive entry point. 30% upside potential over 2026-2027 as fundamentals remain strong.',
    },
    {
      ticker: 'ABBV',
      name: 'AbbVie Inc.',
      sector: 'Healthcare',
      allocation: 15,
      currentPrice: 178,
      targetPriceLow: 185,
      targetPriceHigh: 205,
      peRatio: 14,
      dividendYield: 3.5,
      thesis: 'Highest dividend yield in portfolio. Successful post-Humira transition with strong growth from Skyrizi and Rinvoq. Diversified pipeline provides future growth.',
    },
    {
      ticker: 'JPM',
      name: 'JPMorgan Chase',
      sector: 'Financials',
      allocation: 20,
      currentPrice: 217,
      targetPriceLow: 260,
      targetPriceHigh: 290,
      peRatio: 15,
      dividendYield: 2.5,
      thesis: 'Fortress balance sheet and diversified business model. Positioned to benefit from investment banking recovery in 2026. Trading at 34% discount to S&P 500.',
    },
    {
      ticker: 'BAC',
      name: 'Bank of America',
      sector: 'Financials',
      allocation: 10,
      currentPrice: 43.5,
      targetPriceLow: 50,
      targetPriceHigh: 58,
      peRatio: 10,
      dividendYield: 2.0,
      thesis: 'Deep value at 10x P/E (55% discount to market). Strong wealth management franchise and digital banking platform. 12 years of consecutive dividend increases.',
    },
    {
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      sector: 'Semiconductors',
      allocation: 15,
      currentPrice: 287,
      targetPriceLow: 330,
      targetPriceHigh: 360,
      peRatio: 29.5,
      dividendYield: 1.17,
      thesis: 'Foundry leadership with pricing power in advanced nodes. Exclusive manufacturer for Apple and NVIDIA. Raising prices in 2026 due to unmet demand.',
    },
    {
      ticker: 'TXN',
      name: 'Texas Instruments',
      sector: 'Semiconductors',
      allocation: 5,
      currentPrice: 200,
      targetPriceLow: 210,
      targetPriceHigh: 230,
      peRatio: 22,
      dividendYield: 3.0,
      thesis: 'Stable analog chip franchise with defensive characteristics. Less cyclical than memory or logic chips. Strong dividend and consistent free cash flow.',
    },
  ],
  investorProfile: {
    ageRange: '55-70 years',
    investmentHorizon: '3-5 years',
    riskTolerance: 'Low - Cannot afford significant drawdowns',
  },
};

export const MODERATE_PORTFOLIO: Portfolio = {
  id: 'moderate',
  name: 'Moderate Portfolio',
  riskLevel: 'Moderate',
  description: 'Balances growth and income with AI exposure through semiconductors and healthcare innovation.',
  targetReturn: '12-18%',
  maxDrawdown: '25-30%',
  avgPE: 18,
  avgDividendYield: 1.5,
  sectorAllocation: {
    Healthcare: 35,
    Semiconductors: 35,
    Financials: 30,
  },
  stocks: [
    {
      ticker: 'LLY',
      name: 'Eli Lilly',
      sector: 'Healthcare',
      allocation: 20,
      currentPrice: 865,
      targetPriceLow: 950,
      targetPriceHigh: 1100,
      peRatio: 40,
      dividendYield: 0.7,
      thesis: 'GLP-1 franchise dominance with Mounjaro and Zepbound. Projected to become largest pharma by revenue in 2026. $100B+ obesity market opportunity with multi-year growth visibility.',
    },
    {
      ticker: 'UNH',
      name: 'UnitedHealth Group',
      sector: 'Healthcare',
      allocation: 15,
      currentPrice: 485,
      targetPriceLow: 580,
      targetPriceHigh: 650,
      peRatio: 18,
      dividendYield: 2.5,
      thesis: 'Balanced growth and income with defensive characteristics. Double-digit earnings growth expected in 2026 with 30% upside potential.',
    },
    {
      ticker: 'TSM',
      name: 'Taiwan Semiconductor',
      sector: 'Semiconductors',
      allocation: 15,
      currentPrice: 287,
      targetPriceLow: 330,
      targetPriceHigh: 360,
      peRatio: 29.5,
      dividendYield: 1.17,
      thesis: 'Core semiconductor holding with AI exposure. Foundry leadership and pricing power in 3nm/2nm nodes. Exclusive manufacturer for NVIDIA AI chips.',
    },
    {
      ticker: 'MU',
      name: 'Micron Technology',
      sector: 'Semiconductors',
      allocation: 20,
      currentPrice: 108,
      targetPriceLow: 140,
      targetPriceHigh: 180,
      peRatio: 25,
      dividendYield: 0.5,
      thesis: 'HBM supercycle with sold-out capacity through 2026. Can only meet 60% of customer demand. 40% annual TAM growth through 2028. Entering profit supercycle.',
    },
    {
      ticker: 'JPM',
      name: 'JPMorgan Chase',
      sector: 'Financials',
      allocation: 15,
      currentPrice: 217,
      targetPriceLow: 260,
      targetPriceHigh: 290,
      peRatio: 15,
      dividendYield: 2.5,
      thesis: 'Investment banking leverage to capital markets recovery. Fortress balance sheet provides downside protection. M&A and IPO pipeline building for 2026.',
    },
    {
      ticker: 'GS',
      name: 'Goldman Sachs',
      sector: 'Financials',
      allocation: 15,
      currentPrice: 520,
      targetPriceLow: 650,
      targetPriceHigh: 750,
      peRatio: 11,
      dividendYield: 2.3,
      thesis: 'Maximum investment banking leverage at deep value valuation. Record M&A surge expected to extend into 2026. 10.8% revenue growth in 2025, 6% in 2026.',
    },
  ],
  investorProfile: {
    ageRange: '35-55 years',
    investmentHorizon: '5-10 years',
    riskTolerance: 'Medium - Can withstand moderate volatility',
  },
};

export const AGGRESSIVE_PORTFOLIO: Portfolio = {
  id: 'aggressive',
  name: 'Aggressive Portfolio',
  riskLevel: 'Aggressive',
  description: 'Maximizes capital appreciation with concentrated AI exposure and investment banking leverage.',
  targetReturn: '20-30%+',
  maxDrawdown: '40-50%',
  avgPE: 28,
  avgDividendYield: 0.5,
  sectorAllocation: {
    Semiconductors: 45,
    Financials: 30,
    Healthcare: 25,
  },
  stocks: [
    {
      ticker: 'NVDA',
      name: 'NVIDIA',
      sector: 'Semiconductors',
      allocation: 20,
      currentPrice: 133,
      targetPriceLow: 160,
      targetPriceHigh: 200,
      peRatio: 45,
      dividendYield: 0.03,
      thesis: 'Purest AI exposure through GPU dominance. Data center revenue growing triple digits. Next-gen Blackwell architecture maintains technology leadership. CUDA ecosystem creates switching costs.',
    },
    {
      ticker: 'MU',
      name: 'Micron Technology',
      sector: 'Semiconductors',
      allocation: 15,
      currentPrice: 108,
      targetPriceLow: 140,
      targetPriceHigh: 180,
      peRatio: 25,
      dividendYield: 0.5,
      thesis: 'Maximum leverage to AI memory demand. HBM supply constraints create exceptional pricing power. Analyst price target of $500 represents significant upside potential.',
    },
    {
      ticker: 'AMD',
      name: 'Advanced Micro Devices',
      sector: 'Semiconductors',
      allocation: 10,
      currentPrice: 133,
      targetPriceLow: 180,
      targetPriceHigh: 220,
      peRatio: 35,
      dividendYield: 0,
      thesis: 'AI exposure with better valuation than NVIDIA. MI300 GPUs winning design wins at major cloud providers. CPU market share gains from Intel provide stable cash flow.',
    },
    {
      ticker: 'GS',
      name: 'Goldman Sachs',
      sector: 'Financials',
      allocation: 20,
      currentPrice: 520,
      targetPriceLow: 650,
      targetPriceHigh: 750,
      peRatio: 11,
      dividendYield: 2.3,
      thesis: 'Maximum investment banking leverage at 11x P/E. Capital markets recovery creates asymmetric upside. Premier brand captures disproportionate share of high-margin mandates.',
    },
    {
      ticker: 'MS',
      name: 'Morgan Stanley',
      sector: 'Financials',
      allocation: 10,
      currentPrice: 112,
      targetPriceLow: 135,
      targetPriceHigh: 155,
      peRatio: 13,
      dividendYield: 3.0,
      thesis: 'Investment banking leverage with wealth management stability. Diversified revenue streams reduce volatility. Benefits from capital markets recovery plus steady fee-based growth.',
    },
    {
      ticker: 'LLY',
      name: 'Eli Lilly',
      sector: 'Healthcare',
      allocation: 15,
      currentPrice: 865,
      targetPriceLow: 950,
      targetPriceHigh: 1100,
      peRatio: 40,
      dividendYield: 0.7,
      thesis: 'Exceptional growth through GLP-1 dominance. Capacity expansions directly translate to revenue growth. Transformative obesity treatment market with multi-year runway.',
    },
    {
      ticker: 'VRTX',
      name: 'Vertex Pharmaceuticals',
      sector: 'Healthcare',
      allocation: 10,
      currentPrice: 478,
      targetPriceLow: 550,
      targetPriceHigh: 650,
      peRatio: 28,
      dividendYield: 0,
      thesis: 'Biotech exposure with CF franchise cash flow funding gene therapy pipeline. Sickle cell and beta thalassemia programs offer curative potential and significant value.',
    },
  ],
  investorProfile: {
    ageRange: '25-45 years',
    investmentHorizon: '10+ years',
    riskTolerance: 'High - Can withstand significant volatility',
  },
};

export const ALL_PORTFOLIOS: Portfolio[] = [
  CONSERVATIVE_PORTFOLIO,
  MODERATE_PORTFOLIO,
  AGGRESSIVE_PORTFOLIO,
];

// Helper function to get portfolio by ID
export function getPortfolioById(id: string): Portfolio | undefined {
  return ALL_PORTFOLIOS.find(p => p.id === id);
}

// Helper function to get all unique tickers across portfolios
export function getAllTickers(): string[] {
  const tickers = new Set<string>();
  ALL_PORTFOLIOS.forEach(portfolio => {
    portfolio.stocks.forEach(stock => {
      tickers.add(stock.ticker);
    });
  });
  return Array.from(tickers).sort();
}
