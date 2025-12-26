/**
 * News Service
 * 
 * Fetches financial news for stocks using Yahoo Finance News API
 * Provides caching and error handling for news data
 */

import { analyzeArticleSentiment } from './sentimentService';

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  thumbnail?: string;
  ticker: string;
  sentiment?: {
    type: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
  };
}

interface NewsCache {
  data: NewsArticle[];
  timestamp: number;
}

// In-memory cache for news data (5 minute TTL)
const newsCache = new Map<string, NewsCache>();
const NEWS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Custom error class for news API errors
 */
export class NewsApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public ticker?: string
  ) {
    super(message);
    this.name = 'NewsApiError';
  }
}

/**
 * Fetch news for a specific stock ticker
 */
export async function getStockNews(ticker: string, limit: number = 10): Promise<NewsArticle[]> {
  const cacheKey = `news_${ticker}_${limit}`;
  
  // Check cache first
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use Yahoo Finance News API
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=0&newsCount=${limit}&enableFuzzyQuery=false`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new NewsApiError(
        `Failed to fetch news for ${ticker}: ${response.statusText}`,
        response.status,
        ticker
      );
    }

    const data = await response.json();
    
    // Parse news articles with sentiment analysis
    const articles: NewsArticle[] = (data.news || []).map((item: any) => {
      const title = item.title || 'Untitled';
      const summary = item.summary || item.description || '';
      
      // Analyze sentiment
      const sentimentResult = analyzeArticleSentiment(title, summary);
      
      return {
        title,
        summary,
        url: item.link || item.url || '#',
        source: item.publisher || item.providerName || 'Unknown',
        publishedAt: new Date(item.providerPublishTime * 1000).toISOString(),
        thumbnail: item.thumbnail?.resolutions?.[0]?.url || item.thumbnail?.url,
        ticker: ticker,
        sentiment: {
          type: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: sentimentResult.confidence
        }
      };
    });

    // Cache the results
    newsCache.set(cacheKey, {
      data: articles,
      timestamp: Date.now()
    });

    return articles;
  } catch (error) {
    if (error instanceof NewsApiError) {
      throw error;
    }
    
    console.error(`Error fetching news for ${ticker}:`, error);
    throw new NewsApiError(
      `Failed to fetch news for ${ticker}`,
      500,
      ticker
    );
  }
}

/**
 * Fetch news for multiple tickers (portfolio news)
 */
export async function getPortfolioNews(tickers: string[], limitPerStock: number = 5): Promise<NewsArticle[]> {
  const cacheKey = `portfolio_${tickers.sort().join(',')}_${limitPerStock}`;
  
  // Check cache first
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < NEWS_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Fetch news for all tickers in parallel
    const newsPromises = tickers.map(ticker => 
      getStockNews(ticker, limitPerStock).catch(error => {
        console.error(`Failed to fetch news for ${ticker}:`, error);
        return []; // Return empty array on error, don't fail entire request
      })
    );

    const allNews = await Promise.all(newsPromises);
    
    // Flatten and sort by date
    const articles = allNews
      .flat()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Cache the results
    newsCache.set(cacheKey, {
      data: articles,
      timestamp: Date.now()
    });

    return articles;
  } catch (error) {
    console.error('Error fetching portfolio news:', error);
    throw new NewsApiError('Failed to fetch portfolio news', 500);
  }
}

/**
 * Clear news cache
 */
export function clearNewsCache(): void {
  newsCache.clear();
}

/**
 * Get cache statistics
 */
export function getNewsCacheStats() {
  return {
    size: newsCache.size,
    keys: Array.from(newsCache.keys())
  };
}
