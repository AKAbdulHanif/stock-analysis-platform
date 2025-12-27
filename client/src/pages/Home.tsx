import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Gem, DollarSign, ArrowUpRight, ArrowDownRight, Star, Bell, GitCompare, Activity, Sparkles, TrendingDown, Calculator, Filter, Grid3x3 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import StockComparison from "@/components/StockComparison";
import PriceUpdateIndicator from "@/components/PriceUpdateIndicator";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import PortfolioDashboard from "@/components/PortfolioDashboard";
import RiskBasedPortfolios from "@/components/RiskBasedPortfolios";
import SentimentPortfolioView from "@/components/SentimentPortfolioView";
import { SentimentDistributionChart } from "@/components/SentimentDistributionChart";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");

  // Stock data removed - now in StockComparison component

  const sectors = [
    {
      name: "Semiconductors",
      growth: "+26.3%",
      description: "Industry approaching $1 trillion revenue milestone with AI infrastructure buildout driving demand",
      stocks: ["TSM", "NVDA", "AVGO", "ASML"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      name: "Healthcare",
      growth: "+13%",
      description: "Sector rotation from tech with strong earnings beat rate and aging population tailwinds",
      stocks: ["UNH", "JNJ", "ISRG"],
      color: "from-emerald-500 to-teal-500"
    },
    {
      name: "Financials",
      growth: "+6.2%",
      description: "Investment banking recovery and yield curve steepening benefiting major banks",
      stocks: ["JPM", "BAC"],
      color: "from-amber-500 to-orange-500"
    }
  ];

  const metals = [
    {
      name: "Gold",
      current: "$4,400",
      target: "$4,500-$4,700",
      upside: "2-7%",
      thesis: "Central bank demand, declining real yields, geopolitical uncertainty",
      performance: "+54% (2025)"
    },
    {
      name: "Silver",
      current: "$67",
      target: "$65-$88",
      upside: "0-31%",
      thesis: "5th year of supply deficit, industrial demand acceleration, price discovery phase",
      performance: "+120% (2025)"
    }
  ];

   return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      <PriceUpdateIndicator />
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Investment Outlook 2026</h1>
              <p className="text-slate-400">Deep Research & Stock Recommendations</p>
            </div>
            <div className="flex items-center gap-4">
          <Link href="/compare">
            <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
              <TrendingUp className="mr-2 h-4 w-4" />
              Compare Stocks
            </Button>
          </Link>
          <Link href="/backtest">
            <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
              <Activity className="mr-2 h-4 w-4" />
              Backtest Strategy
            </Button>
          </Link>
          <Link href="/monte-carlo">
            <Button variant="outline" className="border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10">
              <Sparkles className="mr-2 h-4 w-4" />
              Monte Carlo
            </Button>
          </Link>
          <Link href="/tax-loss-harvesting">
            <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              <TrendingDown className="mr-2 h-4 w-4" />
              Tax-Loss Harvesting
            </Button>
          </Link>
            <Link href="/options">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calculator className="w-4 h-4" />
                Options Analyzer
              </Button>
            </Link>
            <Link href="/screener">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Filter className="w-4 h-4" />
                Stock Screener
              </Button>
            </Link>
            <Link href="/sector-rotation">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Grid3x3 className="w-4 h-4" />
                Sector Rotation
              </Button>
            </Link>
              <Link href="/watchlists">
                <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <Star className="mr-2 h-4 w-4" />
                  My Watchlists
                </Button>
              </Link>
              <Link href="/alerts">
                <Button variant="outline" className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600">
                  <Bell className="mr-2 h-4 w-4" />
                  Alerts
                </Button>
              </Link>
              <div className="text-right">
                <p className="text-sm text-slate-500">December 26, 2025</p>
                <p className="text-sm text-slate-500">By Manus AI</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Executive Summary */}
        <Card className="mb-12 bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600/50">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-400" />
              Executive Summary
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              The global financial markets are at a pivotal juncture as we head into 2026. While concerns about an AI-driven technology bubble, stretched valuations, and geopolitical uncertainty persist, our comprehensive research indicates significant opportunities for discerning investors. We recommend a strategic rotation away from high-flying tech stocks toward more value-oriented sectors with strong fundamentals.
            </p>
            <p className="text-slate-300 leading-relaxed">
              We have identified <span className="text-emerald-400 font-semibold">Semiconductors, Healthcare, and Financials</span> as the three most promising sectors for 2026, each with compelling catalysts and attractive entry points. We also see continued strength in precious metals, particularly silver.
            </p>
          </div>
        </Card>

        {/* Performance Dashboard Button */}
        <div className="mb-8 bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-2">Portfolio Performance Analytics</h3>
              <p className="text-slate-400 text-sm">Track your returns and compare against the S&P 500</p>
            </div>
            <Link href="/performance">
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Performance Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-7 bg-slate-800 border border-slate-700">
            <TabsTrigger value="portfolio" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="risk-portfolios" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Risk Portfolios
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Sentiment Analysis
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="sectors" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Sectors
            </TabsTrigger>
            <TabsTrigger value="stocks" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Stock Picks
            </TabsTrigger>
            <TabsTrigger value="metals" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
              Precious Metals
            </TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioDashboard />
          </TabsContent>

          {/* Risk Portfolios Tab */}
          <TabsContent value="risk-portfolios" className="space-y-6">
            <RiskBasedPortfolios />
          </TabsContent>

          {/* Sentiment Analysis Tab */}
          <TabsContent value="sentiment" className="space-y-6">
            <div className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">Sentiment-Adjusted Portfolios</h3>
                  <p className="text-slate-400">
                    View portfolio recommendations adjusted based on real-time news sentiment analysis.
                    Allocations are dynamically weighted to favor stocks with positive sentiment momentum.
                  </p>
                </div>
              </Card>
              
              <SentimentDistributionChart tickers={["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "JPM", "UNH", "JNJ"]} />
              
              <Tabs defaultValue="moderate" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                  <TabsTrigger value="conservative">Conservative</TabsTrigger>
                  <TabsTrigger value="moderate">Moderate</TabsTrigger>
                  <TabsTrigger value="aggressive">Aggressive</TabsTrigger>
                </TabsList>
                
                <TabsContent value="conservative">
                  <SentimentPortfolioView portfolioId="conservative" />
                </TabsContent>
                
                <TabsContent value="moderate">
                  <SentimentPortfolioView portfolioId="moderate" />
                </TabsContent>
                
                <TabsContent value="aggressive">
                  <SentimentPortfolioView portfolioId="aggressive" />
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <DollarSign className="text-blue-400" size={20} />
                    Macroeconomic Outlook
                  </h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• US GDP Growth: 2.25%</li>
                    <li>• Core Inflation: 2.6%</li>
                    <li>• Unemployment: 4.2%</li>
                    <li>• Policy Rate: 3.5%</li>
                    <li>• Euro Area Growth: 1.2%</li>
                    <li>• China Growth: 4.5%</li>
                  </ul>
                </div>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="text-amber-400" size={20} />
                    Key Themes
                  </h3>
                  <ul className="space-y-2 text-slate-300 text-sm">
                    <li>• AI Bubble: Economic upside, market downside</li>
                    <li>• Sector Rotation: Tech to Value/Defensive</li>
                    <li>• Valuations: Elevated but stabilizing</li>
                    <li>• EM Strength: 30%+ gains in 2025</li>
                    <li>• Energy Headwinds: Supply-driven downtrend</li>
                    <li>• Geopolitical: Fragmentation persists</li>
                  </ul>
                </div>
              </Card>
            </div>

            <Card className="bg-slate-800 border-slate-700">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">The AI Bubble: Exuberance vs. Reality</h3>
                <p className="text-slate-300 leading-relaxed">
                  While AI will undoubtedly boost productivity and create new revenue pools, the near-term returns for many current market leaders may be limited. Vanguard's analysis suggests "economic upside, stock market downside" - meaning the transformative benefits of AI are real, but current valuations may not reflect the risks. We believe a more discerning approach is warranted, focusing on the enablers and adopters of AI technology rather than the most speculative names.
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Sectors Tab */}
          <TabsContent value="sectors" className="space-y-6">
            {sectors.map((sector) => (
              <Card key={sector.name} className="bg-slate-800 border-slate-700 overflow-hidden">
                <div className={`h-1 bg-gradient-to-r ${sector.color}`}></div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{sector.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{sector.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-400">{sector.growth}</div>
                      <div className="text-xs text-slate-400">2026 Growth</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {sector.stocks.map((ticker) => (
                      <span key={ticker} className="px-3 py-1 bg-slate-700 text-slate-200 text-sm rounded-full">
                        {ticker}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Stocks Tab */}
          <TabsContent value="stocks" className="space-y-6">
            <StockComparison />
          </TabsContent>

          {/* Metals Tab */}
          <TabsContent value="metals" className="space-y-6">
            <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600/50">
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <Gem className="text-yellow-400" size={24} />
                  Precious Metals Outlook
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  We are bullish on the precious metals complex for 2026, with particular emphasis on silver. Gold has already had a strong run, but we see further upside as central banks continue to diversify their reserves. However, the most compelling opportunity is silver, which is benefiting from a powerful combination of structural supply deficits and accelerating industrial demand.
                </p>
              </div>
            </Card>

            {metals.map((metal) => (
              <Card key={metal.name} className="bg-slate-800 border-slate-700">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{metal.name}</h3>
                      <p className="text-slate-400 text-sm mt-1">{metal.thesis}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-yellow-400">{metal.current}</div>
                      <div className="text-xs text-slate-400">Current Price</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 p-3 rounded">
                      <div className="text-xs text-slate-400 mb-1">2026 Target</div>
                      <div className="text-sm font-semibold text-white">{metal.target}</div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded">
                      <div className="text-xs text-slate-400 mb-1">Upside</div>
                      <div className="text-sm font-semibold text-emerald-400">{metal.upside}</div>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded">
                      <div className="text-xs text-slate-400 mb-1">2025 Performance</div>
                      <div className="text-sm font-semibold text-blue-400">{metal.performance}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Key Takeaways */}
        <Card className="bg-slate-800 border-slate-700 mb-12">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Key Takeaways for 2026</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/20">
                    <ArrowUpRight className="text-emerald-400" size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Sector Rotation</h3>
                  <p className="text-slate-400 text-sm">Move from crowded tech to value-oriented semiconductors, healthcare, and financials</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-500/20">
                    <TrendingUp className="text-blue-400" size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Quality Over Growth</h3>
                  <p className="text-slate-400 text-sm">Focus on strong fundamentals, reasonable valuations, and secular growth trends</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500/20">
                    <Gem className="text-amber-400" size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Precious Metals</h3>
                  <p className="text-slate-400 text-sm">Gold consolidation with upside; silver entering price discovery phase</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500/20">
                    <BarChart3 className="text-purple-400" size={20} />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Valuation Discipline</h3>
                  <p className="text-slate-400 text-sm">Avoid stretched valuations; seek opportunities with 15-25% upside potential</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-400 mb-6">
            This analysis is based on comprehensive market research as of December 26, 2025. <br/>
            Always consult with a financial advisor before making investment decisions.
          </p>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg">
            Download Full Report
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-16">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-slate-400 text-sm">© 2025 Manus AI. Investment Analysis Report.</p>
            <p className="text-slate-500 text-xs mt-4 md:mt-0">
              Disclaimer: This report is for informational purposes only and should not be considered investment advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
