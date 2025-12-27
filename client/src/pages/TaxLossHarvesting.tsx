import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingDown, Plus, Trash2, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Holding {
  ticker: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
}

interface LossPosition {
  ticker: string;
  shares: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  unrealizedLoss: number;
  lossPercentage: number;
  holdingPeriod: number;
  isLongTerm: boolean;
  taxRate: number;
  taxSavings: number;
  washSaleRisk: boolean;
}

interface ReplacementSuggestion {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  correlation: number;
  reason: string;
}

interface TaxLossResult {
  losingPositions: LossPosition[];
  replacementSuggestions: Record<string, ReplacementSuggestion[]>;
  totalTaxSavings: number;
  totalUnrealizedLoss: number;
  summary: {
    totalPositions: number;
    losingPositions: number;
    shortTermLosses: number;
    longTermLosses: number;
    washSaleWarnings: number;
  };
}

export default function TaxLossHarvesting() {
  const [holdings, setHoldings] = useState<Holding[]>([
    { ticker: 'AAPL', shares: 100, purchasePrice: 180, purchaseDate: '2024-01-15' },
    { ticker: 'NVDA', shares: 50, purchasePrice: 500, purchaseDate: '2023-06-20' },
    { ticker: 'TSM', shares: 75, purchasePrice: 110, purchaseDate: '2024-03-10' },
  ]);
  const [result, setResult] = useState<TaxLossResult | null>(null);
  const [loading, setLoading] = useState(false);

  const addHolding = () => {
    setHoldings([...holdings, { ticker: '', shares: 0, purchasePrice: 0, purchaseDate: '' }]);
  };

  const removeHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const updateHolding = (index: number, field: keyof Holding, value: string | number) => {
    const newHoldings = [...holdings];
    newHoldings[index] = { ...newHoldings[index], [field]: value };
    setHoldings(newHoldings);
  };

  const analyzeTaxLoss = async () => {
    // Validate holdings
    const validHoldings = holdings.filter(
      (h) => h.ticker && h.shares > 0 && h.purchasePrice > 0 && h.purchaseDate
    );

    if (validHoldings.length === 0) {
      toast.error('Please add at least one valid holding');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/tax-loss-harvesting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holdings: validHoldings }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze tax-loss harvesting');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Tax-loss harvesting error:', error);
      toast.error('Failed to analyze holdings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingDown className="w-10 h-10 text-red-400" />
            Tax-Loss Harvesting Optimizer
          </h1>
          <p className="text-slate-300">
            Identify losing positions and find replacement securities to maximize tax savings while maintaining portfolio allocation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Holdings Input */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Portfolio Holdings</h2>
            
            <div className="space-y-4 mb-6">
              {holdings.map((holding, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 items-end">
                  <div>
                    <Label className="text-slate-300">Ticker</Label>
                    <Input
                      value={holding.ticker}
                      onChange={(e) => updateHolding(index, 'ticker', e.target.value.toUpperCase())}
                      placeholder="AAPL"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Shares</Label>
                    <Input
                      type="number"
                      value={holding.shares || ''}
                      onChange={(e) => updateHolding(index, 'shares', parseFloat(e.target.value) || 0)}
                      placeholder="100"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Purchase Price</Label>
                    <Input
                      type="number"
                      value={holding.purchasePrice || ''}
                      onChange={(e) => updateHolding(index, 'purchasePrice', parseFloat(e.target.value) || 0)}
                      placeholder="180.00"
                      step="0.01"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Purchase Date</Label>
                    <Input
                      type="date"
                      value={holding.purchaseDate}
                      onChange={(e) => updateHolding(index, 'purchaseDate', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => removeHolding(index)}
                    className="bg-red-900/20 border-red-700 hover:bg-red-900/40"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={addHolding}
                variant="outline"
                className="flex-1 bg-blue-900/20 border-blue-700 hover:bg-blue-900/40 text-blue-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Holding
              </Button>
              <Button
                onClick={analyzeTaxLoss}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
              >
                {loading ? 'Analyzing...' : 'Analyze Tax-Loss Opportunities'}
              </Button>
            </div>
          </Card>

          {/* Right Panel - Results */}
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            {!result ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <TrendingDown className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-400 mb-2">No Analysis Yet</h3>
                <p className="text-slate-500">
                  Enter your portfolio holdings and click "Analyze" to identify tax-loss harvesting opportunities
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white">Analysis Results</h2>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-900/20 border-green-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-green-300">Total Tax Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      ${result.totalTaxSavings.toFixed(2)}
                    </div>
                  </Card>

                  <Card className="bg-red-900/20 border-red-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span className="text-sm text-red-300">Unrealized Loss</span>
                    </div>
                    <div className="text-2xl font-bold text-red-400">
                      ${result.totalUnrealizedLoss.toFixed(2)}
                    </div>
                  </Card>

                  <Card className="bg-blue-900/20 border-blue-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      <span className="text-sm text-blue-300">Losing Positions</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-400">
                      {result.summary.losingPositions} / {result.summary.totalPositions}
                    </div>
                  </Card>

                  <Card className="bg-yellow-900/20 border-yellow-700 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span className="text-sm text-yellow-300">Wash Sale Warnings</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {result.summary.washSaleWarnings}
                    </div>
                  </Card>
                </div>

                {/* Losing Positions */}
                {result.losingPositions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Losing Positions</h3>
                    <div className="space-y-3">
                      {result.losingPositions.map((position, index) => (
                        <Card key={index} className="bg-slate-700/50 border-slate-600 p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="text-xl font-bold text-white">{position.ticker}</h4>
                              <p className="text-sm text-slate-400">
                                {position.shares} shares @ ${position.purchasePrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-400">
                                {position.lossPercentage.toFixed(2)}%
                              </div>
                              <div className="text-sm text-slate-400">
                                ${position.unrealizedLoss.toFixed(2)} loss
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                            <div>
                              <span className="text-slate-400">Current:</span>
                              <span className="ml-2 text-white">${position.currentPrice.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Tax Savings:</span>
                              <span className="ml-2 text-green-400 font-semibold">
                                ${position.taxSavings.toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400">Holding:</span>
                              <span className="ml-2 text-white">
                                {position.holdingPeriod} days ({position.isLongTerm ? 'Long' : 'Short'}-term)
                              </span>
                            </div>
                          </div>

                          {position.washSaleRisk && (
                            <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2 mb-3">
                              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Wash Sale Risk: Purchased within last 30 days</span>
                              </div>
                            </div>
                          )}

                          {/* Replacement Suggestions */}
                          {result.replacementSuggestions[position.ticker] && (
                            <div>
                              <h5 className="text-sm font-semibold text-slate-300 mb-2">
                                Replacement Suggestions:
                              </h5>
                              <div className="space-y-2">
                                {result.replacementSuggestions[position.ticker].map((replacement, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-slate-600/30 rounded p-2 flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-semibold text-white">{replacement.ticker}</div>
                                      <div className="text-xs text-slate-400">{replacement.name}</div>
                                      <div className="text-xs text-slate-500">{replacement.reason}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-white">
                                        ${replacement.currentPrice.toFixed(2)}
                                      </div>
                                      <div className="text-xs text-green-400">
                                        {(replacement.correlation * 100).toFixed(0)}% similar
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
