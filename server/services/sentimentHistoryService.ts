/**
 * Sentiment History Service
 * 
 * Tracks and retrieves historical sentiment data for stocks
 */

import { eq, and, gte, desc } from "drizzle-orm";
import { getDb } from "../db";
import {
  sentimentHistory,
  InsertSentimentHistory,
  SentimentHistory,
} from "../../drizzle/schema";
import { analyzeArticleSentiment, getSentimentStats } from "./sentimentService";
import { getStockNews } from "./newsService";

export class SentimentHistoryError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = "SentimentHistoryError";
  }
}

/**
 * Record sentiment score for a stock
 */
export async function recordSentiment(
  ticker: string,
  sentimentScore: number,
  confidence: number,
  articleCount: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new SentimentHistoryError("Database not available", 503);
  }

  try {
    await db.insert(sentimentHistory).values({
      ticker: ticker.toUpperCase(),
      sentimentScore,
      confidence,
      articleCount,
    });
  } catch (error) {
    console.error(`Error recording sentiment for ${ticker}:`, error);
    throw new SentimentHistoryError("Failed to record sentiment", 500);
  }
}

/**
 * Get sentiment history for a stock
 */
export async function getSentimentHistory(
  ticker: string,
  days: number = 30
): Promise<SentimentHistory[]> {
  const db = await getDb();
  if (!db) {
    throw new SentimentHistoryError("Database not available", 503);
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await db
      .select()
      .from(sentimentHistory)
      .where(
        and(
          eq(sentimentHistory.ticker, ticker.toUpperCase()),
          gte(sentimentHistory.recordedAt, cutoffDate)
        )
      )
      .orderBy(desc(sentimentHistory.recordedAt));

    return history;
  } catch (error) {
    console.error(`Error fetching sentiment history for ${ticker}:`, error);
    throw new SentimentHistoryError("Failed to fetch sentiment history", 500);
  }
}

/**
 * Get latest sentiment for a stock
 */
export async function getLatestSentiment(ticker: string): Promise<SentimentHistory | null> {
  const db = await getDb();
  if (!db) {
    throw new SentimentHistoryError("Database not available", 503);
  }

  try {
    const [latest] = await db
      .select()
      .from(sentimentHistory)
      .where(eq(sentimentHistory.ticker, ticker.toUpperCase()))
      .orderBy(desc(sentimentHistory.recordedAt))
      .limit(1);

    return latest || null;
  } catch (error) {
    console.error(`Error fetching latest sentiment for ${ticker}:`, error);
    throw new SentimentHistoryError("Failed to fetch latest sentiment", 500);
  }
}

/**
 * Update sentiment for multiple stocks
 * This should be called periodically (e.g., every hour) to build historical data
 */
export async function updateSentimentForStocks(tickers: string[]): Promise<void> {
  console.log(`Updating sentiment for ${tickers.length} stocks...`);

  for (const ticker of tickers) {
    try {
      // Get news articles for the stock
      const articles = await getStockNews(ticker);
      
      if (articles && articles.length > 0) {
        // Analyze sentiment for each article
        const sentiments = articles.map(article => 
          analyzeArticleSentiment(article.title, article.summary)
        );
        
        // Calculate average sentiment score
        const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;
        
        // Convert score from -1..1 to -100..100 percentage
        const sentimentScore = avgScore * 100;
        
        await recordSentiment(
          ticker,
          sentimentScore,
          avgConfidence,
          articles.length
        );
        console.log(`Recorded sentiment for ${ticker}: ${sentimentScore.toFixed(2)}%`);
      }
    } catch (error) {
      console.error(`Error updating sentiment for ${ticker}:`, error);
      // Continue with other stocks
    }
  }

  console.log("Sentiment update complete");
}

/**
 * Get sentiment trend analysis
 */
export async function getSentimentTrend(
  ticker: string,
  days: number = 30
): Promise<{
  ticker: string;
  currentScore: number;
  averageScore: number;
  trend: "improving" | "declining" | "stable";
  changePercent: number;
  dataPoints: number;
}> {
  const history = await getSentimentHistory(ticker, days);

  if (history.length === 0) {
    throw new SentimentHistoryError("No sentiment history available", 404);
  }

  const currentScore = history[0].sentimentScore;
  const averageScore = history.reduce((sum, h) => sum + h.sentimentScore, 0) / history.length;
  
  // Calculate trend based on first half vs second half
  const midpoint = Math.floor(history.length / 2);
  const recentAvg = history.slice(0, midpoint).reduce((sum, h) => sum + h.sentimentScore, 0) / midpoint;
  const olderAvg = history.slice(midpoint).reduce((sum, h) => sum + h.sentimentScore, 0) / (history.length - midpoint);
  
  const changePercent = ((recentAvg - olderAvg) / Math.abs(olderAvg || 1)) * 100;
  
  let trend: "improving" | "declining" | "stable" = "stable";
  if (changePercent > 10) trend = "improving";
  else if (changePercent < -10) trend = "declining";

  return {
    ticker,
    currentScore,
    averageScore,
    trend,
    changePercent,
    dataPoints: history.length,
  };
}
