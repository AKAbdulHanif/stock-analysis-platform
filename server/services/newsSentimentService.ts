/**
 * News Sentiment Analysis Service
 * Analyze sentiment of news articles using natural language processing
 */

import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export interface SentimentScore {
  score: number; // -5 to +5 (negative to positive)
  comparative: number; // normalized score
  label: 'bullish' | 'bearish' | 'neutral';
  confidence: number; // 0-100
  positive: string[];
  negative: string[];
}

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentScore {
  const result = sentiment.analyze(text);
  
  // Normalize score to 0-100 scale
  // Sentiment library returns scores typically between -10 and +10
  const normalizedScore = Math.max(-5, Math.min(5, result.score));
  const confidence = Math.min(100, Math.abs(normalizedScore) * 20);
  
  // Determine label
  let label: 'bullish' | 'bearish' | 'neutral';
  if (normalizedScore > 1) {
    label = 'bullish';
  } else if (normalizedScore < -1) {
    label = 'bearish';
  } else {
    label = 'neutral';
  }
  
  return {
    score: normalizedScore,
    comparative: result.comparative,
    label,
    confidence: Math.round(confidence),
    positive: result.positive,
    negative: result.negative
  };
}

/**
 * Analyze sentiment of news article
 */
export function analyzeArticleSentiment(title: string, description?: string): SentimentScore {
  // Combine title and description, giving more weight to title
  const text = description 
    ? `${title} ${title} ${description}` // Title weighted 2x
    : title;
  
  return analyzeSentiment(text);
}

/**
 * Calculate aggregate sentiment from multiple articles
 */
export function aggregateSentiment(sentiments: SentimentScore[]): {
  averageScore: number;
  label: 'bullish' | 'bearish' | 'neutral';
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
} {
  if (sentiments.length === 0) {
    return {
      averageScore: 0,
      label: 'neutral',
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0
    };
  }
  
  const averageScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
  
  const bullishCount = sentiments.filter(s => s.label === 'bullish').length;
  const bearishCount = sentiments.filter(s => s.label === 'bearish').length;
  const neutralCount = sentiments.filter(s => s.label === 'neutral').length;
  
  let label: 'bullish' | 'bearish' | 'neutral';
  if (averageScore > 0.5) {
    label = 'bullish';
  } else if (averageScore < -0.5) {
    label = 'bearish';
  } else {
    label = 'neutral';
  }
  
  return {
    averageScore,
    label,
    bullishCount,
    bearishCount,
    neutralCount
  };
}

/**
 * Enhance news articles with sentiment scores
 */
export function enhanceNewsWithSentiment<T extends { title: string; description?: string }>(
  articles: T[]
): (T & { sentiment: SentimentScore })[] {
  return articles.map(article => ({
    ...article,
    sentiment: analyzeArticleSentiment(article.title, article.description)
  }));
}
