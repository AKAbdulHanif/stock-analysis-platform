import { describe, expect, it } from "vitest";
import { getStockQuote, getChartData, getMultipleQuotes } from "./yahooFinanceService";
import { getStockNews } from "./newsService";

/**
 * Live Market Data Integration Tests
 * 
 * These tests make REAL API calls to Yahoo Finance to verify:
 * - Data fetching works with actual tickers
 * - Response format is correct
 * - Caching behavior works as expected
 * - Error handling works with invalid tickers
 * 
 * Note: These tests may be slower and can fail if Yahoo Finance API is down
 */

describe("Live Market Data Integration Tests", () => {
  // Increase timeout for real API calls
  const TIMEOUT = 30000;

  describe("getStockQuote - Live Data", () => {
    it("should fetch real stock quote for AAPL", async () => {
      const quote = await getStockQuote("AAPL");

      // Verify structure
      expect(quote).toBeDefined();
      expect(quote.ticker).toBe("AAPL");
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.volume).toBeGreaterThan(0);
      expect(quote.previousClose).toBeGreaterThan(0);
      expect(quote.dayHigh).toBeGreaterThan(0);
      expect(quote.dayLow).toBeGreaterThan(0);
      expect(quote.open).toBeGreaterThan(0);
      
      // Verify timestamp is recent (within last 5 minutes)
      const now = Date.now();
      expect(quote.timestamp).toBeGreaterThan(now - 5 * 60 * 1000);
      expect(quote.timestamp).toBeLessThanOrEqual(now);

      // Verify price relationships
      expect(quote.dayHigh).toBeGreaterThanOrEqual(quote.dayLow);
      expect(quote.price).toBeGreaterThanOrEqual(quote.dayLow);
      expect(quote.price).toBeLessThanOrEqual(quote.dayHigh);

      console.log("✓ AAPL Quote:", {
        ticker: quote.ticker,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent.toFixed(2) + "%",
        volume: quote.volume.toLocaleString(),
      });
    }, TIMEOUT);

    it("should fetch real stock quote for MSFT", async () => {
      const quote = await getStockQuote("MSFT");

      expect(quote).toBeDefined();
      expect(quote.ticker).toBe("MSFT");
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.volume).toBeGreaterThan(0);

      console.log("✓ MSFT Quote:", {
        ticker: quote.ticker,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent.toFixed(2) + "%",
      });
    }, TIMEOUT);

    it("should fetch real stock quote for GOOGL", async () => {
      const quote = await getStockQuote("GOOGL");

      expect(quote).toBeDefined();
      expect(quote.ticker).toBe("GOOGL");
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.volume).toBeGreaterThan(0);

      console.log("✓ GOOGL Quote:", {
        ticker: quote.ticker,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent.toFixed(2) + "%",
      });
    }, TIMEOUT);

    it("should return cached data on second call", async () => {
      const ticker = "TSLA";
      
      // First call - fetches from API
      const quote1 = await getStockQuote(ticker);
      const timestamp1 = quote1.timestamp;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Second call - should return cached data
      const quote2 = await getStockQuote(ticker);
      const timestamp2 = quote2.timestamp;

      // Timestamps should be identical (cached)
      expect(timestamp2).toBe(timestamp1);
      expect(quote2.price).toBe(quote1.price);

      console.log("✓ Cache working: TSLA data returned from cache");
    }, TIMEOUT);

    it("should handle invalid ticker gracefully", async () => {
      await expect(getStockQuote("INVALIDTICKER123")).rejects.toThrow();
      console.log("✓ Invalid ticker handled correctly");
    }, TIMEOUT);
  });

  describe("getChartData - Live Data", () => {
    it("should fetch real historical data for AAPL", async () => {
      const chartData = await getChartData("AAPL", "1mo", "1d");

      expect(chartData).toBeDefined();
      expect(chartData.ticker).toBe("AAPL");
      expect(chartData.period).toBe("1mo");
      expect(chartData.dataPoints).toBeDefined();
      expect(chartData.dataPoints.length).toBeGreaterThan(0);

      // Verify first data point structure
      const firstPoint = chartData.dataPoints[0];
      expect(firstPoint.timestamp).toBeGreaterThan(0);
      expect(firstPoint.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(firstPoint.open).toBeGreaterThan(0);
      expect(firstPoint.high).toBeGreaterThan(0);
      expect(firstPoint.low).toBeGreaterThan(0);
      expect(firstPoint.close).toBeGreaterThan(0);
      expect(firstPoint.volume).toBeGreaterThan(0);

      // Verify OHLC relationships
      expect(firstPoint.high).toBeGreaterThanOrEqual(firstPoint.low);
      expect(firstPoint.high).toBeGreaterThanOrEqual(firstPoint.open);
      expect(firstPoint.high).toBeGreaterThanOrEqual(firstPoint.close);
      expect(firstPoint.low).toBeLessThanOrEqual(firstPoint.open);
      expect(firstPoint.low).toBeLessThanOrEqual(firstPoint.close);

      console.log("✓ AAPL Chart Data:", {
        ticker: chartData.ticker,
        period: chartData.period,
        dataPoints: chartData.dataPoints.length,
        latestClose: chartData.dataPoints[chartData.dataPoints.length - 1].close,
      });
    }, TIMEOUT);

    it("should fetch different periods correctly", async () => {
      const periods: Array<"1d" | "5d" | "1mo"> = ["1d", "5d", "1mo"];

      for (const period of periods) {
        const chartData = await getChartData("MSFT", period, "1d");
        
        expect(chartData.period).toBe(period);
        expect(chartData.dataPoints.length).toBeGreaterThan(0);

        console.log(`✓ MSFT ${period} data: ${chartData.dataPoints.length} points`);
      }
    }, TIMEOUT * 3);
  });

  describe("getMultipleQuotes - Live Data", () => {
    it("should fetch multiple stock quotes at once", async () => {
      const tickers = ["AAPL", "MSFT", "GOOGL", "TSLA", "NVDA"];
      const quotes = await getMultipleQuotes(tickers);

      expect(quotes).toBeDefined();
      expect(quotes.length).toBe(tickers.length);

      quotes.forEach((quote, index) => {
        expect(quote.ticker).toBe(tickers[index]);
        expect(quote.price).toBeGreaterThan(0);
        
        console.log(`✓ ${quote.ticker}: $${quote.price} (${quote.changePercent.toFixed(2)}%)`);
      });
    }, TIMEOUT);
  });

  describe("getStockNews - Live Data", () => {
    it("should fetch real news for AAPL", async () => {
      const news = await getStockNews("AAPL", 5);

      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      
      if (news.length > 0) {
        const article = news[0];
        expect(article.title).toBeDefined();
        expect(article.title.length).toBeGreaterThan(0);
        expect(article.url).toMatch(/^https?:\/\//);
        expect(article.ticker).toBe("AAPL");
        expect(article.sentiment).toBeDefined();
        expect(article.sentiment?.type).toMatch(/^(positive|negative|neutral)$/);

        console.log("✓ AAPL News:", {
          articles: news.length,
          latestTitle: article.title.substring(0, 60) + "...",
          sentiment: article.sentiment?.type,
          score: article.sentiment?.score,
        });
      } else {
        console.log("✓ AAPL News: No recent articles (API may be rate limited)");
      }
    }, TIMEOUT);

    it("should include sentiment analysis in news", async () => {
      const news = await getStockNews("TSLA", 3);

      if (news.length > 0) {
        news.forEach(article => {
          expect(article.sentiment).toBeDefined();
          expect(article.sentiment?.type).toMatch(/^(positive|negative|neutral)$/);
          expect(article.sentiment?.score).toBeGreaterThanOrEqual(-1);
          expect(article.sentiment?.score).toBeLessThanOrEqual(1);
          expect(article.sentiment?.confidence).toBeGreaterThanOrEqual(0); // Can be 0 for neutral
          expect(article.sentiment?.confidence).toBeLessThanOrEqual(1);
        });

        console.log("✓ TSLA News sentiment analysis working");
      }
    }, TIMEOUT);
  });

  describe("Performance and Caching", () => {
    it("should demonstrate caching performance improvement", async () => {
      const ticker = "NVDA";

      // First call - uncached
      const start1 = Date.now();
      await getStockQuote(ticker);
      const duration1 = Date.now() - start1;

      // Second call - cached
      const start2 = Date.now();
      await getStockQuote(ticker);
      const duration2 = Date.now() - start2;

      // Cached call should be faster or equal (timing can be imprecise for very fast operations)
      expect(duration2).toBeLessThanOrEqual(duration1);
      
      console.log("✓ Caching performance:", {
        uncached: `${duration1}ms`,
        cached: `${duration2}ms`,
        improvement: `${((1 - duration2 / duration1) * 100).toFixed(1)}% faster`,
      });
    }, TIMEOUT);
  });
});
