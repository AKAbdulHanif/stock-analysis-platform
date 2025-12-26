import { getAllTrades, calculateTradeReturn, type TradeEntry } from "./performanceTracking";
import { ALERT_TEMPLATES, type AlertTemplate } from "./alertTemplates";

export interface CorrelationMatrix {
  templates: string[];
  correlations: number[][];
  descriptions: { [key: string]: string };
}

export interface TemplateCorrelation {
  template1: string;
  template2: string;
  correlation: number;
  combinedWinRate: number;
  combinedAvgReturn: number;
  diversificationBenefit: number;
  recommendation: "excellent" | "good" | "neutral" | "avoid";
}

export interface PortfolioRecommendation {
  templates: string[];
  expectedWinRate: number;
  expectedAvgReturn: number;
  diversificationScore: number;
  riskReduction: number;
  rationale: string;
}

/**
 * Get template by name
 */
function getTemplateByName(templateName: string): AlertTemplate | undefined {
  return ALERT_TEMPLATES.find((t) => t.name === templateName);
}

/**
 * Get trades for a specific template
 */
function getTemplateTradesByName(templateName: string): TradeEntry[] {
  const allTrades = getAllTrades();
  return allTrades.filter((trade) => trade.templateName === templateName);
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 */
function calculatePearsonCorrelation(arr1: number[], arr2: number[]): number {
  if (arr1.length === 0 || arr2.length === 0 || arr1.length !== arr2.length) {
    return 0;
  }

  const n = arr1.length;
  const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denominator1 * denominator2);
  if (denominator === 0) return 0;

  return numerator / denominator;
}

/**
 * Get returns for a template's trades
 */
function getTemplateReturns(templateName: string): number[] {
  const trades = getTemplateTradesByName(templateName);
  const closedTrades = trades.filter((t) => t.status === "closed");
  return closedTrades
    .map((trade) => calculateTradeReturn(trade))
    .filter((ret): ret is number => ret !== null);
}

/**
 * Calculate combined performance metrics for two templates
 */
function calculateCombinedMetrics(
  template1: string,
  template2: string
): {
  combinedWinRate: number;
  combinedAvgReturn: number;
  template1WinRate: number;
  template2WinRate: number;
  template1AvgReturn: number;
  template2AvgReturn: number;
} {
  const trades1 = getTemplateTradesByName(template1).filter((t) => t.status === "closed");
  const trades2 = getTemplateTradesByName(template2).filter((t) => t.status === "closed");

  const returns1 = trades1
    .map((trade) => calculateTradeReturn(trade))
    .filter((ret): ret is number => ret !== null);
  const returns2 = trades2
    .map((trade) => calculateTradeReturn(trade))
    .filter((ret): ret is number => ret !== null);

  const allReturns = [...returns1, ...returns2];
  const allTrades = [...trades1, ...trades2];

  const winRate1 = returns1.length > 0 ? (returns1.filter((r) => r > 0).length / returns1.length) * 100 : 0;
  const winRate2 = returns2.length > 0 ? (returns2.filter((r) => r > 0).length / returns2.length) * 100 : 0;
  const combinedWinRate = allReturns.length > 0 ? (allReturns.filter((r) => r > 0).length / allReturns.length) * 100 : 0;

  const avgReturn1 = returns1.length > 0 ? returns1.reduce((a, b) => a + b, 0) / returns1.length : 0;
  const avgReturn2 = returns2.length > 0 ? returns2.reduce((a, b) => a + b, 0) / returns2.length : 0;
  const combinedAvgReturn = allReturns.length > 0 ? allReturns.reduce((a, b) => a + b, 0) / allReturns.length : 0;

  return {
    combinedWinRate,
    combinedAvgReturn,
    template1WinRate: winRate1,
    template2WinRate: winRate2,
    template1AvgReturn: avgReturn1,
    template2AvgReturn: avgReturn2
  };
}

/**
 * Calculate diversification benefit (how much combining templates reduces volatility)
 */
function calculateDiversificationBenefit(
  returns1: number[],
  returns2: number[]
): number {
  if (returns1.length === 0 || returns2.length === 0) return 0;

  // Calculate volatility (standard deviation)
  const calcStdDev = (arr: number[]): number => {
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const vol1 = calcStdDev(returns1);
  const vol2 = calcStdDev(returns2);
  const combinedVol = calcStdDev([...returns1, ...returns2]);

  // Diversification benefit = how much volatility is reduced
  const avgVol = (vol1 + vol2) / 2;
  if (avgVol === 0) return 0;

  return Math.max(0, ((avgVol - combinedVol) / avgVol) * 100);
}

/**
 * Generate correlation matrix for all templates
 */
export function generateCorrelationMatrix(): CorrelationMatrix {
  const templateNames = ALERT_TEMPLATES.map((t) => t.name);
  const n = templateNames.length;
  const correlations: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0));

  // Calculate correlations
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        correlations[i][j] = 1; // Perfect correlation with self
      } else if (i < j) {
        const returns1 = getTemplateReturns(templateNames[i]);
        const returns2 = getTemplateReturns(templateNames[j]);

        // Align arrays to same length for correlation calculation
        const minLen = Math.min(returns1.length, returns2.length);
        const aligned1 = returns1.slice(0, minLen);
        const aligned2 = returns2.slice(0, minLen);

        const correlation = calculatePearsonCorrelation(aligned1, aligned2);
        correlations[i][j] = correlation;
        correlations[j][i] = correlation; // Symmetric matrix
      }
    }
  }

  const descriptions: { [key: string]: string } = {};
  templateNames.forEach((name) => {
    const template = getTemplateByName(name);
    if (template) {
      descriptions[name] = template.description;
    }
  });

  return {
    templates: templateNames,
    correlations,
    descriptions
  };
}

/**
 * Calculate pairwise correlations with recommendations
 */
export function calculateTemplateCorrelations(): TemplateCorrelation[] {
  const templateNames = Object.keys(ALERT_TEMPLATES);
  const correlations: TemplateCorrelation[] = [];

  for (let i = 0; i < templateNames.length; i++) {
    for (let j = i + 1; j < templateNames.length; j++) {
      const template1 = templateNames[i];
      const template2 = templateNames[j];

      const returns1 = getTemplateReturns(template1);
      const returns2 = getTemplateReturns(template2);

      const minLen = Math.min(returns1.length, returns2.length);
      const aligned1 = returns1.slice(0, minLen);
      const aligned2 = returns2.slice(0, minLen);

      const correlation = calculatePearsonCorrelation(aligned1, aligned2);
      const metrics = calculateCombinedMetrics(template1, template2);
      const diversificationBenefit = calculateDiversificationBenefit(aligned1, aligned2);

      // Determine recommendation
      let recommendation: "excellent" | "good" | "neutral" | "avoid" = "neutral";
      if (correlation < -0.3 && diversificationBenefit > 20) {
        recommendation = "excellent"; // Negative correlation = good diversification
      } else if (correlation < 0.2 && diversificationBenefit > 10) {
        recommendation = "good";
      } else if (correlation > 0.7) {
        recommendation = "avoid"; // Too similar, redundant
      }

      correlations.push({
        template1,
        template2,
        correlation,
        combinedWinRate: metrics.combinedWinRate,
        combinedAvgReturn: metrics.combinedAvgReturn,
        diversificationBenefit,
        recommendation
      });
    }
  }

  // Sort by diversification benefit (best first)
  return correlations.sort((a, b) => b.diversificationBenefit - a.diversificationBenefit);
}

/**
 * Get top portfolio recommendations
 */
export function getPortfolioRecommendations(portfolioSize: number = 3): PortfolioRecommendation[] {
  const templateNames = ALERT_TEMPLATES.map((t) => t.name);
  const recommendations: PortfolioRecommendation[] = [];

  // Generate combinations
  function generateCombinations(arr: string[], size: number): string[][] {
    if (size === 1) return arr.map((item) => [item]);
    const smaller = generateCombinations(arr, size - 1);
    const result: string[][] = [];

    for (let i = 0; i < arr.length; i++) {
      for (const combo of smaller) {
        const firstCombo = combo[0];
        if (firstCombo && firstCombo > arr[i]) {
          result.push([arr[i], ...combo]);
        }
      }
    }
    return result;
  }

  const combinations = generateCombinations(templateNames, Math.min(portfolioSize, templateNames.length));

  for (const combo of combinations) {
    const allTrades = combo.flatMap((template) =>
      getTemplateTradesByName(template).filter((t) => t.status === "closed")
    );

    const allReturns = allTrades
      .map((trade) => calculateTradeReturn(trade))
      .filter((ret): ret is number => ret !== null);

    if (allReturns.length === 0) continue;

    const winRate = (allReturns.filter((r) => r > 0).length / allReturns.length) * 100;
    const avgReturn = allReturns.reduce((a, b) => a + b, 0) / allReturns.length;

    // Calculate average correlation between templates
    const correlationPairs = calculateTemplateCorrelations().filter(
      (c) => combo.includes(c.template1) && combo.includes(c.template2)
    );

    const avgCorrelation =
      correlationPairs.length > 0
        ? correlationPairs.reduce((a: number, b) => a + b.correlation, 0) / correlationPairs.length
        : 0;

    const diversificationScore = Math.max(0, 100 - (avgCorrelation + 1) * 50); // Convert correlation to 0-100 score
    const riskReduction = correlationPairs.length > 0 ? correlationPairs.reduce((a: number, b) => a + b.diversificationBenefit, 0) / correlationPairs.length : 0;

    recommendations.push({
      templates: combo,
      expectedWinRate: winRate,
      expectedAvgReturn: avgReturn,
      diversificationScore,
      riskReduction,
      rationale:
        avgCorrelation < 0 ? "Strategies move in opposite directions - excellent diversification" :
        avgCorrelation < 0.3 ? "Low correlation - good diversification benefits" :
        avgCorrelation < 0.6 ? "Moderate correlation - some diversification benefits" :
        "High correlation - limited diversification benefits"
    });
  }

  // Sort by diversification score and win rate
  return recommendations.sort((a, b) => {
    const scoreA = a.diversificationScore * 0.6 + a.expectedWinRate * 0.4;
    const scoreB = b.diversificationScore * 0.6 + b.expectedWinRate * 0.4;
    return scoreB - scoreA;
  });
}

/**
 * Get correlation interpretation
 */
export function getCorrelationInterpretation(correlation: number): string {
  if (correlation < -0.5) return "Strong negative - excellent diversification";
  if (correlation < -0.2) return "Moderate negative - good diversification";
  if (correlation < 0.2) return "Very weak - independent strategies";
  if (correlation < 0.5) return "Weak positive - some overlap";
  if (correlation < 0.8) return "Moderate positive - significant overlap";
  return "Strong positive - very similar strategies";
}
