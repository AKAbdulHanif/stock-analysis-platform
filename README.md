# 📈 Stock Analysis Platform

> **2026 Investment Outlook & Stock Analysis Platform** - A comprehensive financial analysis tool built with React, TypeScript, and Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8.svg)](https://tailwindcss.com/)

A modern, accessible, and feature-rich stock analysis platform designed for investors seeking deep market insights. Built with cutting-edge technologies and best practices for performance, accessibility, and user experience.

---

## ✨ Features

### 📊 Core Analysis Tools
- **Real-time Stock Data** - Live quotes, price changes, volume, and market cap
- **Interactive Charts** - Line and candlestick charts with multiple time periods (1D, 5D, 1M, 3M, 6M, 1Y)
- **Stock Comparison** - Side-by-side analysis of multiple stocks with synchronized charts
- **Sentiment Analysis** - AI-powered sentiment tracking with trend visualization
- **Technical Indicators** - RSI, MACD, Bollinger Bands, and moving averages
- **News Feed** - Real-time financial news aggregation
- **Economic Calendar** - Track important market events and earnings dates
- **Insider Trading Tracker** - Monitor insider transactions and institutional activity

### 🎯 Advanced Features
- **Portfolio Builder** - Create and manage investment portfolios
- **Watchlists** - Track your favorite stocks with custom alerts
- **Stock Screener** - Filter stocks by custom criteria
- **Sector Analysis** - Compare performance across market sectors
- **Backtesting** - Test investment strategies with historical data
- **Monte Carlo Simulation** - Risk analysis and probability modeling
- **Tax-Loss Harvesting** - Optimize tax efficiency
- **Options Analyzer** - Options pricing and strategy analysis

### ♿ Accessibility & UX
- **WCAG 2.1 AA Compliant** - Semantic HTML, ARIA attributes, keyboard navigation
- **Skip Links** - Quick navigation for keyboard users
- **Screen Reader Support** - Proper labels and descriptions
- **Error Boundaries** - Graceful error handling with user-friendly fallback UI
- **Responsive Design** - Mobile-first approach with breakpoints for all devices

### 🎨 Design & Performance
- **Modern UI** - Clean, professional interface with Tailwind CSS 4
- **shadcn/ui Components** - High-quality, accessible component library
- **Dark Theme** - Eye-friendly color scheme optimized for extended use
- **Code Splitting** - Lazy loading for optimal performance
- **Optimized Charts** - Recharts with smooth animations and interactions

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (recommended) or npm/yarn
- **PostgreSQL** 14.x or higher (for database features)
- **Redis** (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AKAbdulHanif/stock-analysis-platform.git
   cd stock-analysis-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/stock_analysis
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this
   
   # OAuth (if using authentication)
   OAUTH_SERVER_URL=https://your-oauth-server.com
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # API Keys (if needed)
   STOCK_API_KEY=your-stock-api-key
   ```

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
stock-analysis-platform/
├── client/                 # Frontend React application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── StockSearch.tsx
│   │   │   └── ...
│   │   ├── pages/        # Page components
│   │   │   ├── Home.tsx
│   │   │   ├── StockDetail.tsx
│   │   │   ├── StockComparison.tsx
│   │   │   └── ...
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── App.tsx       # Main app component
│   │   ├── main.tsx      # Entry point
│   │   └── index.css     # Global styles
│   └── index.html        # HTML template
├── server/                # Backend Node.js/Express server
│   ├── _core/            # Core server setup
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── db/               # Database schemas (Drizzle ORM)
│   └── index.ts          # Server entry point
├── shared/                # Shared types and constants
│   └── const.ts
├── docs/                  # Documentation
│   ├── ACCESSIBILITY_AUDIT_REPORT.md
│   ├── BROWSER_COMPATIBILITY_REPORT.md
│   ├── EDGE_CASE_TESTING.md
│   └── PRODUCTION_TESTING_CHECKLIST.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start development server (client + server)
pnpm dev:client       # Start only client dev server
pnpm dev:server       # Start only backend server

# Database
pnpm db:push          # Push schema changes to database
pnpm db:studio        # Open Drizzle Studio (database GUI)

# Build
pnpm build            # Build for production
pnpm preview          # Preview production build locally

# Testing
pnpm test             # Run tests
pnpm test:watch       # Run tests in watch mode

# Linting & Formatting
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier

# Type Checking
pnpm type-check       # Run TypeScript compiler check
```

---

## 🌐 Deployment

### Deploy to Manus (Recommended)

The platform is optimized for deployment on **Manus**, which provides built-in hosting with custom domain support:

1. **Create a checkpoint** in the Manus UI
2. **Click the Publish button** in the Management UI header
3. **Configure your domain** in Settings → Domains
4. Your app is live! 🎉

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```

**Environment Variables:** Add all `.env` variables in the Vercel dashboard under Settings → Environment Variables.

### Deploy to Railway

1. **Connect your GitHub repository** to Railway
2. **Add environment variables** in the Railway dashboard
3. **Deploy** - Railway will automatically detect and build your app

### Deploy to Docker

```bash
# Build Docker image
docker build -t stock-analysis-platform .

# Run container
docker run -p 3000:3000 --env-file .env stock-analysis-platform
```

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

---

## 🔧 Configuration

### Tailwind CSS Customization

Edit `client/src/index.css` to customize the design system:

```css
@theme {
  --color-primary: oklch(0.6 0.2 250);
  --color-secondary: oklch(0.5 0.15 180);
  /* Add your custom colors */
}
```

### API Endpoints

The backend server runs on port `3001` by default. API routes are defined in `server/routes/`:

- `GET /api/stock/:ticker` - Get stock quote
- `GET /api/stock/:ticker/chart` - Get historical chart data
- `POST /api/compare` - Compare multiple stocks
- `GET /api/news/:ticker` - Get stock news
- And more...

### Database Schema

Database schemas are defined using **Drizzle ORM** in `server/db/schema.ts`. To modify the schema:

1. Edit `schema.ts`
2. Run `pnpm db:push` to apply changes
3. Migrations are automatically generated

---

## 📚 Documentation

- **[Accessibility Audit Report](./ACCESSIBILITY_AUDIT_REPORT.md)** - WCAG compliance analysis
- **[Browser Compatibility Report](./BROWSER_COMPATIBILITY_REPORT.md)** - Cross-browser testing results
- **[Edge Case Testing](./EDGE_CASE_TESTING.md)** - Edge case test findings
- **[Production Testing Checklist](./PRODUCTION_TESTING_CHECKLIST.md)** - Comprehensive QA checklist

---

## 🧪 Testing

### Manual Testing

Refer to `PRODUCTION_TESTING_CHECKLIST.md` for a comprehensive list of test cases covering:
- Functional testing (search, comparison, charts)
- Accessibility testing (keyboard navigation, screen readers)
- Performance testing (load times, responsiveness)
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile testing (iOS, Android)

### Automated Testing

```bash
# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests (if configured)
pnpm test:e2e
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 🐛 Known Issues

- **Market Cap displays $0.00B** - API limitation, working on alternative data source
- **TypeScript errors in server services** - Non-blocking, does not affect functionality
- **Redis connection warnings** - Optional feature, app works without Redis

See `EDGE_CASE_TESTING.md` for detailed bug reports and workarounds.

---

## 🔐 Security

- **Environment Variables** - Never commit `.env` files
- **API Keys** - Store securely and rotate regularly
- **Authentication** - OAuth integration for secure user login
- **Database** - Use parameterized queries to prevent SQL injection
- **HTTPS** - Always use HTTPS in production

Report security vulnerabilities to: [security@yourproject.com]

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible component library
- **[Recharts](https://recharts.org/)** - Composable charting library
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Drizzle ORM](https://orm.drizzle.team/)** - TypeScript ORM
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon set
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

---

## 📞 Support

- **Documentation:** [GitHub Wiki](https://github.com/AKAbdulHanif/stock-analysis-platform/wiki)
- **Issues:** [GitHub Issues](https://github.com/AKAbdulHanif/stock-analysis-platform/issues)
- **Discussions:** [GitHub Discussions](https://github.com/AKAbdulHanif/stock-analysis-platform/discussions)

---

## 🗺️ Roadmap

### Q1 2026
- [ ] Add real-time WebSocket support for live price updates
- [ ] Implement portfolio performance tracking
- [ ] Add export functionality (PDF reports, CSV data)

### Q2 2026
- [ ] Mobile app (React Native)
- [ ] Advanced charting tools (drawing tools, indicators)
- [ ] Social features (share analysis, follow users)

### Q3 2026
- [ ] AI-powered stock recommendations
- [ ] Automated trading integration
- [ ] Multi-currency support

---

<div align="center">

**Built with ❤️ by [Abdul Hanif](https://github.com/AKAbdulHanif)**

⭐ Star this repo if you find it helpful!

</div>
