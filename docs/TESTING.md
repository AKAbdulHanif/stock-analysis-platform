# Testing Strategy - Investment Outlook 2026

**Version:** 1.0.0  
**Last Updated:** December 26, 2025  
**Author:** Manus AI

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [Test Coverage](#test-coverage)
7. [Running Tests](#running-tests)
8. [CI/CD Integration](#cicd-integration)

---

## Overview

This document outlines the comprehensive testing strategy for the Investment Outlook 2026 platform. Our approach follows industry best practices with a focus on reliability, maintainability, and fast feedback loops.

**Testing Principles:**
- **Test-Driven Development (TDD)**: Write tests before implementation when possible
- **Isolation**: Each test should be independent and not rely on external state
- **Clarity**: Tests should serve as documentation for expected behavior
- **Speed**: Unit tests should run in milliseconds, integration tests in seconds
- **Coverage**: Aim for 80%+ code coverage with focus on critical paths

---

## Testing Pyramid

```
         /\
        /  \
       / E2E \          10% - End-to-End Tests
      /______\
     /        \
    /Integration\       30% - Integration Tests
   /____________\
  /              \
 /   Unit Tests   \    60% - Unit Tests
/__________________\
```

**Distribution:**
- **60% Unit Tests**: Fast, isolated tests of individual functions and components
- **30% Integration Tests**: Tests of API endpoints and database interactions
- **10% E2E Tests**: Full user workflow tests through the UI

---

## Unit Testing

### Framework

**Tool:** Vitest  
**Why:** Fast, TypeScript-first, compatible with Vite

### Scope

Unit tests cover:
1. **Utility Functions** (`client/src/lib/`, `server/db.ts`)
2. **Business Logic** (`server/routers.ts`)
3. **React Components** (`client/src/components/`)
4. **Data Transformations** (price calculations, analytics)

### Structure

```typescript
// server/__tests__/auth.logout.test.ts
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { COOKIE_NAME } from "../../shared/const";
import type { TrpcContext } from "../_core/context";

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.auth.logout();
    
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});
```

### Test Categories

#### 1. Utility Function Tests

**Location:** `client/src/lib/__tests__/`

**Example:**
```typescript
// client/src/lib/__tests__/priceService.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { getStockPrice, resetPrices } from "../priceService";

describe("priceService", () => {
  beforeEach(() => {
    resetPrices();
  });

  it("returns price data for a given ticker", () => {
    const price = getStockPrice("NVDA");
    
    expect(price).toHaveProperty("ticker", "NVDA");
    expect(price).toHaveProperty("currentPrice");
    expect(price.currentPrice).toBeGreaterThan(0);
  });

  it("caches prices for repeated calls", () => {
    const price1 = getStockPrice("NVDA");
    const price2 = getStockPrice("NVDA");
    
    expect(price1.currentPrice).toBe(price2.currentPrice);
    expect(price1.lastUpdated).toBe(price2.lastUpdated);
  });
});
```

#### 2. Business Logic Tests

**Location:** `server/__tests__/`

**Example:**
```typescript
// server/__tests__/portfolio.test.ts
import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import { createAuthContext } from "./helpers";

describe("portfolio.create", () => {
  it("creates a new portfolio for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.portfolio.create({
      name: "Growth Portfolio",
      description: "High-risk tech stocks"
    });
    
    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Growth Portfolio");
    expect(result.userId).toBe(ctx.user.id);
  });

  it("throws error for unauthenticated user", async () => {
    const { ctx } = createUnauthContext();
    const caller = appRouter.createCaller(ctx);
    
    await expect(
      caller.portfolio.create({ name: "Test" })
    ).rejects.toThrow("UNAUTHORIZED");
  });
});
```

#### 3. Component Tests

**Location:** `client/src/components/__tests__/`

**Example:**
```typescript
// client/src/components/__tests__/StockCard.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StockCard } from "../StockCard";

describe("StockCard", () => {
  it("renders stock information correctly", () => {
    const stock = {
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      price: 188.50,
      change: 2.5
    };
    
    render(<StockCard stock={stock} />);
    
    expect(screen.getByText("NVDA")).toBeInTheDocument();
    expect(screen.getByText("$188.50")).toBeInTheDocument();
    expect(screen.getByText("+2.5%")).toBeInTheDocument();
  });

  it("shows red color for negative change", () => {
    const stock = {
      ticker: "NVDA",
      name: "NVIDIA Corporation",
      price: 188.50,
      change: -2.5
    };
    
    render(<StockCard stock={stock} />);
    
    const changeElement = screen.getByText("-2.5%");
    expect(changeElement).toHaveClass("text-red-500");
  });
});
```

---

## Integration Testing

### Scope

Integration tests verify:
1. **API Endpoints**: tRPC procedures with database interactions
2. **Authentication Flow**: OAuth callback and session management
3. **External API Integration**: Yahoo Finance API calls
4. **Database Operations**: CRUD operations and transactions

### Structure

```typescript
// server/__tests__/integration/trades.test.ts
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appRouter } from "../../routers";
import { getDb } from "../../db";
import { createAuthContext, cleanupDb } from "../helpers";

describe("trades integration", () => {
  beforeEach(async () => {
    await cleanupDb();
  });

  afterEach(async () => {
    await cleanupDb();
  });

  it("creates trade and updates portfolio metrics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Create trade
    const trade = await caller.trades.create({
      ticker: "NVDA",
      entryPrice: 180.00,
      quantity: 10,
      strategy: "Momentum Trading"
    });
    
    expect(trade).toHaveProperty("id");
    
    // Verify database record
    const db = await getDb();
    const dbTrade = await db.query.trades.findFirst({
      where: (trades, { eq }) => eq(trades.id, trade.id)
    });
    
    expect(dbTrade).toBeDefined();
    expect(dbTrade?.ticker).toBe("NVDA");
    
    // Verify portfolio metrics updated
    const metrics = await caller.portfolio.getMetrics();
    expect(metrics.activeTradesCount).toBe(1);
    expect(metrics.totalInvested).toBe(1800.00);
  });
});
```

### Database Testing

**Test Database:** Separate test database instance

**Setup:**
```typescript
// server/__tests__/helpers/db.ts
import { getDb } from "../../db";

export async function cleanupDb() {
  const db = await getDb();
  if (!db) return;
  
  // Clean up in reverse dependency order
  await db.delete(trades);
  await db.delete(alerts);
  await db.delete(watchlists);
  await db.delete(portfolios);
  await db.delete(users);
}

export async function seedTestData() {
  const db = await getDb();
  if (!db) return;
  
  // Insert test user
  await db.insert(users).values({
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    role: "user"
  });
}
```

---

## End-to-End Testing

### Framework

**Tool:** Playwright (future implementation)  
**Why:** Cross-browser support, reliable selectors, built-in assertions

### Scope

E2E tests cover:
1. **User Registration & Login**
2. **Portfolio Management**
3. **Trade Entry & Exit**
4. **Alert Configuration**
5. **Performance Tracking**

### Structure

```typescript
// e2e/portfolio.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Portfolio Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.click("text=Login");
    // OAuth flow handled by test fixtures
  });

  test("creates new portfolio and adds stocks", async ({ page }) => {
    // Navigate to portfolio page
    await page.click("text=Portfolio");
    
    // Create portfolio
    await page.click("text=New Portfolio");
    await page.fill('[name="name"]', "Tech Growth");
    await page.fill('[name="description"]', "High-growth tech stocks");
    await page.click("text=Create");
    
    // Verify creation
    await expect(page.locator("text=Tech Growth")).toBeVisible();
    
    // Add stock to watchlist
    await page.click("text=Stock Picks");
    await page.click('[data-ticker="NVDA"]');
    await page.click("text=Add to Watchlist");
    
    // Verify stock added
    await page.click("text=Portfolio");
    await expect(page.locator("text=NVDA")).toBeVisible();
  });
});
```

---

## Test Coverage

### Coverage Goals

| Component | Target Coverage | Priority |
|-----------|----------------|----------|
| Business Logic | 90%+ | Critical |
| API Endpoints | 85%+ | Critical |
| Utility Functions | 85%+ | High |
| React Components | 70%+ | Medium |
| UI Interactions | 60%+ | Medium |

### Measuring Coverage

```bash
# Run tests with coverage
pnpm test --coverage

# Generate HTML report
pnpm test --coverage --reporter=html

# View coverage report
open coverage/index.html
```

### Coverage Report Example

```
File                  | % Stmts | % Branch | % Funcs | % Lines |
----------------------|---------|----------|---------|---------|
All files             |   82.45 |    75.30 |   80.15 |   82.45 |
 server/              |   85.20 |    78.50 |   82.30 |   85.20 |
  routers.ts          |   90.15 |    85.20 |   88.50 |   90.15 |
  db.ts               |   88.30 |    80.40 |   85.10 |   88.30 |
 client/src/lib/      |   78.50 |    70.20 |   75.40 |   78.50 |
  priceService.ts     |   82.10 |    75.30 |   78.90 |   82.10 |
  portfolioAnalytics.ts|  75.20 |    68.50 |   72.30 |   75.20 |
```

---

## Running Tests

### Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/auth.logout.test.ts

# Run tests matching pattern
pnpm test --grep "portfolio"

# Run tests with UI
pnpm test --ui

# Run tests with coverage
pnpm test --coverage
```

### Test Configuration

**File:** `vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./server/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "server/_core/",
        "**/*.test.ts",
        "**/__tests__/**"
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared")
    }
  }
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "22"
          cache: "pnpm"
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run type check
        run: pnpm check
      
      - name: Run tests
        run: pnpm test --coverage
        env:
          DATABASE_URL: mysql://root:test@localhost:3306/test_db
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hooks

**File:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type check
pnpm check

# Run tests for changed files
pnpm test --changed

# Run linter
pnpm format
```

---

## Best Practices

### 1. Test Naming

**Convention:** `should [expected behavior] when [condition]`

```typescript
it("should return cached price when called within cache duration", () => {
  // ...
});

it("should throw error when user is not authenticated", async () => {
  // ...
});
```

### 2. Test Organization

**Use describe blocks for grouping:**

```typescript
describe("priceService", () => {
  describe("getStockPrice", () => {
    it("returns price for valid ticker", () => {});
    it("generates new price when cache expired", () => {});
  });
  
  describe("subscribeToPriceUpdates", () => {
    it("calls callback with updated prices", () => {});
    it("stops updates when unsubscribed", () => {});
  });
});
```

### 3. Test Data

**Use factories for test data:**

```typescript
// server/__tests__/factories/user.ts
export function createTestUser(overrides = {}) {
  return {
    openId: "test-user-" + Math.random(),
    email: "test@example.com",
    name: "Test User",
    role: "user" as const,
    ...overrides
  };
}
```

### 4. Mocking

**Mock external dependencies:**

```typescript
import { vi } from "vitest";
import * as yahooApi from "../_core/dataApi";

vi.mock("../_core/dataApi", () => ({
  fetchStockQuote: vi.fn().mockResolvedValue({
    symbol: "NVDA",
    price: 188.50
  })
}));
```

### 5. Async Testing

**Always await async operations:**

```typescript
it("creates trade successfully", async () => {
  const result = await caller.trades.create({
    ticker: "NVDA",
    entryPrice: 180.00
  });
  
  expect(result).toHaveProperty("id");
});
```

---

## Troubleshooting

### Common Issues

**1. Database connection errors**
```
Solution: Ensure DATABASE_URL is set in test environment
```

**2. Flaky tests**
```
Solution: Add proper cleanup in afterEach hooks
```

**3. Slow tests**
```
Solution: Use test.concurrent for independent tests
```

**4. Coverage gaps**
```
Solution: Focus on critical paths first, then expand
```

---

## Future Enhancements

### Q1 2026
- Implement Playwright E2E tests
- Add visual regression testing
- Set up mutation testing

### Q2 2026
- Add performance testing with k6
- Implement contract testing for APIs
- Add chaos engineering tests

---

**Document Version:** 1.0.0  
**Last Review:** December 26, 2025  
**Next Review:** March 26, 2026
