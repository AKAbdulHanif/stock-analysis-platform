import { getDb } from "../db";
import { sentimentHistory, watchlistStocks } from "../../drizzle/schema";
import { getStockNews } from "./newsService";
import { analyzeArticleSentiment } from "./sentimentService";
import { sql } from "drizzle-orm";

/**
 * Collect sentiment snapshot for a single stock
 */
export async function collectSentimentSnapshot(ticker: string): Promise<void> {
  try {
    console.log(`Collecting sentiment snapshot for ${ticker}...`);

    // Fetch recent news for the stock
    const news = await getStockNews(ticker);

    if (!news || news.length === 0) {
      console.log(`No news found for ${ticker}, skipping sentiment snapshot`);
      return;
    }

    // Analyze sentiment from news articles
    const sentimentResults = news.map((article) => 
      analyzeArticleSentiment(article.title, article.summary || "")
    );

    // Calculate average sentiment score
    const avgScore =
      sentimentResults.reduce((sum, result) => sum + result.score, 0) / sentimentResults.length;

    // Calculate average confidence
    const avgConfidence =
      sentimentResults.reduce((sum, result) => sum + result.confidence, 0) / sentimentResults.length;

    // Determine overall sentiment type
    let sentimentType: 'positive' | 'negative' | 'neutral';
    if (avgScore > 0.15) {
      sentimentType = 'positive';
    } else if (avgScore < -0.15) {
      sentimentType = 'negative';
    } else {
      sentimentType = 'neutral';
    }

    // Store sentiment snapshot
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    await db.insert(sentimentHistory).values({
      ticker,
      date: new Date(),
      sentimentScore: avgScore.toString(),
      sentimentType,
      confidence: avgConfidence.toString(),
      articleCount: news.length,
    });

    console.log(
      `Sentiment snapshot saved for ${ticker}: ${avgScore.toFixed(4)} score (${sentimentType}, ${news.length} articles, ${(avgConfidence * 100).toFixed(1)}% confidence)`
    );
  } catch (error) {
    console.error(`Error collecting sentiment snapshot for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Collect sentiment snapshots for all tracked stocks
 */
export async function collectAllSentimentSnapshots(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  try {
    console.log("Starting sentiment snapshot collection for all tracked stocks...");

    // Get all unique tickers from watchlist_stocks
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const trackedStocks = await db
      .select({ ticker: watchlistStocks.ticker })
      .from(watchlistStocks)
      .groupBy(watchlistStocks.ticker);

    const tickers = trackedStocks.map((stock) => stock.ticker);
    console.log(`Found ${tickers.length} unique stocks to track:`, tickers);

    let success = 0;
    let failed = 0;

    // Collect sentiment for each ticker
    for (const ticker of tickers) {
      try {
        await collectSentimentSnapshot(ticker);
        success++;

        // Add delay to avoid rate limiting (1 second between requests)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Failed to collect sentiment for ${ticker}:`, error);
        failed++;
      }
    }

    const result = {
      success,
      failed,
      total: tickers.length,
    };

    console.log(
      `Sentiment snapshot collection complete: ${success}/${result.total} successful, ${failed} failed`
    );

    return result;
  } catch (error) {
    console.error("Error in collectAllSentimentSnapshots:", error);
    throw error;
  }
}

/**
 * Get the last snapshot time for a ticker
 */
export async function getLastSnapshotTime(ticker: string): Promise<Date | null> {
  try {
    const db = await getDb();
    if (!db) {
      return null;
    }

    const result = await db
      .select({ recordedAt: sentimentHistory.recordedAt })
      .from(sentimentHistory)
      .where(sql`${sentimentHistory.ticker} = ${ticker}`)
      .orderBy(sql`${sentimentHistory.recordedAt} DESC`)
      .limit(1);

    return result.length > 0 ? result[0].recordedAt : null;
  } catch (error) {
    console.error(`Error getting last snapshot time for ${ticker}:`, error);
    return null;
  }
}

/**
 * Clean old sentiment snapshots (keep last 90 days)
 */
export async function cleanOldSnapshots(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) {
      return 0;
    }

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const result = await db
      .delete(sentimentHistory)
      .where(sql`${sentimentHistory.recordedAt} < ${ninetyDaysAgo}`);

    console.log(`Cleaned ${result.rowsAffected || 0} old sentiment snapshots`);
    return result.rowsAffected || 0;
  } catch (error) {
    console.error("Error cleaning old snapshots:", error);
    return 0;
  }
}
