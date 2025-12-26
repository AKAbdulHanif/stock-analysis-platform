# Investment Outlook 2026 - TODO

## Phase 4: Backend API Integration & Portfolio Website Integration (In Progress)

### Backend API Implementation
- [x] Create Yahoo Finance API service in server/services/
- [x] Implement stock quote endpoint (GET /api/stock-quote/:ticker)
- [x] Implement historical chart data endpoint (GET /api/stock-chart/:ticker)
- [x] Add error handling and retry logic
- [x] Implement caching strategy for API responses
- [x] Write backend unit tests for sentiment service (11 tests passing)
- [ ] Write integration tests for API endpoints
- [x] Update frontend marketDataApi to use backend endpoints
- [ ] Test live data integration

### Portfolio Website Integration
- [x] Create portfolio data file with Phase 3 portfolios
- [x] Create RiskBasedPortfolios component
- [x] Add portfolio visualization charts (allocation pie charts)
- [x] Create portfolio comparison table
- [x] Add portfolio metrics cards (return, risk, yield)
- [x] Integrate portfolios into Home page tabs
- [x] Update stock cards with live price data
- [x] Test portfolio visualizations
- [x] Save Phase 4 checkpoint

## Completed Features

- [x] Phase 1: Architecture & Foundation
- [x] Phase 2: Sector Analysis & Validation (Enhanced with FAANG, space, quantum, clean energy exclusion)
- [x] Phase 3: Risk-Based Portfolio Generation (Conservative, Moderate, Aggressive)

## News Feed Implementation (In Progress)

### Backend News API
- [x] Create news API service in server/services/newsService.ts
- [x] Implement news endpoint (GET /api/news/:ticker)
- [x] Implement portfolio news endpoint (POST /api/news/portfolio)
- [x] Add caching strategy for news data (5 minute TTL)
- [x] Add error handling for news API

### Frontend News Feed
- [x] Create NewsFeed component with article cards
- [x] Add news filtering by stock ticker
- [x] Add news sorting by date (most recent first)
- [x] Create news article card with image, title, summary, source
- [x] Add "Read More" links to external articles

### Integration
- [x] Add news feed to Portfolio Dashboard
- [ ] Add news feed to individual stock cards
- [x] Test news feed with portfolio stocks
- [x] Save checkpoint with news feed feature

## Sentiment Analysis Implementation (In Progress)

### Backend Sentiment Service
- [x] Create sentiment analysis service using keyword-based NLP
- [x] Define positive/negative/neutral keywords for financial news
- [x] Implement sentiment scoring algorithm
- [x] Add sentiment field to NewsArticle interface
- [x] Integrate sentiment analysis into news fetching

### Frontend Sentiment Display
- [x] Add sentiment badges to news article cards
- [x] Add sentiment filtering in NewsFeed component
- [ ] Create sentiment distribution chart
- [x] Add color coding for sentiment (green=positive, red=negative, gray=neutral)

### Testing & Deployment
- [x] Test sentiment analysis accuracy
- [x] Save checkpoint with sentiment analysis feature

## Sentiment-Based Recommendation Engine (Current)

### Backend Sentiment Scoring
- [x] Create sentiment scoring service for stocks
- [x] Implement historical sentiment aggregation (7-day, 30-day averages)
- [x] Calculate sentiment momentum (improving vs declining sentiment)
- [x] Add sentiment score to stock recommendation algorithm
- [x] Weight stocks with positive sentiment higher in portfolios

### Portfolio Generation Updates
- [x] Update Conservative portfolio to favor stable positive sentiment
- [x] Update Moderate portfolio to balance sentiment with fundamentals
- [x] Update Aggressive portfolio to capture sentiment momentum
- [x] Add sentiment score field to stock data
- [x] Recalculate portfolio allocations with sentiment weighting

### Rebalancing Recommendations
- [x] Create sentiment-based rebalancing engine
- [x] Identify stocks with declining sentiment for reduction
- [x] Identify stocks with improving sentiment for increase
- [x] Generate rebalancing alerts and recommendations
- [x] Add rebalancing UI to portfolio dashboard

### UI Updates
- [x] Add sentiment score badges to stock cards
- [x] Create sentiment trend indicators (↑↓→)
- [x] Add sentiment impact explanation to recommendations
- [x] Show sentiment-adjusted expected returns
- [x] Add sentiment filter to stock comparison tool

### Testing & Deployment
- [x] Test sentiment scoring accuracy
- [x] Test portfolio generation with sentiment weights
- [x] Test rebalancing recommendations
- [x] Integrate SentimentPortfolioView into main page UI
- [x] Test Conservative, Moderate, and Aggressive portfolio tabs
- [x] Verify sentiment data display and rebalancing recommendations
- [x] Write and pass backend unit tests for sentiment service (11/11 passing)
- [x] Save checkpoint with sentiment-based recommendations

## Backend Testing & Deployment (Current)

### Backend Unit Tests
- [x] Write unit tests for Yahoo Finance service (yahooFinanceService.ts) - 14/14 passing
- [x] Write unit tests for news service (newsService.ts) - 14/14 passing
- [x] Test error handling and retry logic
- [x] Test caching behavior with mock data
- [x] Validate data transformation and parsing

### Integration Tests
- [x] Write integration tests for stock quote API endpoint - 21/21 passing
- [x] Write integration tests for historical chart API endpoint - included in stock API tests
- [ ] Write integration tests for news API endpoints
- [ ] Write integration tests for sentiment portfolio API
- [x] Test API error responses and status codes
- [x] Test API validation and edge cases

### Live Market Data Testing
- [x] Test live stock data fetching with real tickers (AAPL, GOOGL, MSFT, TSLA, NVDA) - 11/11 passing
- [x] Validate price accuracy and data structure
- [x] Test caching behavior with live API calls
- [x] Test error handling with invalid tickers
- [x] Verify historical data accuracy (1d, 5d, 1mo periods)
- [x] Test news API with sentiment analysis

### Deployment Documentation (Completed)
- [x] Create comprehensive Manus hosting deployment guide (DEPLOYMENT_MANUS.md)
- [x] Create AWS deployment reference guide with Terraform (DEPLOYMENT_AWS.md)
- [x] Document RDS PostgreSQL configuration
- [x] Document S3 and CloudFront CDN setup
- [x] Document ECS/Fargate service definitions
- [x] Document Application Load Balancer configuration
- [x] Document Route53 DNS setup
- [x] Document deployment process and best practices
- [x] Document environment variables configuration
- [x] Document CloudWatch logging and monitoring
- [x] Document cost comparison (AWS vs Manus)
- [x] Recommend Manus built-in hosting as preferred option

### Testing & Validation (Completed)
- [x] Run all unit tests - 39/39 passing (100%)
- [x] Run all integration tests - 21/21 passing (100%)
- [x] Run live market data tests - 11/11 passing (100%)
- [x] Total: 72 tests passing across 6 test files
- [x] Create testing summary documentation (TESTING_SUMMARY.md)
- [x] Create deployment documentation (DEPLOYMENT_MANUS.md, DEPLOYMENT_AWS.md)
- [ ] Create final checkpoint with all tests and deployment config

## Production Deployment & New Features

### Production Deployment
- [ ] Deploy to production via Manus Publish button
- [ ] Verify live site functionality
- [ ] Test all API endpoints in production
- [ ] Monitor analytics and performance

### User Watchlists Feature
- [ ] Design watchlist database schema (user_watchlists, watchlist_stocks)
- [ ] Create backend API for watchlist CRUD operations
- [ ] Implement add/remove stocks to watchlist
- [ ] Build watchlist UI component
- [ ] Add watchlist page/section to navigation
- [ ] Test watchlist functionality

### Price & Sentiment Alerts
- [ ] Design alerts database schema (user_alerts, alert_triggers)
- [ ] Create alert conditions (price above/below, sentiment change)
- [ ] Implement alert checking service (background job)
- [ ] Build alert configuration UI
- [ ] Add notification system (in-app notifications)
- [ ] Test alert triggering and notifications

### Historical Sentiment Charts
- [ ] Design sentiment history database schema (sentiment_history)
- [ ] Create background job to store daily sentiment snapshots
- [ ] Build API endpoint for historical sentiment data
- [ ] Implement time-series chart component (30/60/90 day views)
- [ ] Add sentiment trend indicators (improving/declining)
- [ ] Integrate charts into stock detail pages
- [ ] Test historical data collection and visualization

## Alerts Dashboard & Sentiment Charts

### Alerts Dashboard UI
- [x] Create Alerts page component with notification center
- [x] Build notification list with read/unread status
- [x] Add alert creation dialog
- [x] Build alert management interface (activate/deactivate/delete)
- [x] Add alert type selection (price above/below, sentiment positive/negative)
- [x] Integrate with alerts backend API
- [x] Add navigation from Home page

### Sentiment Trend Charts
- [x] Install and configure Recharts library
- [x] Create SentimentTrendChart component
- [x] Add 30/60/90 day period selector
- [x] Display sentiment score over time with area chart
- [x] Add trend indicators (improving/declining/stable)
- [x] Show confidence bands and article count
- [x] Integrate with sentiment history API
- [x] Add to watchlist stock detail view (expandable cards)

### Testing & Deployment
- [x] Test alerts dashboard functionality
- [x] Test sentiment chart data visualization
- [x] Verify API integration
- [ ] Create final checkpoint
- [ ] Deploy to production via Publish button

## Sentiment History Collection & Portfolio Performance

### Background Sentiment Collection
- [x] Create sentiment snapshot collection service
- [x] Build API endpoint for manual sentiment collection
- [x] Collect sentiment for stocks using news API
- [x] Store daily snapshots in sentiment_history table
- [x] Add error handling and retry logic
- [x] Create manual trigger endpoint (/api/sentiment-snapshots/collect/:ticker)
- [x] Fix database schema compatibility issues
- [x] Test sentiment collection with AAPL (successful)

### Portfolio Performance Tracking
- [x] Design portfolio performance database schema
- [x] Create portfolio snapshot table (daily holdings values)
- [x] Build performance calculation service (returns, volatility, Sharpe ratio)
- [x] Fetch S&P 500 benchmark data for comparison (using ^GSPC ticker)
- [x] Create API endpoints for performance data (6 endpoints)
- [x] Build performance dashboard UI with Recharts
- [x] Add historical return charts (1M, 3M, 6M, 1Y period selector)
- [x] Display risk metrics (volatility, max drawdown, Sharpe ratio)
- [x] Add benchmark comparison chart (portfolio vs S&P 500)
- [x] Test performance calculations with real data (snapshot recorded, benchmark fetched)

### Testing & Deployment
- [x] Test sentiment collection job (AAPL successful)
- [x] Test sentiment history API endpoint
- [x] Verify sentiment chart displays correctly with real data
- [x] Fix string-to-number parsing in frontend
- [x] Test portfolio performance dashboard with real data
- [x] Verify performance metrics calculation
- [x] Test S&P 500 benchmark comparison
- [ ] Create final checkpoint
- [ ] Deploy to production

## Portfolio Allocation Pie Chart

### Backend API
- [x] Create API endpoint to fetch portfolio allocation by stock
- [x] Calculate percentage allocation for each stock (equal weighting)
- [x] Group stocks by sector for sector allocation view
- [x] Return allocation data with values and percentages
- [x] Fix price fetching from Yahoo Finance API

### Frontend Visualization
- [x] Add pie chart component using Recharts
- [x] Display stock allocation pie chart
- [x] Display sector allocation pie chart
- [x] Add toggle to switch between stock and sector views
- [x] Show allocation percentages and values
- [x] Add allocation table with color indicators
- [x] Display total portfolio value

### Testing
- [x] Test allocation calculations with real portfolio data (AAPL)
- [x] Verify pie chart renders correctly
- [x] Test toggle between stock and sector views
- [ ] Create final checkpoint
