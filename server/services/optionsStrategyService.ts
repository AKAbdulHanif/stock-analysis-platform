/**
 * Options Strategy Service
 * 
 * Implements Black-Scholes option pricing model and calculates Greeks
 * for various options strategies including covered calls and protective puts.
 */

/**
 * Standard normal cumulative distribution function
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Standard normal probability density function
 */
function normalPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Black-Scholes option pricing parameters
 */
export interface BlackScholesParams {
  stockPrice: number;      // Current stock price (S)
  strikePrice: number;     // Option strike price (K)
  timeToExpiry: number;    // Time to expiration in years (T)
  riskFreeRate: number;    // Risk-free interest rate (r) - typically 10-year Treasury yield
  volatility: number;      // Implied volatility (σ) - annualized
  dividendYield?: number;  // Dividend yield (q) - optional, defaults to 0
}

/**
 * Option Greeks
 */
export interface Greeks {
  delta: number;    // Rate of change of option price with respect to stock price
  gamma: number;    // Rate of change of delta with respect to stock price
  theta: number;    // Rate of change of option price with respect to time (per day)
  vega: number;     // Rate of change of option price with respect to volatility (per 1%)
  rho: number;      // Rate of change of option price with respect to interest rate (per 1%)
}

/**
 * Option pricing result
 */
export interface OptionPrice {
  call: number;     // Call option price
  put: number;      // Put option price
  greeks: {
    call: Greeks;
    put: Greeks;
  };
}

/**
 * Calculate d1 and d2 for Black-Scholes formula
 */
function calculateD1D2(params: BlackScholesParams): { d1: number; d2: number } {
  const { stockPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = params;
  
  const d1 = (Math.log(stockPrice / strikePrice) + 
    (riskFreeRate - dividendYield + 0.5 * volatility * volatility) * timeToExpiry) / 
    (volatility * Math.sqrt(timeToExpiry));
  
  const d2 = d1 - volatility * Math.sqrt(timeToExpiry);
  
  return { d1, d2 };
}

/**
 * Calculate Black-Scholes option prices and Greeks
 */
export function calculateBlackScholes(params: BlackScholesParams): OptionPrice {
  const { stockPrice, strikePrice, timeToExpiry, riskFreeRate, volatility, dividendYield = 0 } = params;
  
  // Calculate d1 and d2
  const { d1, d2 } = calculateD1D2(params);
  
  // Calculate option prices
  const callPrice = stockPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(d1) - 
    strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(d2);
  
  const putPrice = strikePrice * Math.exp(-riskFreeRate * timeToExpiry) * normalCDF(-d2) - 
    stockPrice * Math.exp(-dividendYield * timeToExpiry) * normalCDF(-d1);
  
  // Calculate Greeks
  const sqrtT = Math.sqrt(timeToExpiry);
  const expDivT = Math.exp(-dividendYield * timeToExpiry);
  const expRfT = Math.exp(-riskFreeRate * timeToExpiry);
  
  // Delta
  const callDelta = expDivT * normalCDF(d1);
  const putDelta = expDivT * (normalCDF(d1) - 1);
  
  // Gamma (same for call and put)
  const gamma = (expDivT * normalPDF(d1)) / (stockPrice * volatility * sqrtT);
  
  // Theta (per day, divide by 365)
  const callTheta = (
    -(stockPrice * normalPDF(d1) * volatility * expDivT) / (2 * sqrtT) -
    riskFreeRate * strikePrice * expRfT * normalCDF(d2) +
    dividendYield * stockPrice * expDivT * normalCDF(d1)
  ) / 365;
  
  const putTheta = (
    -(stockPrice * normalPDF(d1) * volatility * expDivT) / (2 * sqrtT) +
    riskFreeRate * strikePrice * expRfT * normalCDF(-d2) -
    dividendYield * stockPrice * expDivT * normalCDF(-d1)
  ) / 365;
  
  // Vega (per 1% change in volatility)
  const vega = (stockPrice * expDivT * normalPDF(d1) * sqrtT) / 100;
  
  // Rho (per 1% change in interest rate)
  const callRho = (strikePrice * timeToExpiry * expRfT * normalCDF(d2)) / 100;
  const putRho = -(strikePrice * timeToExpiry * expRfT * normalCDF(-d2)) / 100;
  
  return {
    call: callPrice,
    put: putPrice,
    greeks: {
      call: {
        delta: callDelta,
        gamma: gamma,
        theta: callTheta,
        vega: vega,
        rho: callRho
      },
      put: {
        delta: putDelta,
        gamma: gamma,
        theta: putTheta,
        vega: vega,
        rho: putRho
      }
    }
  };
}

/**
 * Covered Call Strategy
 * Buy 100 shares + Sell 1 call option
 */
export interface CoveredCallResult {
  strategy: 'covered_call';
  stockPrice: number;
  strikePrice: number;
  premium: number;           // Premium received from selling call
  maxProfit: number;         // Max profit if stock reaches strike
  maxLoss: number;           // Max loss if stock goes to 0
  breakEven: number;         // Break-even stock price
  returnIfCalled: number;    // Return if option is exercised (%)
  returnIfExpires: number;   // Return if option expires worthless (%)
  greeks: Greeks;
}

export function calculateCoveredCall(
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  dividendYield: number = 0
): CoveredCallResult {
  // Calculate option price
  const optionPrice = calculateBlackScholes({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield
  });
  
  const premium = optionPrice.call * 100; // Premium for 1 contract (100 shares)
  const costBasis = stockPrice * 100;     // Cost of 100 shares
  
  // Max profit: (Strike - Stock Price) * 100 + Premium
  const maxProfit = (strikePrice - stockPrice) * 100 + premium;
  
  // Max loss: Cost basis - Premium (if stock goes to 0)
  const maxLoss = -(costBasis - premium);
  
  // Break-even: Stock Price - Premium per share
  const breakEven = stockPrice - (premium / 100);
  
  // Return if called: Max profit / Cost basis
  const returnIfCalled = (maxProfit / costBasis) * 100;
  
  // Return if expires: Premium / Cost basis
  const returnIfExpires = (premium / costBasis) * 100;
  
  return {
    strategy: 'covered_call',
    stockPrice,
    strikePrice,
    premium,
    maxProfit,
    maxLoss,
    breakEven,
    returnIfCalled,
    returnIfExpires,
    greeks: optionPrice.greeks.call
  };
}

/**
 * Protective Put Strategy
 * Buy 100 shares + Buy 1 put option
 */
export interface ProtectivePutResult {
  strategy: 'protective_put';
  stockPrice: number;
  strikePrice: number;
  premium: number;           // Premium paid for buying put
  maxProfit: number;         // Unlimited upside (approximated)
  maxLoss: number;           // Max loss if stock drops to strike
  breakEven: number;         // Break-even stock price
  protection: number;        // Downside protection (%)
  costOfProtection: number;  // Cost of protection as % of stock price
  greeks: Greeks;
}

export function calculateProtectivePut(
  stockPrice: number,
  strikePrice: number,
  timeToExpiry: number,
  riskFreeRate: number,
  volatility: number,
  dividendYield: number = 0
): ProtectivePutResult {
  // Calculate option price
  const optionPrice = calculateBlackScholes({
    stockPrice,
    strikePrice,
    timeToExpiry,
    riskFreeRate,
    volatility,
    dividendYield
  });
  
  const premium = optionPrice.put * 100; // Premium for 1 contract (100 shares)
  const costBasis = stockPrice * 100 + premium; // Cost of 100 shares + put premium
  
  // Max profit: Unlimited (approximate with 50% gain)
  const maxProfit = (stockPrice * 1.5 - stockPrice) * 100 - premium;
  
  // Max loss: (Stock Price - Strike Price) * 100 + Premium
  const maxLoss = -(stockPrice - strikePrice) * 100 - premium;
  
  // Break-even: Stock Price + Premium per share
  const breakEven = stockPrice + (premium / 100);
  
  // Protection: Percentage of downside protected
  const protection = ((stockPrice - strikePrice) / stockPrice) * 100;
  
  // Cost of protection: Premium as % of stock price
  const costOfProtection = (premium / (stockPrice * 100)) * 100;
  
  return {
    strategy: 'protective_put',
    stockPrice,
    strikePrice,
    premium,
    maxProfit,
    maxLoss,
    breakEven,
    protection,
    costOfProtection,
    greeks: optionPrice.greeks.put
  };
}

/**
 * Generate profit/loss data points for payoff diagram
 */
export interface PayoffPoint {
  stockPrice: number;
  profit: number;
}

export function generateCoveredCallPayoff(
  currentStockPrice: number,
  strikePrice: number,
  premium: number,
  points: number = 50
): PayoffPoint[] {
  const minPrice = currentStockPrice * 0.5;
  const maxPrice = currentStockPrice * 1.5;
  const step = (maxPrice - minPrice) / points;
  
  const payoff: PayoffPoint[] = [];
  
  for (let price = minPrice; price <= maxPrice; price += step) {
    let profit: number;
    
    if (price <= strikePrice) {
      // Stock below strike: Keep stock + premium
      profit = (price - currentStockPrice) * 100 + premium;
    } else {
      // Stock above strike: Called away at strike
      profit = (strikePrice - currentStockPrice) * 100 + premium;
    }
    
    payoff.push({ stockPrice: price, profit });
  }
  
  return payoff;
}

export function generateProtectivePutPayoff(
  currentStockPrice: number,
  strikePrice: number,
  premium: number,
  points: number = 50
): PayoffPoint[] {
  const minPrice = currentStockPrice * 0.5;
  const maxPrice = currentStockPrice * 1.5;
  const step = (maxPrice - minPrice) / points;
  
  const payoff: PayoffPoint[] = [];
  
  for (let price = minPrice; price <= maxPrice; price += step) {
    let profit: number;
    
    if (price < strikePrice) {
      // Stock below strike: Put protects downside
      profit = (strikePrice - currentStockPrice) * 100 - premium;
    } else {
      // Stock above strike: Gain from stock - premium
      profit = (price - currentStockPrice) * 100 - premium;
    }
    
    payoff.push({ stockPrice: price, profit });
  }
  
  return payoff;
}
