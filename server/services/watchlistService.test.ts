/**
 * Watchlist Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { getUserWatchlists, getWatchlistById, createWatchlist, deleteWatchlist } from "./watchlistService";

// Mock database
vi.mock("../db", () => ({
  getDb: vi.fn(async () => ({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn(() => Promise.resolve([{ insertId: 1 }])),
    delete: vi.fn().mockReturnThis(),
  })),
}));

describe("WatchlistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserWatchlists", () => {
    it("should return user watchlists", async () => {
      const mockWatchlists = [
        { id: 1, userId: 1, name: "Tech Stocks", description: "My tech portfolio" },
        { id: 2, userId: 1, name: "Healthcare", description: "Healthcare stocks" },
      ];

      const { getDb } = await import("../db");
      const mockDb = await getDb();
      vi.mocked(mockDb.where).mockResolvedValue(mockWatchlists as any);

      const result = await getUserWatchlists(1);
      expect(result).toEqual(mockWatchlists);
    });
  });

  describe("createWatchlist", () => {
    it("should create a new watchlist", async () => {
      const newWatchlist = {
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
      };

      const result = await createWatchlist(newWatchlist);
      expect(result).toBeDefined();
    });

    it("should handle missing description", async () => {
      const newWatchlist = {
        userId: 1,
        name: "Tech Stocks",
        description: null,
      };

      const result = await createWatchlist(newWatchlist);
      expect(result).toBeDefined();
    });
  });

  describe("deleteWatchlist", () => {
    it("should delete a watchlist", async () => {
      await expect(deleteWatchlist(1, 1)).resolves.not.toThrow();
    });
  });
});
