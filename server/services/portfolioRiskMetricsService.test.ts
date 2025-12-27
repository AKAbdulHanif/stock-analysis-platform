import { describe, it, expect } from 'vitest';
import { calculatePortfolioRisk, type PortfolioHolding } from './portfolioRiskMetricsService';

describe('portfolioRiskMetricsService', () => {
  it('should calculate portfolio risk metrics', async () => {
    const holdings: PortfolioHolding[] = [
      { ticker: 'AAPL', shares: 100, avgCost: 150 },
      { ticker: 'GOOGL', shares: 50, avgCost: 2500 },
    ];
    
    const metrics = await calculatePortfolioRisk(holdings);
    
    expect(metrics).toBeDefined();
    expect(metrics.sharpeRatio).toBeDefined();
    expect(metrics.beta).toBeDefined();
    expect(metrics.volatility).toBeDefined();
  });

  it('should handle empty portfolio', async () => {
    const holdings: PortfolioHolding[] = [];
    
    const metrics = await calculatePortfolioRisk(holdings);
    
    expect(metrics).toBeDefined();
  });
});
