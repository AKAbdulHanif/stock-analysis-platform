import { describe, expect, it } from "vitest";
import { analyzeSentiment, analyzeArticleSentiment, getSentimentStats } from "./sentimentService";

describe("sentimentService", () => {
  describe("analyzeSentiment", () => {
    it("should classify positive news correctly", () => {
      const title = "Company reports strong earnings growth and beats expectations";
      const summary = "The company delivered excellent results with record profits and bullish outlook";

      const result = analyzeArticleSentiment(title, summary);

      expect(result.sentiment).toBe("positive");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    it("should classify negative news correctly", () => {
      const title = "Company faces bankruptcy amid declining sales and losses";
      const summary = "The struggling company reported disappointing earnings with significant losses";

      const result = analyzeArticleSentiment(title, summary);

      expect(result.sentiment).toBe("negative");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(0);
    });

    it("should classify neutral news correctly", () => {
      const title = "Company announces quarterly meeting schedule";
      const summary = "The company will hold its quarterly earnings call next week";

      const result = analyzeArticleSentiment(title, summary);

      expect(result.sentiment).toBe("neutral");
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it("should handle intensifiers correctly", () => {
      const strongResult = analyzeArticleSentiment(
        "Company delivers extremely strong performance",
        "Very impressive results"
      );
      const weakResult = analyzeArticleSentiment(
        "Company shows growth",
        "Positive results"
      );

      // Both should be positive
      expect(strongResult.sentiment).toBe("positive");
      expect(weakResult.sentiment).toBe("positive");
      // Strong should have higher confidence due to more matches
      expect(strongResult.confidence).toBeGreaterThan(0);
      expect(weakResult.confidence).toBeGreaterThan(0);
    });

    it("should handle negation correctly", () => {
      const result = analyzeArticleSentiment(
        "Company reports not strong earnings",
        "Results were not impressive"
      );

      // Negation should flip positive words to negative
      expect(result.score).toBeLessThanOrEqual(0);
    });

    it("should return neutral for empty content", () => {
      const result = analyzeArticleSentiment("", "");

      expect(result.sentiment).toBe("neutral");
      expect(result.confidence).toBe(0);
    });
  });

  describe("getSentimentStats", () => {
    it("should calculate sentiment statistics", () => {
      const sentiments = ['positive', 'negative', 'neutral', 'positive', 'positive'] as const;

      const result = getSentimentStats(sentiments);

      expect(result.positive).toBe(3);
      expect(result.negative).toBe(1);
      expect(result.neutral).toBe(1);
      expect(result.positivePercent).toBeCloseTo(60);
      expect(result.negativePercent).toBeCloseTo(20);
      expect(result.neutralPercent).toBeCloseTo(20);
    });

    it("should handle empty sentiment array", () => {
      const result = getSentimentStats([]);

      expect(result.positive).toBe(0);
      expect(result.negative).toBe(0);
      expect(result.neutral).toBe(0);
      expect(result.positivePercent).toBe(0);
      expect(result.negativePercent).toBe(0);
      expect(result.neutralPercent).toBe(0);
    });

    it("should calculate all positive sentiments correctly", () => {
      const sentiments = ['positive', 'positive', 'positive'] as const;

      const result = getSentimentStats(sentiments);

      expect(result.positive).toBe(3);
      expect(result.positivePercent).toBe(100);
      expect(result.negativePercent).toBe(0);
    });

    it("should calculate all negative sentiments correctly", () => {
      const sentiments = ['negative', 'negative'] as const;

      const result = getSentimentStats(sentiments);

      expect(result.negative).toBe(2);
      expect(result.negativePercent).toBe(100);
      expect(result.positivePercent).toBe(0);
    });

    it("should calculate mixed sentiments correctly", () => {
      const sentiments = ['positive', 'negative', 'neutral', 'positive'] as const;

      const result = getSentimentStats(sentiments);

      expect(result.positive).toBe(2);
      expect(result.negative).toBe(1);
      expect(result.neutral).toBe(1);
      expect(result.positivePercent).toBe(50);
      expect(result.negativePercent).toBe(25);
      expect(result.neutralPercent).toBe(25);
    });
  });
});
