import { createPriceAlert, type PriceAlert } from "./priceAlerts";

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  category: "support-resistance" | "profit-taking" | "entry-points" | "risk-management" | "custom";
  alerts: Array<{
    name: string;
    offsetType: "percentage" | "absolute";
    offset: number;
    direction: "above" | "below";
    notes?: string;
  }>;
  icon?: string;
}

/**
 * Predefined alert templates for common trading strategies
 */
export const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: "support-resistance",
    name: "Support & Resistance",
    description: "Monitor key support and resistance levels for breakouts",
    category: "support-resistance",
    alerts: [
      {
        name: "Support Alert",
        offsetType: "percentage",
        offset: -5,
        direction: "below",
        notes: "Alert when price breaks below 5% support level"
      },
      {
        name: "Resistance Alert",
        offsetType: "percentage",
        offset: 5,
        direction: "above",
        notes: "Alert when price breaks above 5% resistance level"
      }
    ]
  },
  {
    id: "profit-taking",
    name: "Profit Taking Levels",
    description: "Set alerts at key profit-taking milestones",
    category: "profit-taking",
    alerts: [
      {
        name: "First Target (25%)",
        offsetType: "percentage",
        offset: 25,
        direction: "above",
        notes: "First profit-taking target at 25% upside"
      },
      {
        name: "Second Target (50%)",
        offsetType: "percentage",
        offset: 50,
        direction: "above",
        notes: "Second profit-taking target at 50% upside"
      },
      {
        name: "Final Target (100%)",
        offsetType: "percentage",
        offset: 100,
        direction: "above",
        notes: "Final profit-taking target at 100% upside (double)"
      }
    ]
  },
  {
    id: "entry-points",
    name: "Entry Point Strategy",
    description: "Identify optimal entry points with multiple levels",
    category: "entry-points",
    alerts: [
      {
        name: "Pullback Entry",
        offsetType: "percentage",
        offset: -10,
        direction: "below",
        notes: "Alert for 10% pullback entry opportunity"
      },
      {
        name: "Breakout Entry",
        offsetType: "percentage",
        offset: 5,
        direction: "above",
        notes: "Alert for breakout above 5% resistance"
      },
      {
        name: "DCA Level 1",
        offsetType: "percentage",
        offset: -15,
        direction: "below",
        notes: "Dollar-cost averaging entry level 1 (15% down)"
      },
      {
        name: "DCA Level 2",
        offsetType: "percentage",
        offset: -25,
        direction: "below",
        notes: "Dollar-cost averaging entry level 2 (25% down)"
      }
    ]
  },
  {
    id: "risk-management",
    name: "Risk Management",
    description: "Protect capital with stop-loss and trailing alerts",
    category: "risk-management",
    alerts: [
      {
        name: "Stop Loss (10%)",
        offsetType: "percentage",
        offset: -10,
        direction: "below",
        notes: "Stop loss at 10% below current price"
      },
      {
        name: "Tight Stop Loss (5%)",
        offsetType: "percentage",
        offset: -5,
        direction: "below",
        notes: "Tight stop loss at 5% below current price"
      },
      {
        name: "Breakeven Alert",
        offsetType: "percentage",
        offset: 0,
        direction: "above",
        notes: "Alert when approaching entry price"
      }
    ]
  },
  {
    id: "sector-rotation",
    name: "Sector Rotation Strategy",
    description: "Monitor sector rotation opportunities",
    category: "custom",
    alerts: [
      {
        name: "Sector Outperformance",
        offsetType: "percentage",
        offset: 15,
        direction: "above",
        notes: "Alert for 15% sector outperformance"
      },
      {
        name: "Sector Underperformance",
        offsetType: "percentage",
        offset: -15,
        direction: "below",
        notes: "Alert for 15% sector underperformance"
      }
    ]
  },
  {
    id: "mean-reversion",
    name: "Mean Reversion",
    description: "Trade mean reversion patterns",
    category: "custom",
    alerts: [
      {
        name: "Oversold Level",
        offsetType: "percentage",
        offset: -20,
        direction: "below",
        notes: "Alert when stock is 20% below average"
      },
      {
        name: "Overbought Level",
        offsetType: "percentage",
        offset: 20,
        direction: "above",
        notes: "Alert when stock is 20% above average"
      },
      {
        name: "Mean Reversion Target",
        offsetType: "percentage",
        offset: 10,
        direction: "above",
        notes: "Alert for 10% mean reversion move"
      }
    ]
  },
  {
    id: "momentum",
    name: "Momentum Trading",
    description: "Capture momentum moves with tiered alerts",
    category: "custom",
    alerts: [
      {
        name: "Early Momentum",
        offsetType: "percentage",
        offset: 10,
        direction: "above",
        notes: "Alert for early momentum move (10%)"
      },
      {
        name: "Strong Momentum",
        offsetType: "percentage",
        offset: 25,
        direction: "above",
        notes: "Alert for strong momentum move (25%)"
      },
      {
        name: "Extreme Momentum",
        offsetType: "percentage",
        offset: 50,
        direction: "above",
        notes: "Alert for extreme momentum move (50%)"
      }
    ]
  },
  {
    id: "dividend-capture",
    name: "Dividend Capture",
    description: "Alerts for dividend-focused strategies",
    category: "custom",
    alerts: [
      {
        name: "Ex-Dividend Dip",
        offsetType: "percentage",
        offset: -3,
        direction: "below",
        notes: "Alert for typical ex-dividend price dip"
      },
      {
        name: "Recovery Target",
        offsetType: "percentage",
        offset: 2,
        direction: "above",
        notes: "Alert when price recovers post-dividend"
      }
    ]
  }
];

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AlertTemplate | undefined {
  return ALERT_TEMPLATES.find((t) => t.id === templateId);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: AlertTemplate["category"]
): AlertTemplate[] {
  return ALERT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Calculate alert price from current price and template offset
 */
export function calculateAlertPrice(
  currentPrice: number,
  offsetType: "percentage" | "absolute",
  offset: number
): number {
  if (offsetType === "percentage") {
    return currentPrice * (1 + offset / 100);
  } else {
    return currentPrice + offset;
  }
}

/**
 * Apply template to a stock - creates all alerts from the template
 */
export function applyTemplateToStock(
  ticker: string,
  currentPrice: number,
  templateId: string
): PriceAlert[] {
  const template = getTemplate(templateId);
  if (!template) return [];

  const createdAlerts: PriceAlert[] = [];

  template.alerts.forEach((alertConfig) => {
    const targetPrice = calculateAlertPrice(
      currentPrice,
      alertConfig.offsetType,
      alertConfig.offset
    );

    const alert = createPriceAlert(
      ticker,
      targetPrice,
      alertConfig.direction,
      `[${template.name}] ${alertConfig.name}: ${alertConfig.notes || ""}`
    );

    createdAlerts.push(alert);
  });

  return createdAlerts;
}

/**
 * Get all available categories
 */
export function getCategories(): AlertTemplate["category"][] {
  const categories = new Set<AlertTemplate["category"]>();
  ALERT_TEMPLATES.forEach((t) => categories.add(t.category));
  return Array.from(categories);
}

/**
 * Format alert template description with price calculations
 */
export function formatTemplatePreview(
  template: AlertTemplate,
  currentPrice: number
): string {
  const alerts = template.alerts
    .map((alert) => {
      const targetPrice = calculateAlertPrice(
        currentPrice,
        alert.offsetType,
        alert.offset
      );
      const change = ((targetPrice - currentPrice) / currentPrice * 100).toFixed(1);
      return `• ${alert.name}: $${targetPrice.toFixed(2)} (${change}%)`;
    })
    .join("\n");

  return alerts;
}

/**
 * Get recommended templates for a stock based on its characteristics
 */
export function getRecommendedTemplates(
  pe: number,
  upside: number,
  sector: string
): AlertTemplate[] {
  const recommended: AlertTemplate[] = [];

  // High upside stocks benefit from profit-taking
  if (upside > 30) {
    recommended.push(getTemplate("profit-taking")!);
  }

  // All stocks benefit from risk management
  recommended.push(getTemplate("risk-management")!);

  // Growth stocks benefit from momentum
  if (upside > 20 && pe > 20) {
    recommended.push(getTemplate("momentum")!);
  }

  // Value stocks benefit from mean reversion
  if (pe < 15 && upside < 20) {
    recommended.push(getTemplate("mean-reversion")!);
  }

  // Healthcare stocks often pay dividends
  if (sector === "Healthcare") {
    recommended.push(getTemplate("dividend-capture")!);
  }

  // Financials benefit from sector rotation
  if (sector === "Financials") {
    recommended.push(getTemplate("sector-rotation")!);
  }

  return recommended;
}
