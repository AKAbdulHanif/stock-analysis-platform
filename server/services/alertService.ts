/**
 * Alert Service
 * 
 * Monitors stock prices and sentiment, triggers alerts when conditions are met
 */

import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "../db";
import {
  userAlerts,
  alertNotifications,
  InsertUserAlert,
  InsertAlertNotification,
  UserAlert,
  AlertNotification,
} from "../../drizzle/schema";
import { getStockQuote } from "./yahooFinanceService";
import { getLatestSentiment } from "./sentimentHistoryService";

export class AlertError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "AlertError";
  }
}

/**
 * Get all alerts for a user
 */
export async function getUserAlerts(userId: number): Promise<UserAlert[]> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    const result = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.userId, userId));

    return result;
  } catch (error) {
    console.error("Error fetching user alerts:", error);
    throw new AlertError("Failed to fetch alerts", 500);
  }
}

/**
 * Create a new alert
 */
export async function createAlert(alert: InsertUserAlert): Promise<UserAlert> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    const [newAlert] = await db.insert(userAlerts).values(alert);
    
    const [created] = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.id, newAlert.insertId));

    return created;
  } catch (error) {
    console.error("Error creating alert:", error);
    throw new AlertError("Failed to create alert", 500);
  }
}

/**
 * Delete an alert
 */
export async function deleteAlert(alertId: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    await db
      .delete(userAlerts)
      .where(and(eq(userAlerts.id, alertId), eq(userAlerts.userId, userId)));
  } catch (error) {
    console.error("Error deleting alert:", error);
    throw new AlertError("Failed to delete alert", 500);
  }
}

/**
 * Update alert status
 */
export async function updateAlertStatus(
  alertId: number,
  userId: number,
  isActive: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    await db
      .update(userAlerts)
      .set({ isActive })
      .where(and(eq(userAlerts.id, alertId), eq(userAlerts.userId, userId)));
  } catch (error) {
    console.error("Error updating alert status:", error);
    throw new AlertError("Failed to update alert", 500);
  }
}

/**
 * Get alert notifications for a user
 */
export async function getUserNotifications(
  userId: number,
  limit: number = 50
): Promise<AlertNotification[]> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    const result = await db
      .select()
      .from(alertNotifications)
      .where(eq(alertNotifications.userId, userId))
      .limit(limit);

    return result;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw new AlertError("Failed to fetch notifications", 500);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new AlertError("Database not available", 503);
  }

  try {
    await db
      .update(alertNotifications)
      .set({ isRead: true })
      .where(
        and(
          eq(alertNotifications.id, notificationId),
          eq(alertNotifications.userId, userId)
        )
      );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new AlertError("Failed to update notification", 500);
  }
}

/**
 * Check alerts and trigger notifications
 * This should be called periodically (e.g., every 5 minutes)
 */
export async function checkAlerts(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("Database not available for alert checking");
    return;
  }

  try {
    // Get all active alerts
    const alerts = await db
      .select()
      .from(userAlerts)
      .where(eq(userAlerts.isActive, true));

    for (const alert of alerts) {
      try {
        let shouldTrigger = false;
        let message = "";

        if (alert.alertType === "price_above") {
          const quote = await getStockQuote(alert.ticker);
          if (quote && quote.price >= alert.targetValue) {
            shouldTrigger = true;
            message = `${alert.ticker} price ($${quote.price.toFixed(2)}) is above your target of $${alert.targetValue.toFixed(2)}`;
          }
        } else if (alert.alertType === "price_below") {
          const quote = await getStockQuote(alert.ticker);
          if (quote && quote.price <= alert.targetValue) {
            shouldTrigger = true;
            message = `${alert.ticker} price ($${quote.price.toFixed(2)}) is below your target of $${alert.targetValue.toFixed(2)}`;
          }
        } else if (alert.alertType === "sentiment_positive") {
          const sentiment = await getLatestSentiment(alert.ticker);
          if (sentiment && sentiment.sentimentScore >= alert.targetValue) {
            shouldTrigger = true;
            message = `${alert.ticker} sentiment (${sentiment.sentimentScore.toFixed(1)}%) is above your target of ${alert.targetValue.toFixed(1)}%`;
          }
        } else if (alert.alertType === "sentiment_negative") {
          const sentiment = await getLatestSentiment(alert.ticker);
          if (sentiment && sentiment.sentimentScore <= alert.targetValue) {
            shouldTrigger = true;
            message = `${alert.ticker} sentiment (${sentiment.sentimentScore.toFixed(1)}%) is below your target of ${alert.targetValue.toFixed(1)}%`;
          }
        }

        if (shouldTrigger) {
          // Create notification
          await db.insert(alertNotifications).values({
            userId: alert.userId,
            alertId: alert.id,
            message,
            isRead: false,
          });

          // Deactivate one-time alerts
          if (!alert.isRecurring) {
            await db
              .update(userAlerts)
              .set({ isActive: false })
              .where(eq(userAlerts.id, alert.id));
          }

          console.log(`Alert triggered for user ${alert.userId}: ${message}`);
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
        // Continue checking other alerts
      }
    }
  } catch (error) {
    console.error("Error in checkAlerts:", error);
  }
}
