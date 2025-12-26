import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, BarChart3, Gem, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("overview");

  const stocks = [
    {
      ticker: "TSM",
      name: "Taiwan Semiconductor",
      sector: "Semiconductors",
      price: 298,
      target: "320-360",
      upside: "7-21%",
      thesis: "Foundry leader, 2nm capacity sold out, earnings growth likely to exceed 20%",
      pe: 20.66,
      growth: "+20%"
    },
    {
      ticker: "NVDA",
      name: "NVIDIA",
      sector: "Semiconductors",
      price: 188,
      target: "220-280",
      upside: "17-49%",
      thesis: "AI chip leader, $275B backlog, China market opening, 63% revenue growth",
      pe: 32,
      growth: "+63%"
    },
    {
      ticker: "AVGO",
      name: "Broadcom",
      sector: "Semiconductors",
      price: 340,
      target: "380-450",
      upside: "12-32%",
      thesis: "$73B AI backlog, 47% revenue growth, networking exposure",
      pe: 28,
      growth: "+47%"
    },
    {
      ticker: "ASML",
      name: "ASML",
      sector: "Semiconductors",
      price: 1065,
      target: "1150-1350",
      upside: "8-27%",
      thesis: "Equipment supplier to TSMC, beneficiary of chip capex cycle",
      pe: 35.95,
      growth: "+5%"
    },
    {
      ticker: "UNH",
      name: "UnitedHealth",
      sector: "Healthcare",
      price: 220,
      target: "280-350",
      upside: "27-59%",
      thesis: "Margin recovery, 35% decline priced in negatives, sector rotation",
      pe: 18,
      growth: "+15%"
    },
    {
      ticker: "JNJ",
      name: "Johnson & Johnson",
      sector: "Healthcare",
      price: 1071,
      target: "1150-1350",
      upside: "7-26%",
      thesis: "GLP-1 growth, aging population, dividend aristocrat",
      pe: 19.8,
      growth: "+18%"
    },
    {
      ticker: "ISRG",
      name: "Intuitive Surgical",
      sector: "Healthcare",
      price: 577,
      target: "600-700",
      upside: "4-21%",
      thesis: "Robotic surgery leader, secular growth, AI integration",
      pe: 73.9,
      growth: "+25%"
    },
    {
      ticker: "JPM",
      name: "JPMorgan",
      sector: "Financials",
      price: 317,
      target: "340-380",
      upside: "7-20%",
      thesis: "IB recovery, capital markets strength, pristine credit",
      pe: 12,
      growth: "+6%"
    },
    {
      ticker: "BAC",
      name: "Bank of America",
      sector: "Financials",
      price: 55,
      target: "58-68",
      upside: "5-24%",
      thesis: "Trading revenue growth, IB recovery, resilient consumer",
      pe: 10.5,
      growth: "+5%"
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Investment Outlook 2026</h1>
              <p className="text-slate-400">Deep Research & Stock Recommendations</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">December 26, 2025</p>
              <p className="text-sm text-slate-500">By Manus AI</p>
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

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border border-slate-700">
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
          <TabsContent value="stocks" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {stocks.map((stock) => (
                <Card key={stock.ticker} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{stock.ticker}</h3>
                          <span className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded">
                            {stock.sector}
                          </span>
                        </div>
                        <p className="text-slate-400">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">${stock.price}</div>
                        <div className="text-sm text-slate-400">Current Price</div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-sm mb-4">{stock.thesis}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-slate-700/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-1">Target</div>
                        <div className="text-sm font-semibold text-white">${stock.target}</div>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-1">Upside</div>
                        <div className="text-sm font-semibold text-emerald-400">{stock.upside}</div>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-1">P/E Ratio</div>
                        <div className="text-sm font-semibold text-white">{stock.pe}x</div>
                      </div>
                      <div className="bg-slate-700/50 p-3 rounded">
                        <div className="text-xs text-slate-400 mb-1">Growth</div>
                        <div className="text-sm font-semibold text-blue-400">{stock.growth}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
