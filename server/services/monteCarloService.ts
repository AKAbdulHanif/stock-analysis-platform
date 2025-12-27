import { getChartData } from './yahooFinanceService';

interface MonteCarloConfig {
  tickers: string[];
  allocations: number[];
  timeHorizonYears: number;
  simulationsCount: number;
  initialCapital: number;
}

interface SimulationResult {
  percentiles: {
    p10: number[];
    p25: number[];
    p50: number[];
    p75: number[];
    p90: number[];
  };
  finalValues: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    mean: number;
    worst: number;
    best: number;
  };
  probabilities: {
    positiveReturn: number;
    doubleReturn: number;
    lossGreaterThan20: number;
    lossGreaterThan50: number;
  };
  expectedValue: number;
  expectedReturn: number;
  riskMetrics: {
    volatility: number;
    valueAtRisk95: number;
    conditionalValueAtRisk95: number;
  };
}

/**
 * Calculate historical returns and volatility for a stock
 */
async function calculateHistoricalStatistics(ticker: string): Promise<{
  meanReturn: number;
  volatility: number;
}> {
  // Fetch 2 years of historical data
  const chartData = await getChartData(ticker, '2y', '1d');
  
  if (!chartData || !chartData.dataPoints || chartData.dataPoints.length < 2) {
    throw new Error(`Insufficient historical data for ${ticker}`);
  }

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < chartData.dataPoints.length; i++) {
    const prevPrice = chartData.dataPoints[i - 1].close;
    const currPrice = chartData.dataPoints[i].close;
    if (prevPrice && currPrice) {
      const dailyReturn = (currPrice - prevPrice) / prevPrice;
      returns.push(dailyReturn);
    }
  }

  if (returns.length === 0) {
    throw new Error(`No valid returns calculated for ${ticker}`);
  }

  // Calculate mean and standard deviation
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Annualize (assuming ~252 trading days per year)
  const annualizedMean = meanReturn * 252;
  const annualizedVolatility = volatility * Math.sqrt(252);

  return {
    meanReturn: annualizedMean,
    volatility: annualizedVolatility,
  };
}

/**
 * Generate random return using Box-Muller transform for normal distribution
 */
function generateRandomReturn(mean: number, volatility: number): number {
  // Box-Muller transform to generate normally distributed random numbers
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  return mean + volatility * z;
}

/**
 * Run a single Monte Carlo simulation path
 */
function runSingleSimulation(
  initialValue: number,
  stockStats: Array<{ meanReturn: number; volatility: number }>,
  allocations: number[],
  timeHorizonYears: number,
  tradingDaysPerYear: number = 252
): number[] {
  const totalDays = timeHorizonYears * tradingDaysPerYear;
  const portfolioValues: number[] = [initialValue];

  let currentValue = initialValue;

  for (let day = 1; day <= totalDays; day++) {
    // Calculate portfolio return for this day
    let portfolioReturn = 0;
    
    for (let i = 0; i < stockStats.length; i++) {
      const dailyMean = stockStats[i].meanReturn / tradingDaysPerYear;
      const dailyVolatility = stockStats[i].volatility / Math.sqrt(tradingDaysPerYear);
      const stockReturn = generateRandomReturn(dailyMean, dailyVolatility);
      portfolioReturn += allocations[i] * stockReturn;
    }

    currentValue = currentValue * (1 + portfolioReturn);
    portfolioValues.push(currentValue);
  }

  return portfolioValues;
}

/**
 * Calculate percentile from sorted array
 */
function calculatePercentile(sortedArray: number[], percentile: number): number {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return sortedArray[lower];
  }
  
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Run Monte Carlo simulation
 */
export async function runMonteCarloSimulation(config: MonteCarloConfig): Promise<SimulationResult> {
  const { tickers, allocations, timeHorizonYears, simulationsCount, initialCapital } = config;

  // Validate allocations sum to 1
  const allocationSum = allocations.reduce((sum, a) => sum + a, 0);
  if (Math.abs(allocationSum - 1.0) > 0.001) {
    throw new Error('Allocations must sum to 100%');
  }

  // Fetch historical statistics for all stocks
  console.log(`[Monte Carlo] Fetching historical statistics for ${tickers.length} stocks...`);
  const stockStats = await Promise.all(
    tickers.map(ticker => calculateHistoricalStatistics(ticker))
  );

  console.log(`[Monte Carlo] Running ${simulationsCount} simulations over ${timeHorizonYears} years...`);
  
  // Run all simulations
  const allSimulations: number[][] = [];
  for (let i = 0; i < simulationsCount; i++) {
    const simulation = runSingleSimulation(
      initialCapital,
      stockStats,
      allocations,
      timeHorizonYears
    );
    allSimulations.push(simulation);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`[Monte Carlo] Completed ${i + 1}/${simulationsCount} simulations`);
    }
  }

  // Calculate percentiles for each time step
  const timeSteps = allSimulations[0].length;
  const percentiles = {
    p10: [] as number[],
    p25: [] as number[],
    p50: [] as number[],
    p75: [] as number[],
    p90: [] as number[],
  };

  for (let t = 0; t < timeSteps; t++) {
    const valuesAtTimeT = allSimulations.map(sim => sim[t]).sort((a, b) => a - b);
    percentiles.p10.push(calculatePercentile(valuesAtTimeT, 10));
    percentiles.p25.push(calculatePercentile(valuesAtTimeT, 25));
    percentiles.p50.push(calculatePercentile(valuesAtTimeT, 50));
    percentiles.p75.push(calculatePercentile(valuesAtTimeT, 75));
    percentiles.p90.push(calculatePercentile(valuesAtTimeT, 90));
  }

  // Calculate final value statistics
  const finalValues = allSimulations.map(sim => sim[sim.length - 1]).sort((a, b) => a - b);
  const finalStats = {
    p10: calculatePercentile(finalValues, 10),
    p25: calculatePercentile(finalValues, 25),
    p50: calculatePercentile(finalValues, 50),
    p75: calculatePercentile(finalValues, 75),
    p90: calculatePercentile(finalValues, 90),
    mean: finalValues.reduce((sum, v) => sum + v, 0) / finalValues.length,
    worst: finalValues[0],
    best: finalValues[finalValues.length - 1],
  };

  // Calculate probabilities
  const positiveReturnCount = finalValues.filter(v => v > initialCapital).length;
  const doubleReturnCount = finalValues.filter(v => v >= initialCapital * 2).length;
  const loss20Count = finalValues.filter(v => v <= initialCapital * 0.8).length;
  const loss50Count = finalValues.filter(v => v <= initialCapital * 0.5).length;

  const probabilities = {
    positiveReturn: (positiveReturnCount / simulationsCount) * 100,
    doubleReturn: (doubleReturnCount / simulationsCount) * 100,
    lossGreaterThan20: (loss20Count / simulationsCount) * 100,
    lossGreaterThan50: (loss50Count / simulationsCount) * 100,
  };

  // Calculate expected value and return
  const expectedValue = finalStats.mean;
  const expectedReturn = ((expectedValue - initialCapital) / initialCapital) * 100;

  // Calculate risk metrics
  const returns = finalValues.map(v => (v - initialCapital) / initialCapital);
  const meanReturnValue = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturnValue, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100;

  const valueAtRisk95 = initialCapital - calculatePercentile(finalValues, 5);
  const cvar95Values = finalValues.filter(v => v <= calculatePercentile(finalValues, 5));
  const conditionalValueAtRisk95 = initialCapital - (cvar95Values.reduce((sum, v) => sum + v, 0) / cvar95Values.length);

  console.log(`[Monte Carlo] Simulation complete. Expected return: ${expectedReturn.toFixed(2)}%`);

  return {
    percentiles,
    finalValues: finalStats,
    probabilities,
    expectedValue,
    expectedReturn,
    riskMetrics: {
      volatility,
      valueAtRisk95,
      conditionalValueAtRisk95,
    },
  };
}
