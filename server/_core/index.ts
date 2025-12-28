import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import stockApiRouter from "../routes/stockApi";
import newsApiRouter from "../routes/newsApi";
import sentimentPortfolioApiRouter from "../routes/sentimentPortfolioApi";
import watchlistApiRouter from "../routes/watchlistApi";
import alertApiRouter from "../routes/alertApi";
import sentimentHistoryApiRouter from "../routes/sentimentHistoryApi";
import sentimentSnapshotApiRouter from "../routes/sentimentSnapshotApi";
import performanceApiRouter from "../routes/performanceApi";
import stockComparisonApiRouter from "../routes/stockComparisonApi";
import backtestingApiRouter from '../routes/backtestingApi';
import monteCarloApiRouter from '../routes/monteCarloApi';
import taxLossHarvestingApiRouter from '../routes/taxLossHarvestingApi';
import optionsStrategyApiRouter from '../routes/optionsStrategyApi';
import technicalIndicatorsApiRouter from '../routes/technicalIndicatorsApi';
import candlestickPatternApiRouter from '../routes/candlestickPatternApi';
import economicCalendarApiRouter from '../routes/economicCalendarApi';
import stockScreenerApiRouter from '../routes/stockScreenerApi';
import riskMetricsApiRouter from '../routes/riskMetricsApi';
import sectorRotationApiRouter from '../routes/sectorRotationApi';
import insiderTradingApiRouter from '../routes/insiderTradingApi';
import cacheApiRouter from '../routes/cacheApi';
import stockSearchRouter from '../routes/stockSearch';
import sectorPerformanceRouter from '../routes/sectorPerformance';
import sectorComparisonApiRouter from '../routes/sectorComparisonApi';
import stockDetailApiRouter from '../routes/stockDetailApi';
import portfolioBuilderApiRouter from '../routes/portfolioBuilderApi';
import portfolioApiRouter from '../routes/portfolioApi';
import portfolioPerformanceApiRouter from '../routes/portfolioPerformanceApi';
import portfolioExportApiRouter from '../routes/portfolioExportApi';
import { realtimePriceService } from '../services/realtimePriceService';
import { apiLimiter, stockDataLimiter } from './rateLimiter';
import { securityHeaders, sanitizeInput, requestLogger } from './security';

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Security middleware
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(sanitizeInput);
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Rate limiting
  app.use("/api", apiLimiter);
  app.use("/api/stock-quote", stockDataLimiter);
  app.use("/api/stock-quotes", stockDataLimiter);
  app.use("/api/stock-chart", stockDataLimiter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Stock API routes
  app.use("/api", stockApiRouter);
  // News API routes
  app.use("/api", newsApiRouter);
  // Sentiment Portfolio API routes
  app.use("/api/sentiment", sentimentPortfolioApiRouter);
  // Watchlist API routes
  app.use("/api", watchlistApiRouter);
  // Alert API routes
  app.use("/api/alerts", alertApiRouter);
  // Sentiment History API routes
  app.use("/api/sentiment-history", sentimentHistoryApiRouter);
  // Sentiment Snapshot API routes
  app.use("/api/sentiment-snapshots", sentimentSnapshotApiRouter);
  // Performance API routes
  app.use("/api/performance", performanceApiRouter);
  // Stock Comparison API routes
  app.use("/api/stock", stockComparisonApiRouter);
  // Backtesting API routes
  app.use("/api/backtest", backtestingApiRouter);
  // Monte Carlo API routes
  app.use("/api/monte-carlo", monteCarloApiRouter);
  // Tax-Loss Harvesting API routes
  app.use("/api/tax-loss-harvesting", taxLossHarvestingApiRouter);
  // Options Strategy API routes
  app.use("/api/options", optionsStrategyApiRouter);
  // Technical Indicators API routes
  app.use("/api/technical-indicators", technicalIndicatorsApiRouter);
  // Candlestick Pattern API routes
  app.use("/api/candlestick-patterns", candlestickPatternApiRouter);
  // Economic Calendar API routes
  app.use("/api/calendar", economicCalendarApiRouter);
  // Stock Screener API routes
  app.use("/api/screener", stockScreenerApiRouter);
  // Risk Metrics API routes
  app.use("/api", riskMetricsApiRouter);
  // Sector Rotation API routes
  app.use("/api", sectorRotationApiRouter);
  // Insider Trading API routes
  app.use("/api", insiderTradingApiRouter);
  // Cache API routes
  app.use("/api/cache", cacheApiRouter);
  // Stock Search API routes
  app.use("/api", stockSearchRouter);
  // Sector Performance API routes
  app.use("/api", sectorPerformanceRouter);
  // Sector Comparison API routes
  app.use("/api", sectorComparisonApiRouter);
  // Stock Detail API routes
  app.use("/api", stockDetailApiRouter);
  // Portfolio Builder API routes
  app.use("/api", portfolioBuilderApiRouter);
  // Portfolio CRUD API routes
  app.use("/api", portfolioApiRouter);
  // Portfolio Performance API routes
  app.use("/api", portfolioPerformanceApiRouter);
  // Portfolio Export API routes
  app.use("/api", portfolioExportApiRouter);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize WebSocket server for real-time price updates
    realtimePriceService.initialize(server);
  });
}

startServer().catch(console.error);
