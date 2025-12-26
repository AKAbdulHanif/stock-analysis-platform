# Investment Outlook 2026 - TODO

## Phase 4: Backend API Integration & Portfolio Website Integration (In Progress)

### Backend API Implementation
- [x] Create Yahoo Finance API service in server/services/
- [x] Implement stock quote endpoint (GET /api/stock-quote/:ticker)
- [x] Implement historical chart data endpoint (GET /api/stock-chart/:ticker)
- [x] Add error handling and retry logic
- [x] Implement caching strategy for API responses
- [ ] Write backend unit tests for API services
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
- [ ] Add rebalancing UI to portfolio dashboard

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
- [x] Save checkpoint with sentiment-based recommendations
