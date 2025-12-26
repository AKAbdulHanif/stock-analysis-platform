import { describe, expect, it, vi, beforeEach } from "vitest";
import { getStockNews, NewsApiError } from "./newsService";

// Mock fetch
global.fetch = vi.fn();

// Mock sentiment service
vi.mock("./sentimentService", () => ({
  analyzeArticleSentiment: vi.fn((title: string, summary: string) => ({
    sentiment: "positive",
    score: 0.5,
    confidence: 0.7,
  })),
}));

describe("newsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  describe("getStockNews", () => {
    it("should fetch and parse news articles successfully", async () => {
      const mockResponse = {
        news: [
          {
            title: "Apple announces new iPhone",
            summary: "Apple unveils latest iPhone with groundbreaking features",
            link: "https://example.com/article1",
            publisher: "TechCrunch",
            providerPublishTime: 1703620800,
            thumbnail: {
              resolutions: [
                {
                  url: "https://example.com/thumb1.jpg",
                },
              ],
            },
          },
          {
            title: "Apple stock rises on earnings beat",
            description: "Shares climb after strong quarterly results",
            url: "https://example.com/article2",
            providerName: "Bloomberg",
            providerPublishTime: 1703707200,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("AAPL", 10);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        title: "Apple announces new iPhone",
        summary: "Apple unveils latest iPhone with groundbreaking features",
        url: "https://example.com/article1",
        source: "TechCrunch",
        ticker: "AAPL",
        thumbnail: "https://example.com/thumb1.jpg",
      });
      expect(result[0].sentiment).toMatchObject({
        type: "positive",
        score: 0.5,
        confidence: 0.7,
      });

      expect(result[1]).toMatchObject({
        title: "Apple stock rises on earnings beat",
        summary: "Shares climb after strong quarterly results",
        url: "https://example.com/article2",
        source: "Bloomberg",
        ticker: "AAPL",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("AAPL"),
        expect.any(Object)
      );
    });

    it("should return cached data within cache duration", async () => {
      const mockResponse = {
        news: [
          {
            title: "Microsoft announces cloud expansion",
            summary: "Azure grows market share",
            link: "https://example.com/article",
            publisher: "Reuters",
            providerPublishTime: 1703620800,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      const result1 = await getStockNews("MSFT", 5);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call immediately - should use cache
      const result2 = await getStockNews("MSFT", 5);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toEqual(result1);
    });

    it("should handle empty news array", async () => {
      const mockResponse = {
        news: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("UNKNOWN", 10);

      expect(result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("should handle missing optional fields gracefully", async () => {
      const mockResponse = {
        news: [
          {
            title: "Tesla news",
            // Missing summary, thumbnail, etc.
            link: "https://example.com/article",
            publisher: "CNBC",
            providerPublishTime: 1703620800,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("TSLA", 10);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        title: "Tesla news",
        summary: "",
        url: "https://example.com/article",
        source: "CNBC",
        ticker: "TSLA",
      });
      expect(result[0].thumbnail).toBeUndefined();
    });

    it("should throw NewsApiError for API failures", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(getStockNews("INVALID404")).rejects.toThrow(NewsApiError);
    });

    it("should throw NewsApiError for network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await expect(getStockNews("NETERR")).rejects.toThrow(NewsApiError);
    });

    it("should handle API rate limiting (429 status)", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      await expect(getStockNews("RATELIMIT")).rejects.toThrow(NewsApiError);
    });

    it("should handle malformed JSON response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      await expect(getStockNews("BADJSON")).rejects.toThrow(NewsApiError);
    });

    it("should respect limit parameter", async () => {
      const mockResponse = {
        news: Array(20)
          .fill(null)
          .map((_, i) => ({
            title: `News ${i}`,
            summary: `Summary ${i}`,
            link: `https://example.com/article${i}`,
            publisher: "Test",
            providerPublishTime: 1703620800 + i * 3600,
          })),
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("LIMIT20", 20);

      expect(result).toHaveLength(20);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("newsCount=20"),
        expect.any(Object)
      );
    });

    it("should include sentiment analysis for each article", async () => {
      const mockResponse = {
        news: [
          {
            title: "Positive news",
            summary: "Great results",
            link: "https://example.com/article",
            publisher: "Test",
            providerPublishTime: 1703620800,
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("SENTIMENT", 10);

      expect(result[0].sentiment).toBeDefined();
      expect(result[0].sentiment?.type).toBe("positive");
      expect(result[0].sentiment?.score).toBe(0.5);
      expect(result[0].sentiment?.confidence).toBe(0.7);
    });

    it("should handle articles with alternative field names", async () => {
      const mockResponse = {
        news: [
          {
            title: "News title",
            description: "Alternative summary field",
            url: "https://example.com/article",
            providerName: "Alternative source field",
            providerPublishTime: 1703620800,
            thumbnail: {
              url: "https://example.com/thumb.jpg",
            },
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("ALTFIELDS", 10);

      expect(result[0]).toMatchObject({
        title: "News title",
        summary: "Alternative summary field",
        url: "https://example.com/article",
        source: "Alternative source field",
        thumbnail: "https://example.com/thumb.jpg",
      });
    });

    it("should format publishedAt as ISO string", async () => {
      const mockResponse = {
        news: [
          {
            title: "Test article",
            summary: "Test summary",
            link: "https://example.com/article",
            publisher: "Test",
            providerPublishTime: 1703620800, // Unix timestamp
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getStockNews("ISOTIME", 10);

      expect(result[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(result[0].publishedAt)).toBeInstanceOf(Date);
    });
  });

  describe("NewsApiError", () => {
    it("should create error with message and status code", () => {
      const error = new NewsApiError("Test error", 404, "AAPL");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(404);
      expect(error.ticker).toBe("AAPL");
      expect(error.name).toBe("NewsApiError");
      expect(error).toBeInstanceOf(Error);
    });

    it("should create error with default status code", () => {
      const error = new NewsApiError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.ticker).toBeUndefined();
    });
  });
});
