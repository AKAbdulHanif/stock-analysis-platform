/**
 * News API Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express, { Express } from "express";
import newsRouter from "./newsApi";

describe("News API Integration Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api", newsRouter);
  });

  describe("GET /api/news/:ticker", () => {
    it("should return news articles for valid ticker", async () => {
      const response = await request(app)
        .get("/api/news/AAPL")
        .expect(200);

      expect(response.body).toHaveProperty("ticker");
      expect(response.body).toHaveProperty("articles");
      expect(response.body.articles).toBeInstanceOf(Array);
      if (response.body.articles.length > 0) {
        expect(response.body.articles[0]).toHaveProperty("title");
        expect(response.body.articles[0]).toHaveProperty("url");
        expect(response.body.articles[0]).toHaveProperty("publishedAt");
        expect(response.body.articles[0]).toHaveProperty("source");
      }
    });

    it("should return empty array for ticker with no news", async () => {
      const response = await request(app)
        .get("/api/news/INVALID123")
        .expect(200);

      expect(response.body).toHaveProperty("articles");
      expect(response.body.articles).toBeInstanceOf(Array);
    });

    it("should handle whitespace ticker", async () => {
      const response = await request(app)
        .get("/api/news/%20%20%20")
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should include sentiment data in articles", async () => {
      const response = await request(app)
        .get("/api/news/MSFT")
        .expect(200);

      if (response.body.articles && response.body.articles.length > 0) {
        expect(response.body.articles[0]).toHaveProperty("sentiment");
        expect(response.body.articles[0].sentiment).toHaveProperty("score");
        expect(response.body.articles[0].sentiment).toHaveProperty("label");
      }
    });
  });

  describe("POST /api/news/portfolio", () => {
    it("should return news for multiple tickers", async () => {
      const response = await request(app)
        .post("/api/news/portfolio")
        .send({ tickers: ["AAPL", "MSFT", "GOOGL"] })
        .expect(200);

      expect(response.body).toHaveProperty("articles");
      expect(response.body.articles).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty("tickers");
      expect(response.body).toHaveProperty("count");
    });

    it("should return 400 for missing tickers", async () => {
      const response = await request(app)
        .post("/api/news/portfolio")
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 for invalid tickers format", async () => {
      const response = await request(app)
        .post("/api/news/portfolio")
        .send({ tickers: "AAPL" })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should limit results to maxArticles parameter", async () => {
      const response = await request(app)
        .post("/api/news/portfolio")
        .send({ tickers: ["AAPL", "MSFT"], limitPerStock: 5 })
        .expect(200);

      expect(response.body.articles).toBeInstanceOf(Array);
      // Each stock gets up to 5 articles, so max 10 total for 2 stocks
      expect(response.body.articles.length).toBeLessThanOrEqual(10);
    });

    it("should handle empty tickers array", async () => {
      const response = await request(app)
        .post("/api/news/portfolio")
        .send({ tickers: [] })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Caching behavior", () => {
    it("should return cached results on subsequent requests", async () => {
      const ticker = "NVDA";
      
      // First request
      const response1 = await request(app)
        .get(`/api/news/${ticker}`)
        .expect(200);

      // Second request (should be cached)
      const response2 = await request(app)
        .get(`/api/news/${ticker}`)
        .expect(200);

      // Results should be identical
      expect(response1.body).toEqual(response2.body);
    });
  });

  describe("Error handling", () => {
    it("should handle network errors gracefully", async () => {
      // Test with a ticker that might cause issues
      const response = await request(app)
        .get("/api/news/TEST_ERROR_TICKER_12345")
        .expect(200);

      expect(response.body).toHaveProperty("articles");
      expect(response.body.articles).toBeInstanceOf(Array);
    });
  });
});
