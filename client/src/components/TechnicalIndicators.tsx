import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, ComposedChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TechnicalSignal {
  indicator: string;
  signal: 'buy' | 'sell' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  description: string;
}

interface RSIData {
  date: string;
  rsi: number;
  signal: string;
}

interface MACDData {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
  crossover: string;
}

interface BollingerBandsData {
  date: string;
  upper: number;
  middle: number;
  lower: number;
  price: number;
  signal: string;
}

interface TechnicalIndicatorsData {
  ticker: string;
  lastUpdated: string;
  rsi: RSIData[];
  macd: MACDData[];
  bollingerBands: BollingerBandsData[];
  signals: TechnicalSignal[];
  consensus: 'strong_buy' | 'buy' | 'neutral' | 'sell' | 'strong_sell';
}

interface TechnicalIndicatorsProps {
  ticker: string;
}

export default function TechnicalIndicators({ ticker }: TechnicalIndicatorsProps) {
  const [data, setData] = useState<TechnicalIndicatorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('3mo');

  useEffect(() => {
    fetchTechnicalIndicators();
  }, [ticker, period]);

  const fetchTechnicalIndicators = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/technical-indicators/${ticker}?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch technical indicators');
      }
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching technical indicators:', error);
      toast.error('Failed to load technical indicators');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-center justify-center py-12">
          <Activity className="h-8 w-8 text-slate-400 animate-pulse" />
          <span className="ml-3 text-slate-400">Loading technical indicators...</span>
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="text-center py-12 text-slate-400">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-slate-500" />
          <p>Unable to load technical indicators</p>
        </div>
      </Card>
    );
  }

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case 'strong_buy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'buy': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'neutral': return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
      case 'sell': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'strong_sell': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getConsensusLabel = (consensus: string) => {
    return consensus.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'buy') return <TrendingUp className="h-4 w-4" />;
    if (signal === 'sell') return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getSignalColor = (signal: string) => {
    if (signal === 'buy') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (signal === 'sell') return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
  };

  const latestRSI = data.rsi[data.rsi.length - 1];
  const latestMACD = data.macd[data.macd.length - 1];
  const latestBB = data.bollingerBands[data.bollingerBands.length - 1];

  return (
    <div className="space-y-6">
      {/* Consensus Signal */}
      <Card className="bg-slate-800 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Technical Analysis</h3>
          <div className={`px-4 py-2 rounded-lg border font-semibold ${getConsensusColor(data.consensus)}`}>
            {getConsensusLabel(data.consensus)}
          </div>
        </div>

        {/* Individual Signals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {data.signals.map((signal, idx) => (
            <div key={idx} className={`p-4 rounded-lg border ${getSignalColor(signal.signal)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getSignalIcon(signal.signal)}
                <span className="font-semibold">{signal.indicator}</span>
              </div>
              <p className="text-sm opacity-90">{signal.description}</p>
              <div className="mt-2 text-xs opacity-75">
                Strength: {signal.strength.charAt(0).toUpperCase() + signal.strength.slice(1)}
              </div>
            </div>
          ))}
        </div>

        {/* Current Values */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">RSI (14)</div>
            <div className="text-2xl font-bold">{latestRSI?.rsi.toFixed(2)}</div>
            <div className={`text-xs mt-1 ${latestRSI?.signal === 'oversold' ? 'text-emerald-400' : latestRSI?.signal === 'overbought' ? 'text-red-400' : 'text-slate-400'}`}>
              {latestRSI?.signal.charAt(0).toUpperCase() + latestRSI?.signal.slice(1)}
            </div>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">MACD</div>
            <div className="text-2xl font-bold">{latestMACD?.macd.toFixed(2)}</div>
            <div className={`text-xs mt-1 ${latestMACD?.histogram > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              Histogram: {latestMACD?.histogram.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-700/50 p-4 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">Bollinger %</div>
            <div className="text-2xl font-bold">
              {latestBB ? (((latestBB.price - latestBB.lower) / (latestBB.upper - latestBB.lower)) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs mt-1 text-slate-400">
              {latestBB?.signal === 'buy' ? 'Near Lower Band' : latestBB?.signal === 'sell' ? 'Near Upper Band' : 'Mid Range'}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="rsi" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
          <TabsTrigger value="rsi">RSI</TabsTrigger>
          <TabsTrigger value="macd">MACD</TabsTrigger>
          <TabsTrigger value="bollinger">Bollinger Bands</TabsTrigger>
        </TabsList>

        {/* RSI Chart */}
        <TabsContent value="rsi">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h4 className="text-lg font-semibold mb-4">Relative Strength Index (RSI)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.rsi}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                  formatter={(value: number) => [value.toFixed(2), 'RSI']}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Overbought', fill: '#ef4444' }} />
                <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Oversold', fill: '#10b981' }} />
                <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rsi" stroke="#3b82f6" strokeWidth={2} dot={false} name="RSI" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong>RSI Interpretation:</strong> RSI below 30 suggests oversold conditions (potential buy), 
                above 70 suggests overbought conditions (potential sell). Current RSI: <strong>{latestRSI?.rsi.toFixed(2)}</strong>
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* MACD Chart */}
        <TabsContent value="macd">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h4 className="text-lg font-semibold mb-4">MACD (Moving Average Convergence Divergence)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.macd}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                  formatter={(value: number) => value.toFixed(2)}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />
                <Bar dataKey="histogram" fill="#3b82f6" opacity={0.5} name="Histogram" />
                <Line type="monotone" dataKey="macd" stroke="#10b981" strokeWidth={2} dot={false} name="MACD" />
                <Line type="monotone" dataKey="signal" stroke="#ef4444" strokeWidth={2} dot={false} name="Signal" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong>MACD Interpretation:</strong> Bullish crossover (MACD crosses above signal line) suggests buy signal. 
                Bearish crossover suggests sell signal. Histogram shows momentum strength.
              </p>
            </div>
          </Card>
        </TabsContent>

        {/* Bollinger Bands Chart */}
        <TabsContent value="bollinger">
          <Card className="bg-slate-800 border-slate-700 p-6">
            <h4 className="text-lg font-semibold mb-4">Bollinger Bands</h4>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.bollingerBands}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#cbd5e1' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`]}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Area type="monotone" dataKey="upper" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} name="Upper Band" />
                <Area type="monotone" dataKey="lower" stroke="#10b981" fill="#10b981" fillOpacity={0.1} name="Lower Band" />
                <Line type="monotone" dataKey="middle" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" dot={false} name="Middle (SMA)" />
                <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={false} name="Price" />
              </ComposedChart>
            </ResponsiveContainer>
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-slate-300">
                <strong>Bollinger Bands Interpretation:</strong> Price touching lower band suggests oversold (potential buy). 
                Price touching upper band suggests overbought (potential sell). Bands widen during high volatility.
              </p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
