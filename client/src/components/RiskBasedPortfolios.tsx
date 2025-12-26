/**
 * Risk-Based Portfolios Component
 * 
 * Displays the three portfolio strategies (Conservative, Moderate, Aggressive)
 * with sector allocations, stock holdings, and performance metrics.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Shield, 
  Target, 
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Info
} from 'lucide-react';
import { ALL_PORTFOLIOS, Portfolio, PortfolioStock } from '@/data/portfolios';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SECTOR_COLORS = {
  Healthcare: '#10b981', // emerald-500
  Semiconductors: '#3b82f6', // blue-500
  Financials: '#f59e0b', // amber-500
};

const RISK_COLORS = {
  Conservative: '#10b981',
  Moderate: '#f59e0b',
  Aggressive: '#ef4444',
};

export default function RiskBasedPortfolios() {
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('moderate');
  const portfolio = ALL_PORTFOLIOS.find(p => p.id === selectedPortfolio) || ALL_PORTFOLIOS[1];

  return (
    <div className="space-y-6">
      {/* Portfolio Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ALL_PORTFOLIOS.map((p) => (
          <Card 
            key={p.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPortfolio === p.id ? 'ring-2 ring-emerald-500 shadow-lg' : ''
            }`}
            onClick={() => setSelectedPortfolio(p.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <Badge 
                  variant="outline" 
                  style={{ 
                    borderColor: RISK_COLORS[p.riskLevel],
                    color: RISK_COLORS[p.riskLevel]
                  }}
                >
                  {p.riskLevel}
                </Badge>
              </div>
              <CardDescription className="text-sm">{p.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Target Return:</span>
                <span className="font-semibold text-emerald-600">{p.targetReturn}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Max Drawdown:</span>
                <span className="font-semibold text-red-600">{p.maxDrawdown}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg P/E:</span>
                <span className="font-semibold">{p.avgPE}x</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Dividend Yield:</span>
                <span className="font-semibold">{p.avgDividendYield}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Portfolio Details */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="holdings">Holdings</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="profile">Investor Profile</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Metrics</CardTitle>
              <CardDescription>Key performance indicators and risk metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Target Return</span>
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">{portfolio.targetReturn}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm">Max Drawdown</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{portfolio.maxDrawdown}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BarChart3 className="h-4 w-4" />
                    <span className="text-sm">Avg P/E Ratio</span>
                  </div>
                  <div className="text-2xl font-bold">{portfolio.avgPE}x</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Dividend Yield</span>
                  </div>
                  <div className="text-2xl font-bold">{portfolio.avgDividendYield}%</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sector Allocation Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sector Allocation</CardTitle>
                <CardDescription>Portfolio distribution by sector</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(portfolio.sectorAllocation).map(([sector, value]) => ({
                        name: sector,
                        value,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.keys(portfolio.sectorAllocation).map((sector) => (
                        <Cell key={sector} fill={SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Stock Count by Sector */}
            <Card>
              <CardHeader>
                <CardTitle>Holdings by Sector</CardTitle>
                <CardDescription>Number of stocks and total allocation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(portfolio.sectorAllocation).map(([sector, allocation]) => {
                      const stockCount = portfolio.stocks.filter(s => s.sector === sector).length;
                      return {
                        sector,
                        allocation,
                        stocks: stockCount,
                      };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="allocation" fill="#8884d8" name="Allocation %" />
                    <Bar yAxisId="right" dataKey="stocks" fill="#82ca9d" name="# of Stocks" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Holdings Tab */}
        <TabsContent value="holdings" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {portfolio.stocks.map((stock) => (
              <StockCard key={stock.ticker} stock={stock} />
            ))}
          </div>
        </TabsContent>

        {/* Allocation Tab */}
        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Allocation</CardTitle>
              <CardDescription>Individual stock allocations and target prices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.stocks.map((stock) => (
                  <div key={stock.ticker} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{stock.ticker}</Badge>
                        <span className="font-medium">{stock.name}</span>
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${SECTOR_COLORS[stock.sector]}20`,
                            color: SECTOR_COLORS[stock.sector]
                          }}
                        >
                          {stock.sector}
                        </Badge>
                      </div>
                      <span className="font-semibold">{stock.allocation}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${stock.allocation}%`,
                          backgroundColor: SECTOR_COLORS[stock.sector]
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Current: ${stock.currentPrice.toFixed(2)}</span>
                      <span>Target: ${stock.targetPriceLow.toFixed(0)} - ${stock.targetPriceHigh.toFixed(0)}</span>
                      <span className="text-emerald-600">
                        Upside: {(((stock.targetPriceLow + stock.targetPriceHigh) / 2 / stock.currentPrice - 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investor Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Investor Profile</CardTitle>
              <CardDescription>Recommended investor characteristics for this portfolio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold">Age Range</span>
                </div>
                <p className="text-muted-foreground">{portfolio.investorProfile.ageRange}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold">Investment Horizon</span>
                </div>
                <p className="text-muted-foreground">{portfolio.investorProfile.investmentHorizon}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span className="font-semibold">Risk Tolerance</span>
                </div>
                <p className="text-muted-foreground">{portfolio.investorProfile.riskTolerance}</p>
              </div>
              <div className="pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <span className="font-semibold">Implementation Strategy</span>
                    <p className="text-sm text-muted-foreground">
                      {portfolio.riskLevel === 'Conservative' && 
                        'Implement over 4-6 weeks using dollar-cost averaging. Prioritize dividend-paying stocks first (JNJ, ABBV, JPM). Consider selling cash-secured puts to generate income while waiting for entry.'}
                      {portfolio.riskLevel === 'Moderate' && 
                        'Implement over 3-4 weeks using strategic entry points. Build core positions (TSM, JPM, UNH) immediately. Scale into growth positions (LLY, MU, GS) on weakness using limit orders.'}
                      {portfolio.riskLevel === 'Aggressive' && 
                        'Implement over 2-3 weeks to capture momentum. Establish NVDA and MU positions quickly given supply constraints. Build GS and MS positions ahead of capital markets recovery. Accept higher entry prices for highest-conviction names.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Stock Card Component
function StockCard({ stock }: { stock: PortfolioStock }) {
  const upside = (((stock.targetPriceLow + stock.targetPriceHigh) / 2 / stock.currentPrice - 1) * 100).toFixed(1);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{stock.ticker}</CardTitle>
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: `${SECTOR_COLORS[stock.sector]}20`,
                  color: SECTOR_COLORS[stock.sector]
                }}
              >
                {stock.sector}
              </Badge>
            </div>
            <CardDescription>{stock.name}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stock.allocation}%</div>
            <div className="text-sm text-muted-foreground">Allocation</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price and Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Current Price</div>
            <div className="text-lg font-semibold">${stock.currentPrice.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Target Range</div>
            <div className="text-lg font-semibold">${stock.targetPriceLow} - ${stock.targetPriceHigh}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Upside Potential</div>
            <div className="text-lg font-semibold text-emerald-600">+{upside}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">P/E Ratio</div>
            <div className="text-lg font-semibold">{stock.peRatio}x</div>
          </div>
        </div>

        {/* Dividend Yield */}
        {stock.dividendYield > 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium">Dividend Yield: {stock.dividendYield}%</span>
          </div>
        )}

        {/* Investment Thesis */}
        <div className="space-y-2">
          <div className="font-semibold text-sm">Investment Thesis</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{stock.thesis}</p>
        </div>
      </CardContent>
    </Card>
  );
}
