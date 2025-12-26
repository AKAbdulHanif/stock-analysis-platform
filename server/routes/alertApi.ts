/**
 * Alert API Routes
 * 
 * Endpoints for managing price and sentiment alerts
 */

import express from "express";
import {
  getUserAlerts,
  createAlert,
  deleteAlert,
  updateAlertStatus,
  getUserNotifications,
  markNotificationRead,
  AlertError,
} from "../services/alertService";

const router = express.Router();

/**
 * Get all alerts for the current user
 */
router.get("/", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const alerts = await getUserAlerts(userId);
    res.json(alerts);
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in GET /api/alerts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Create a new alert
 */
router.post("/", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const { ticker, alertType, targetValue, isRecurring } = req.body;

    if (!ticker || !alertType || targetValue === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validAlertTypes = ["price_above", "price_below", "sentiment_positive", "sentiment_negative"];
    if (!validAlertTypes.includes(alertType)) {
      return res.status(400).json({ message: "Invalid alert type" });
    }

    const alert = await createAlert({
      userId,
      ticker: ticker.toUpperCase(),
      alertType,
      targetValue: parseFloat(targetValue),
      isRecurring: isRecurring || false,
      isActive: true,
    });

    res.status(201).json(alert);
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in POST /api/alerts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Update alert status (activate/deactivate)
 */
router.patch("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const alertId = parseInt(req.params.id);
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: "isActive field required" });
    }

    await updateAlertStatus(alertId, userId, isActive);
    res.json({ message: "Alert updated successfully" });
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in PATCH /api/alerts/:id:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Delete an alert
 */
router.delete("/:id", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const alertId = parseInt(req.params.id);
    await deleteAlert(alertId, userId);
    res.json({ message: "Alert deleted successfully" });
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in DELETE /api/alerts/:id:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Get notifications for the current user
 */
router.get("/notifications", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await getUserNotifications(userId, limit);
    res.json(notifications);
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in GET /api/alerts/notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

/**
 * Mark notification as read
 */
router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const userId = parseInt(req.headers["x-user-id"] as string);
    if (!userId) {
      return res.status(401).json({ message: "User ID required" });
    }

    const notificationId = parseInt(req.params.id);
    await markNotificationRead(notificationId, userId);
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    if (error instanceof AlertError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error in PATCH /api/alerts/notifications/:id/read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
});

export default router;
