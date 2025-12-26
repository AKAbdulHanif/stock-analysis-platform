/**
 * Sentiment Scoring Service
 * 
 * Aggregates news sentiment data for stocks and calculates sentiment scores
 * to be used in portfolio recommendations and rebalancing decisions.
 */

import { getStockNews, NewsArticle } from './newsService';

export interface SentimentScore {
  ticker: string;
  currentScore: number; // -1 to 1 scale
  weekAverage: number; // 7-day average
  monthAverage: number; // 30-day average
  momentum: 'improving' | 'declining' | 'stable';
  confidence: number; // 0 to 1
  articleCount: number;
  lastUpdated: Date;
}

export interface SentimentTrend {
  date: Date;
  score: number;
  articleCount: number;
}

// Cache for sentiment scores (5 minute TTL)
const sentimentCache = new Map<string, { score: SentimentScore; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Calculate sentiment score for a stock based on recent news
 */
export async function calculateSentimentScore(ticker: string): Promise<SentimentScore> {
  // Check cache
  const cached = sentimentCache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.score;
  }

  try {
    // Fetch recent news (last 30 days)
    const articles = await getStockNews(ticker);
    
    if (articles.length === 0) {
      // No news available - return neutral score
      const neutralScore: SentimentScore = {
        ticker,
        currentScore: 0,
        weekAverage: 0,
        monthAverage: 0,
        momentum: 'stable',
        confidence: 0,
        articleCount: 0,
        lastUpdated: new Date(),
      };
      return neutralScore;
    }

    // Calculate current sentiment (last 24 hours)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentArticles = articles.filter((a: NewsArticle) => new Date(a.publishedAt) >= oneDayAgo);
    const currentScore = calculateAverageSentiment(recentArticles);

    // Calculate 7-day average
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekArticles = articles.filter((a: NewsArticle) => new Date(a.publishedAt) >= sevenDaysAgo);
    const weekAverage = calculateAverageSentiment(weekArticles);

    // Calculate 30-day average
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const monthArticles = articles.filter((a: NewsArticle) => new Date(a.publishedAt) >= thirtyDaysAgo);
    const monthAverage = calculateAverageSentiment(monthArticles);

    // Determine momentum
    const momentum = determineMomentum(currentScore, weekAverage, monthAverage);

    // Calculate confidence based on article count and consistency
    const confidence = calculateConfidence(articles);

    const score: SentimentScore = {
      ticker,
      currentScore,
      weekAverage,
      monthAverage,
      momentum,
      confidence,
      articleCount: articles.length,
      lastUpdated: now,
    };

    // Cache the result
    sentimentCache.set(ticker, { score, timestamp: Date.now() });

    return score;
  } catch (error) {
    console.error(`Error calculating sentiment score for ${ticker}:`, error);
    // Return neutral score on error
    return {
      ticker,
      currentScore: 0,
      weekAverage: 0,
      monthAverage: 0,
      momentum: 'stable',
      confidence: 0,
      articleCount: 0,
      lastUpdated: new Date(),
    };
  }
}

/**
 * Calculate average sentiment from articles
 */
function calculateAverageSentiment(articles: any[]): number {
  if (articles.length === 0) return 0;

  const sentimentSum = articles.reduce((sum, article) => {
    if (!article.sentiment) return sum;
    
    // Convert sentiment type to numeric score
    let score = 0;
    if (article.sentiment.type === 'positive') {
      score = article.sentiment.confidence;
    } else if (article.sentiment.type === 'negative') {
      score = -article.sentiment.confidence;
    }
    
    return sum + score;
  }, 0);

  return sentimentSum / articles.length;
}

/**
 * Determine sentiment momentum
 */
function determineMomentum(
  current: number,
  week: number,
  month: number
): 'improving' | 'declining' | 'stable' {
  const threshold = 0.1; // 10% change threshold

  // Check if sentiment is improving
  if (current > week + threshold && week > month) {
    return 'improving';
  }

  // Check if sentiment is declining
  if (current < week - threshold && week < month) {
    return 'declining';
  }

  return 'stable';
}

/**
 * Calculate confidence score based on article count and consistency
 */
function calculateConfidence(articles: any[]): number {
  if (articles.length === 0) return 0;

  // Base confidence on article count (more articles = higher confidence)
  const countScore = Math.min(articles.length / 20, 1); // Max at 20 articles

  // Calculate sentiment consistency (lower variance = higher confidence)
  const sentiments = articles
    .filter(a => a.sentiment)
    .map(a => {
      if (a.sentiment.type === 'positive') return a.sentiment.confidence;
      if (a.sentiment.type === 'negative') return -a.sentiment.confidence;
      return 0;
    });

  if (sentiments.length === 0) return countScore * 0.5;

  const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  const variance = sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
  const consistencyScore = 1 - Math.min(variance, 1);

  // Combine count and consistency
  return (countScore * 0.6 + consistencyScore * 0.4);
}

/**
 * Calculate sentiment scores for multiple stocks
 */
export async function calculateBatchSentimentScores(tickers: string[]): Promise<Map<string, SentimentScore>> {
  const scores = new Map<string, SentimentScore>();

  // Calculate scores in parallel
  const promises = tickers.map(async (ticker) => {
    const score = await calculateSentimentScore(ticker);
    scores.set(ticker, score);
  });

  await Promise.all(promises);

  return scores;
}

/**
 * Get sentiment-based stock ranking
 * Returns stocks sorted by sentiment score (best to worst)
 */
export async function getSentimentRanking(tickers: string[]): Promise<Array<{ ticker: string; score: SentimentScore }>> {
  const scores = await calculateBatchSentimentScores(tickers);

  const ranking = Array.from(scores.entries())
    .map(([ticker, score]) => ({ ticker, score }))
    .sort((a, b) => {
      // Primary sort: current sentiment score
      if (b.score.currentScore !== a.score.currentScore) {
        return b.score.currentScore - a.score.currentScore;
      }
      // Secondary sort: momentum (improving > stable > declining)
      const momentumOrder = { improving: 2, stable: 1, declining: 0 };
      if (momentumOrder[b.score.momentum] !== momentumOrder[a.score.momentum]) {
        return momentumOrder[b.score.momentum] - momentumOrder[a.score.momentum];
      }
      // Tertiary sort: confidence
      return b.score.confidence - a.score.confidence;
    });

  return ranking;
}

/**
 * Calculate sentiment weight for portfolio allocation
 * Returns a multiplier (0.5 to 1.5) to adjust stock weight based on sentiment
 */
export function calculateSentimentWeight(score: SentimentScore): number {
  // Base weight is 1.0 (no adjustment)
  let weight = 1.0;

  // Adjust based on current sentiment (-0.3 to +0.3)
  weight += score.currentScore * 0.3;

  // Adjust based on momentum
  if (score.momentum === 'improving') {
    weight += 0.1;
  } else if (score.momentum === 'declining') {
    weight -= 0.1;
  }

  // Apply confidence factor (reduce impact if low confidence)
  const confidenceAdjustment = (weight - 1.0) * score.confidence;
  weight = 1.0 + confidenceAdjustment;

  // Clamp to reasonable range (0.5 to 1.5)
  return Math.max(0.5, Math.min(1.5, weight));
}
