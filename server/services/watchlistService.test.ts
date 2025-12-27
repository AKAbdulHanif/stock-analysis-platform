/**
 * Watchlist Service Unit Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getUserWatchlists, getWatchlistById, createWatchlist, deleteWatchlist } from "./watchlistService";

// Create mock database object
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
};

// Mock the database module
vi.mock("../db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

describe("WatchlistService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset all mock implementations
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    mockDb.orderBy.mockReturnThis();
    mockDb.limit.mockReturnThis();
    mockDb.insert.mockReturnThis();
    mockDb.values.mockReturnThis();
    mockDb.delete.mockReturnThis();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserWatchlists", () => {
    it("should return user watchlists", async () => {
      const mockWatchlists = [
        { id: 1, userId: 1, name: "Tech Stocks", description: "My tech portfolio", createdAt: new Date(), updatedAt: new Date() },
        { id: 2, userId: 1, name: "Healthcare", description: "Healthcare stocks", createdAt: new Date(), updatedAt: new Date() },
      ];

      // Mock the final result of the query chain
      mockDb.orderBy.mockResolvedValue(mockWatchlists);

      const result = await getUserWatchlists(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(mockWatchlists);
    });

    it("should handle database errors gracefully", async () => {
      mockDb.orderBy.mockRejectedValue(new Error("Database error"));

      await expect(getUserWatchlists(1)).rejects.toThrow("Failed to fetch watchlists");
    });
  });

  describe("getWatchlistById", () => {
    it("should return a watchlist by ID", async () => {
      const mockWatchlist = {
        id: 1,
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.limit.mockResolvedValue([mockWatchlist]);

      const result = await getWatchlistById(1, 1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockWatchlist);
    });

    it("should return null if watchlist not found", async () => {
      mockDb.limit.mockResolvedValue([]);

      const result = await getWatchlistById(999, 1);
      
      expect(result).toBeNull();
    });
  });

  describe("createWatchlist", () => {
    it("should create a new watchlist", async () => {
      const newWatchlist = {
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
      };

      const createdWatchlist = {
        id: 1,
        ...newWatchlist,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock insert result - values() returns the insert result
      mockDb.values.mockResolvedValue([{ insertId: 1 }]);
      
      // Mock select after insert - limit() returns the created watchlist
      mockDb.limit.mockResolvedValue([createdWatchlist]);

      const result = await createWatchlist(newWatchlist);
      
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(newWatchlist);
      expect(result).toEqual(createdWatchlist);
      expect(result.id).toBe(1);
    });

    it("should handle missing description", async () => {
      const newWatchlist = {
        userId: 1,
        name: "Tech Stocks",
        description: null,
      };

      const createdWatchlist = {
        id: 1,
        userId: 1,
        name: "Tech Stocks",
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.values.mockResolvedValue([{ insertId: 1 }]);
      mockDb.limit.mockResolvedValue([createdWatchlist]);

      const result = await createWatchlist(newWatchlist);
      
      expect(result).toBeDefined();
      expect(result.description).toBeNull();
    });

    it("should handle database errors during creation", async () => {
      const newWatchlist = {
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
      };

      mockDb.values.mockRejectedValue(new Error("Database error"));

      await expect(createWatchlist(newWatchlist)).rejects.toThrow("Failed to create watchlist");
    });
  });

  describe("deleteWatchlist", () => {
    it("should delete a watchlist", async () => {
      const mockWatchlist = {
        id: 1,
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getWatchlistById - returns the watchlist
      mockDb.limit.mockResolvedValueOnce([mockWatchlist]);
      
      // Mock first delete (watchlistStocks) - where() returns undefined
      mockDb.where.mockResolvedValueOnce(undefined);
      
      // Mock second delete (watchlists) - where() returns undefined
      mockDb.where.mockResolvedValueOnce(undefined);

      await expect(deleteWatchlist(1, 1)).resolves.not.toThrow();
      
      expect(mockDb.delete).toHaveBeenCalledTimes(2); // Called twice: stocks + watchlist
    });

    it("should throw error if watchlist not found", async () => {
      // Mock getWatchlistById to return null (empty array)
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(deleteWatchlist(999, 1)).rejects.toThrow("Watchlist not found");
    });

    it("should handle database errors during deletion", async () => {
      const mockWatchlist = {
        id: 1,
        userId: 1,
        name: "Tech Stocks",
        description: "My tech portfolio",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock getWatchlistById - returns the watchlist
      mockDb.limit.mockResolvedValueOnce([mockWatchlist]);
      
      // Mock first delete to fail
      mockDb.where.mockRejectedValueOnce(new Error("Database error"));

      await expect(deleteWatchlist(1, 1)).rejects.toThrow("Failed to delete watchlist");
    });
  });
});
