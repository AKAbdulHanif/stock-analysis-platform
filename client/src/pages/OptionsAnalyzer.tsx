import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Shield, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

interface PayoffPoint {
  stockPrice: number;
  profit: number;
}

interface CoveredCallResult {
  strategy: 'covered_call';
  stockPrice: number;
  strikePrice: number;
  premium: number;
  maxProfit: number;
  maxLoss: number;
  breakEven: number;
  returnIfCalled: number;
  returnIfExpires: number;
  greeks: Greeks;
  payoff: PayoffPoint[];
  daysToExpiry: number;
}

interface ProtectivePutResult {
  strategy: 'protective_put';
  stockPrice: number;
  strikePrice: number;
  premium: number;
  maxProfit: number;
  maxLoss: number;
  breakEven: number;
  protection: number;
  costOfProtection: number;
  greeks: Greeks;
  payoff: PayoffPoint[];
  daysToExpiry: number;
}

export default function OptionsAnalyzer() {
  const [, setLocation] = useLocation();
  const [strategy, setStrategy] = useState<'covered_call' | 'protective_put'>('covered_call');
  const [loading, setLoading] = useState(false);
  
  // Input parameters
  const [stockPrice, setStockPrice] = useState('100');
  const [strikePrice, setStrikePrice] = useState('105');
  const [daysToExpiry, setDaysToExpiry] = useState('30');
  const [volatility, setVolatility] = useState('0.30'); // 30% annualized
  const [riskFreeRate, setRiskFreeRate] = useState('0.045'); // 4.5%
  
  // Results
  const [coveredCallResult, setCoveredCallResult] = useState<CoveredCallResult | null>(null);
  const [protectivePutResult, setProtectivePutResult] = useState<ProtectivePutResult | null>(null);
  
  const handleCalculate = async () => {
    setLoading(true);
    
    try {
      const params = {
        stockPrice: parseFloat(stockPrice),
        strikePrice: parseFloat(strikePrice),
        daysToExpiry: parseInt(daysToExpiry),
        volatility: parseFloat(volatility),
        riskFreeRate: parseFloat(riskFreeRate)
      };
      
      // Validation
      if (isNaN(params.stockPrice) || isNaN(params.strikePrice) || isNaN(params.daysToExpiry) || isNaN(params.volatility)) {
        toast.error('Please enter valid numbers for all fields');
        return;
      }
      
      if (params.stockPrice <= 0 || params.strikePrice <= 0 || params.daysToExpiry <= 0 || params.volatility <= 0) {
        toast.error('All values must be positive numbers');
        return;
      }
      
      const endpoint = strategy === 'covered_call' ? '/api/options/covered-call' : '/api/options/protective-put';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error('Failed to calculate strategy');
      }
      
      const data = await response.json();
      
      if (strategy === 'covered_call') {
        setCoveredCallResult(data);
        setProtectivePutResult(null);
      } else {
        setProtectivePutResult(data);
        setCoveredCallResult(null);
      }
      
      toast.success('Strategy calculated successfully');
    } catch (error) {
      console.error('Options calculation error:', error);
      toast.error('Failed to calculate strategy');
    } finally {
      setLoading(false);
    }
  };
  
  const result = strategy === 'covered_call' ? coveredCallResult : protectivePutResult;
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/')}
                  className="text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </div>
              <h1 className="text-3xl font-bold">Options Strategy Analyzer</h1>
              <p className="text-slate-400 mt-1">Calculate premiums, Greeks, and risk/reward profiles</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-6">Strategy Parameters</h2>
              
              {/* Strategy Selector */}
              <div className="mb-6">
                <Label className="text-slate-300 mb-2 block">Strategy</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={strategy === 'covered_call' ? 'default' : 'outline'}
                    onClick={() => setStrategy('covered_call')}
                    className="w-full"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Covered Call
                  </Button>
                  <Button
                    variant={strategy === 'protective_put' ? 'default' : 'outline'}
                    onClick={() => setStrategy('protective_put')}
                    className="w-full"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Protective Put
                  </Button>
                </div>
              </div>
              
              {/* Stock Price */}
              <div className="mb-4">
                <Label htmlFor="stockPrice" className="text-slate-300 mb-2 block">
                  Current Stock Price ($)
                </Label>
                <Input
                  id="stockPrice"
                  type="number"
                  value={stockPrice}
                  onChange={(e) => setStockPrice(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  step="0.01"
                />
              </div>
              
              {/* Strike Price */}
              <div className="mb-4">
                <Label htmlFor="strikePrice" className="text-slate-300 mb-2 block">
                  Strike Price ($)
                </Label>
                <Input
                  id="strikePrice"
                  type="number"
                  value={strikePrice}
                  onChange={(e) => setStrikePrice(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  step="0.01"
                />
              </div>
              
              {/* Days to Expiry */}
              <div className="mb-4">
                <Label htmlFor="daysToExpiry" className="text-slate-300 mb-2 block">
                  Days to Expiration
                </Label>
                <Input
                  id="daysToExpiry"
                  type="number"
                  value={daysToExpiry}
                  onChange={(e) => setDaysToExpiry(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              {/* Volatility */}
              <div className="mb-4">
                <Label htmlFor="volatility" className="text-slate-300 mb-2 block">
                  Implied Volatility (annualized)
                </Label>
                <Input
                  id="volatility"
                  type="number"
                  value={volatility}
                  onChange={(e) => setVolatility(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  step="0.01"
                  placeholder="0.30 = 30%"
                />
                <p className="text-xs text-slate-400 mt-1">Example: 0.30 for 30% volatility</p>
              </div>
              
              {/* Risk-Free Rate */}
              <div className="mb-6">
                <Label htmlFor="riskFreeRate" className="text-slate-300 mb-2 block">
                  Risk-Free Rate (10-year Treasury)
                </Label>
                <Input
                  id="riskFreeRate"
                  type="number"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                  step="0.001"
                  placeholder="0.045 = 4.5%"
                />
                <p className="text-xs text-slate-400 mt-1">Example: 0.045 for 4.5%</p>
              </div>
              
              <Button
                onClick={handleCalculate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Calculating...' : 'Calculate Strategy'}
              </Button>
            </Card>
          </div>
          
          {/* Results Panel */}
          <div className="lg:col-span-2">
            {!result ? (
              <Card className="bg-slate-800 border-slate-700 p-12 text-center">
                <DollarSign className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No Results Yet</h3>
                <p className="text-slate-500">Enter parameters and click "Calculate Strategy" to see results</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="text-sm text-slate-400 mb-1">Premium</div>
                    <div className="text-2xl font-bold text-blue-400">
                      ${result.premium.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {strategy === 'covered_call' ? 'Received' : 'Paid'}
                    </div>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="text-sm text-slate-400 mb-1">Max Profit</div>
                    <div className="text-2xl font-bold text-emerald-400">
                      ${result.maxProfit.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {strategy === 'covered_call' 
                        ? `${((result as CoveredCallResult).returnIfCalled).toFixed(2)}%`
                        : 'Unlimited'}
                    </div>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="text-sm text-slate-400 mb-1">Max Loss</div>
                    <div className="text-2xl font-bold text-red-400">
                      ${Math.abs(result.maxLoss).toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {strategy === 'protective_put' && `${(result as ProtectivePutResult).protection.toFixed(1)}% protected`}
                    </div>
                  </Card>
                  
                  <Card className="bg-slate-800 border-slate-700 p-4">
                    <div className="text-sm text-slate-400 mb-1">Break-Even</div>
                    <div className="text-2xl font-bold text-amber-400">
                      ${result.breakEven.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Stock price
                    </div>
                  </Card>
                </div>
                
                {/* Tabs for detailed analysis */}
                <Tabs defaultValue="payoff" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
                    <TabsTrigger value="payoff">Payoff Diagram</TabsTrigger>
                    <TabsTrigger value="greeks">Greeks</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>
                  
                  {/* Payoff Diagram Tab */}
                  <TabsContent value="payoff">
                    <Card className="bg-slate-800 border-slate-700 p-6">
                      <h3 className="text-lg font-semibold mb-4">Profit/Loss at Expiration</h3>
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={result.payoff}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="stockPrice"
                            stroke="#94a3b8"
                            label={{ value: 'Stock Price ($)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            label={{ value: 'Profit/Loss ($)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                            labelStyle={{ color: '#cbd5e1' }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'P/L']}
                            labelFormatter={(value) => `Stock: $${parseFloat(value).toFixed(2)}`}
                          />
                          <Legend />
                          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                          <ReferenceLine
                            x={result.breakEven}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{ value: 'Break-Even', position: 'top', fill: '#f59e0b' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                            name="Strategy P/L"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Card>
                  </TabsContent>
                  
                  {/* Greeks Tab */}
                  <TabsContent value="greeks">
                    <Card className="bg-slate-800 border-slate-700 p-6">
                      <h3 className="text-lg font-semibold mb-4">Option Greeks</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Delta (Δ)</div>
                            <div className="text-2xl font-bold">{result.greeks.delta.toFixed(4)}</div>
                            <div className="text-xs text-slate-500 mt-2">
                              Price change per $1 stock move
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Gamma (Γ)</div>
                            <div className="text-2xl font-bold">{result.greeks.gamma.toFixed(4)}</div>
                            <div className="text-xs text-slate-500 mt-2">
                              Delta change per $1 stock move
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Theta (Θ)</div>
                            <div className="text-2xl font-bold">{result.greeks.theta.toFixed(4)}</div>
                            <div className="text-xs text-slate-500 mt-2">
                              Price change per day (time decay)
                            </div>
                          </div>
                          
                          <div className="bg-slate-700/50 p-4 rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">Vega (ν)</div>
                            <div className="text-2xl font-bold">{result.greeks.vega.toFixed(4)}</div>
                            <div className="text-xs text-slate-500 mt-2">
                              Price change per 1% volatility change
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                          <h4 className="text-sm font-semibold text-blue-400 mb-2">Greeks Interpretation</h4>
                          <ul className="text-sm text-slate-300 space-y-1">
                            <li>• <strong>Delta:</strong> {Math.abs(result.greeks.delta) > 0.5 ? 'High' : 'Low'} sensitivity to stock price changes</li>
                            <li>• <strong>Gamma:</strong> {Math.abs(result.greeks.gamma) > 0.01 ? 'Significant' : 'Minimal'} delta acceleration</li>
                            <li>• <strong>Theta:</strong> {result.greeks.theta < 0 ? 'Losing' : 'Gaining'} ${Math.abs(result.greeks.theta).toFixed(2)} per day</li>
                            <li>• <strong>Vega:</strong> {Math.abs(result.greeks.vega) > 0.1 ? 'High' : 'Low'} volatility exposure</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                  
                  {/* Details Tab */}
                  <TabsContent value="details">
                    <Card className="bg-slate-800 border-slate-700 p-6">
                      <h3 className="text-lg font-semibold mb-4">Strategy Details</h3>
                      <div className="space-y-4">
                        {strategy === 'covered_call' && coveredCallResult && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-sm text-slate-400 mb-1">Return if Called</div>
                                <div className="text-2xl font-bold text-emerald-400">
                                  {coveredCallResult.returnIfCalled.toFixed(2)}%
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                  If stock reaches strike price
                                </div>
                              </div>
                              
                              <div className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-sm text-slate-400 mb-1">Return if Expires</div>
                                <div className="text-2xl font-bold text-blue-400">
                                  {coveredCallResult.returnIfExpires.toFixed(2)}%
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                  If option expires worthless
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Strategy Overview</h4>
                              <p className="text-sm text-slate-300">
                                <strong>Covered Call:</strong> You own 100 shares at ${coveredCallResult.stockPrice.toFixed(2)} and sell a call option at ${coveredCallResult.strikePrice.toFixed(2)} strike, collecting ${coveredCallResult.premium.toFixed(2)} premium. This generates income but caps your upside at the strike price.
                              </p>
                            </div>
                          </>
                        )}
                        
                        {strategy === 'protective_put' && protectivePutResult && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-sm text-slate-400 mb-1">Downside Protection</div>
                                <div className="text-2xl font-bold text-blue-400">
                                  {protectivePutResult.protection.toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                  Protected below ${protectivePutResult.strikePrice.toFixed(2)}
                                </div>
                              </div>
                              
                              <div className="bg-slate-700/50 p-4 rounded-lg">
                                <div className="text-sm text-slate-400 mb-1">Cost of Protection</div>
                                <div className="text-2xl font-bold text-amber-400">
                                  {protectivePutResult.costOfProtection.toFixed(2)}%
                                </div>
                                <div className="text-xs text-slate-500 mt-2">
                                  Of stock value
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-blue-400 mb-2">Strategy Overview</h4>
                              <p className="text-sm text-slate-300">
                                <strong>Protective Put:</strong> You own 100 shares at ${protectivePutResult.stockPrice.toFixed(2)} and buy a put option at ${protectivePutResult.strikePrice.toFixed(2)} strike for ${protectivePutResult.premium.toFixed(2)}. This protects you from losses below the strike price, like insurance for your stock position.
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
