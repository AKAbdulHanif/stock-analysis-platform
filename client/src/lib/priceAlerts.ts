export interface PriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  alertType: "above" | "below"; // Alert when price goes above or below target
  createdAt: string;
  triggeredAt?: string;
  isActive: boolean;
  notes?: string;
}

export interface AlertHistory {
  id: string;
  alertId: string;
  ticker: string;
  targetPrice: number;
  currentPrice: number;
  triggeredAt: string;
  message: string;
}

const ALERTS_STORAGE_KEY = "investment_outlook_price_alerts";
const ALERT_HISTORY_STORAGE_KEY = "investment_outlook_alert_history";

/**
 * Get all active price alerts
 */
export function getAllAlerts(): PriceAlert[] {
  try {
    const data = localStorage.getItem(ALERTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading alerts:", error);
    return [];
  }
}

/**
 * Get alerts for a specific stock
 */
export function getStockAlerts(ticker: string): PriceAlert[] {
  return getAllAlerts().filter((alert) => alert.ticker === ticker && alert.isActive);
}

/**
 * Create a new price alert
 */
export function createPriceAlert(
  ticker: string,
  targetPrice: number,
  alertType: "above" | "below" = "above",
  notes?: string
): PriceAlert {
  const alerts = getAllAlerts();
  const newAlert: PriceAlert = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ticker,
    targetPrice,
    alertType,
    createdAt: new Date().toISOString(),
    isActive: true,
    notes
  };

  alerts.push(newAlert);
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));

  return newAlert;
}

/**
 * Update a price alert
 */
export function updatePriceAlert(
  id: string,
  updates: Partial<Omit<PriceAlert, "id" | "createdAt">>
): PriceAlert | null {
  const alerts = getAllAlerts();
  const index = alerts.findIndex((a) => a.id === id);

  if (index === -1) return null;

  const updated: PriceAlert = {
    ...alerts[index],
    ...updates
  };

  alerts[index] = updated;
  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));

  return updated;
}

/**
 * Delete a price alert
 */
export function deletePriceAlert(id: string): boolean {
  const alerts = getAllAlerts();
  const filtered = alerts.filter((a) => a.id !== id);

  if (filtered.length === alerts.length) return false;

  localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Deactivate a price alert
 */
export function deactivatePriceAlert(id: string): PriceAlert | null {
  return updatePriceAlert(id, { isActive: false });
}

/**
 * Check if a price has triggered any alerts
 */
export function checkPriceAlert(ticker: string, currentPrice: number): PriceAlert[] {
  const alerts = getStockAlerts(ticker);
  const triggeredAlerts: PriceAlert[] = [];

  alerts.forEach((alert) => {
    let isTriggered = false;

    if (alert.alertType === "above" && currentPrice >= alert.targetPrice) {
      isTriggered = true;
    } else if (alert.alertType === "below" && currentPrice <= alert.targetPrice) {
      isTriggered = true;
    }

    if (isTriggered) {
      triggeredAlerts.push(alert);
      // Mark alert as triggered
      updatePriceAlert(alert.id, {
        triggeredAt: new Date().toISOString(),
        isActive: false // Deactivate after triggering
      });
    }
  });

  return triggeredAlerts;
}

/**
 * Get alert history
 */
export function getAlertHistory(): AlertHistory[] {
  try {
    const data = localStorage.getItem(ALERT_HISTORY_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading alert history:", error);
    return [];
  }
}

/**
 * Add to alert history
 */
export function addToAlertHistory(
  alertId: string,
  ticker: string,
  targetPrice: number,
  currentPrice: number,
  message: string
): AlertHistory {
  const history = getAlertHistory();
  const entry: AlertHistory = {
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    alertId,
    ticker,
    targetPrice,
    currentPrice,
    triggeredAt: new Date().toISOString(),
    message
  };

  history.push(entry);
  // Keep only last 100 entries
  if (history.length > 100) {
    history.shift();
  }

  localStorage.setItem(ALERT_HISTORY_STORAGE_KEY, JSON.stringify(history));
  return entry;
}

/**
 * Clear alert history
 */
export function clearAlertHistory(): void {
  localStorage.setItem(ALERT_HISTORY_STORAGE_KEY, JSON.stringify([]));
}

/**
 * Get alert statistics
 */
export function getAlertStats(): {
  totalAlerts: number;
  activeAlerts: number;
  triggeredAlerts: number;
  historyCount: number;
} {
  const alerts = getAllAlerts();
  const history = getAlertHistory();

  return {
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter((a) => a.isActive).length,
    triggeredAlerts: alerts.filter((a) => a.triggeredAt).length,
    historyCount: history.length
  };
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Send browser notification
 */
export function sendNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options
    });
  }
}

/**
 * Simulate price check and trigger alerts (for demo purposes)
 * In production, this would be called by a backend service or WebSocket
 */
export function simulatePriceCheck(ticker: string, currentPrice: number): AlertHistory[] {
  const triggeredAlerts = checkPriceAlert(ticker, currentPrice);
  const historyEntries: AlertHistory[] = [];

  triggeredAlerts.forEach((alert) => {
    const message = `${ticker} reached $${currentPrice.toFixed(2)} (target: $${alert.targetPrice.toFixed(2)})`;
    const entry = addToAlertHistory(alert.id, ticker, alert.targetPrice, currentPrice, message);
    historyEntries.push(entry);

    // Send browser notification
    sendNotification(`Price Alert: ${ticker}`, {
      body: message,
      tag: `alert_${ticker}`,
      requireInteraction: true
    });
  });

  return historyEntries;
}
