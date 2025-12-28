import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Watchlists - User-created collections of stocks to monitor
 */
export const watchlists = mysqlTable("watchlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Watchlist = typeof watchlists.$inferSelect;
export type InsertWatchlist = typeof watchlists.$inferInsert;

/**
 * Watchlist Stocks - Stocks in a watchlist
 */
export const watchlistStocks = mysqlTable("watchlist_stocks", {
  id: int("id").autoincrement().primaryKey(),
  watchlistId: int("watchlistId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  addedAt: timestamp("addedAt").defaultNow().notNull(),
});

export type WatchlistStock = typeof watchlistStocks.$inferSelect;
export type InsertWatchlistStock = typeof watchlistStocks.$inferInsert;

/**
 * User Alerts - Price and sentiment change alerts
 */
export const userAlerts = mysqlTable("user_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  alertType: mysqlEnum("alertType", ["price_above", "price_below", "sentiment_positive", "sentiment_negative", "sentiment_change"]).notNull(),
  targetValue: varchar("targetValue", { length: 50 }).notNull(), // For price alerts: "150.00", for sentiment: "0.05" (5% change)
  isRecurring: int("isRecurring").default(0).notNull(), // 0 = one-time, 1 = recurring
  isActive: int("isActive").default(1).notNull(), // 1 = active, 0 = inactive
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAlert = typeof userAlerts.$inferSelect;
export type InsertUserAlert = typeof userAlerts.$inferInsert;

/**
 * Alert Notifications - Triggered alerts
 */
export const alertNotifications = mysqlTable("alert_notifications", {
  id: int("id").autoincrement().primaryKey(),
  alertId: int("alertId").notNull(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 = unread, 1 = read
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
});

export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = typeof alertNotifications.$inferInsert;

/**
 * Sentiment History - Daily sentiment snapshots for trend analysis
 */
export const sentimentHistory = mysqlTable("sentiment_history", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  date: timestamp("date").notNull(),
  sentimentScore: varchar("sentimentScore", { length: 20 }).notNull(), // Store as string to preserve precision
  sentimentType: mysqlEnum("sentimentType", ["positive", "negative", "neutral"]).notNull(),
  confidence: varchar("confidence", { length: 20 }).notNull(),
  articleCount: int("articleCount").notNull(),
  avgScore7d: varchar("avgScore7d", { length: 20 }), // 7-day moving average
  avgScore30d: varchar("avgScore30d", { length: 20 }), // 30-day moving average
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SentimentHistory = typeof sentimentHistory.$inferSelect;
export type InsertSentimentHistory = typeof sentimentHistory.$inferInsert;

/**
 * Portfolio Snapshots - Daily portfolio value snapshots for performance tracking
 */
export const portfolioSnapshots = mysqlTable("portfolio_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  date: timestamp("date").notNull(),
  totalValue: varchar("totalValue", { length: 20 }).notNull(), // Total portfolio value
  totalReturn: varchar("totalReturn", { length: 20 }), // Total return amount
  totalReturnPercent: varchar("totalReturnPercent", { length: 20 }), // Total return percentage
  positionsJson: text("positionsJson"), // JSON snapshot of positions
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type InsertPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;

/**
 * Benchmark Data - S&P 500 historical data for comparison
 */
export const benchmarkData = mysqlTable("benchmark_data", {
  id: int("id").autoincrement().primaryKey(),
  ticker: varchar("ticker", { length: 10 }).notNull(), // ^GSPC for S&P 500
  date: timestamp("date").notNull(),
  closePrice: varchar("closePrice", { length: 20 }).notNull(),
  dailyReturn: varchar("dailyReturn", { length: 20 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BenchmarkData = typeof benchmarkData.$inferSelect;
export type InsertBenchmarkData = typeof benchmarkData.$inferInsert;

/**
 * Portfolios - User-created investment portfolios
 */
export const portfolios = mysqlTable("portfolios", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = typeof portfolios.$inferInsert;

/**
 * Portfolio Positions - Stocks in a portfolio with quantity and cost basis
 */
export const portfolioPositions = mysqlTable("portfolio_positions", {
  id: int("id").autoincrement().primaryKey(),
  portfolioId: int("portfolioId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  shares: varchar("shares", { length: 20 }).notNull(), // Store as string to preserve precision
  avgCost: varchar("avgCost", { length: 20 }).notNull(), // Average cost per share
  addedAt: timestamp("addedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioPosition = typeof portfolioPositions.$inferSelect;
export type InsertPortfolioPosition = typeof portfolioPositions.$inferInsert;