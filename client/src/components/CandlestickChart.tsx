import { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface CandlestickChartProps {
  ticker: string;
  initialPeriod?: string;
}

export default function CandlestickChart({ ticker, initialPeriod = '1mo' }: CandlestickChartProps) {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(initialPeriod);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCandlestickData();
  }, [ticker, period]);

  const fetchCandlestickData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch chart data from Yahoo Finance API
      const response = await fetch(`/api/stock-chart/${ticker}?period=${period}&interval=1d`);
      if (!response.ok) throw new Error('Failed to fetch chart data');
      
      const chartData = await response.json();
      
      if (!chartData.dataPoints || chartData.dataPoints.length === 0) {
        throw new Error('No data available');
      }

      setData(chartData.dataPoints);

    } catch (err) {
      console.error('Error fetching candlestick data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const CustomCandlestick = (props: any) => {
    const { x, y, width, height, payload } = props;
    
    if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
      return null;
    }

    const { open, close, high, low } = payload;
    const isBullish = close > open;
    const color = isBullish ? '#10b981' : '#ef4444'; // green-500 : red-500
    
    // Calculate positions
    const maxPrice = Math.max(open, close, high, low);
    const minPrice = Math.min(open, close, high, low);
    const priceRange = maxPrice - minPrice;
    
    if (priceRange === 0) return null;

    // Scale factor for positioning
    const scale = height / priceRange;
    
    // Body rectangle
    const bodyTop = Math.min(open, close);
    const bodyBottom = Math.max(open, close);
    const bodyHeight = Math.abs(close - open) * scale;
    const bodyY = y + (maxPrice - Math.max(open, close)) * scale;
    
    // Wick lines
    const wickX = x + width / 2;
    const highY = y + (maxPrice - high) * scale;
    const lowY = y + (maxPrice - low) * scale;
    const bodyTopY = y + (maxPrice - bodyTop) * scale;
    const bodyBottomY = y + (maxPrice - bodyBottom) * scale;

    return (
      <g>
        {/* Upper wick */}
        <line
          x1={wickX}
          y1={highY}
          x2={wickX}
          y2={bodyTopY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Lower wick */}
        <line
          x1={wickX}
          y1={bodyBottomY}
          x2={wickX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const isBullish = data.close > data.open;
      const change = ((data.close - data.open) / data.open * 100).toFixed(2);

      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg">
          <p className="text-white font-semibold mb-2">{data.date}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Open:</span>
              <span className="text-white font-medium">${data.open?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">High:</span>
              <span className="text-white font-medium">${data.high?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Low:</span>
              <span className="text-white font-medium">${data.low?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Close:</span>
              <span className={`font-medium ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                ${data.close?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Change:</span>
              <span className={`font-medium ${isBullish ? 'text-green-400' : 'text-red-400'}`}>
                {isBullish ? '+' : ''}{change}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Volume:</span>
              <span className="text-white font-medium">
                {(data.volume / 1000000).toFixed(2)}M
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const periodButtons = [
    { label: '5D', value: '5d' },
    { label: '1M', value: '1mo' },
    { label: '3M', value: '3mo' },
    { label: '6M', value: '6mo' },
    { label: '1Y', value: '1y' },
  ];

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Candlestick Chart</CardTitle>
          <CardDescription className="text-slate-400">Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="text-slate-400">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Candlestick Chart</CardTitle>
          <CardDescription className="text-red-400">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate volume chart data
  const maxVolume = Math.max(...data.map(d => d.volume));
  const volumeData = data.map(d => ({
    ...d,
    volumeHeight: (d.volume / maxVolume) * 100,
    volumeColor: d.close > d.open ? '#10b981' : '#ef4444'
  }));

  // Calculate price statistics
  const firstCandle = data[0];
  const lastCandle = data[data.length - 1];
  const priceChange = lastCandle.close - firstCandle.open;
  const priceChangePercent = (priceChange / firstCandle.open) * 100;
  const periodHigh = Math.max(...data.map(d => d.high));
  const periodLow = Math.min(...data.map(d => d.low));

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Candlestick Chart</CardTitle>
            <CardDescription className="text-slate-400">
              OHLC price action with volume overlay
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {periodButtons.map(btn => (
              <Button
                key={btn.value}
                variant={period === btn.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(btn.value)}
                className={period === btn.value ? 'bg-blue-600' : ''}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Price Statistics */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-slate-400 text-xs mb-1">Open</div>
            <div className="text-white text-lg font-semibold">${firstCandle.open.toFixed(2)}</div>
          </div>
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-slate-400 text-xs mb-1">High</div>
            <div className="text-white text-lg font-semibold">${periodHigh.toFixed(2)}</div>
          </div>
          <div className="bg-slate-700 p-3 rounded-lg">
            <div className="text-slate-400 text-xs mb-1">Low</div>
            <div className="text-white text-lg font-semibold">${periodLow.toFixed(2)}</div>
          </div>
          <div className={`p-3 rounded-lg ${priceChangePercent >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <div className="text-slate-400 text-xs mb-1">Change</div>
            <div className={`text-lg font-semibold ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Candlestick Chart */}
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              yAxisId="price"
              domain={['dataMin - 5', 'dataMax + 5']}
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              yAxisId="price"
              dataKey="high"
              shape={<CustomCandlestick />}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Volume Chart */}
        <div className="mt-6">
          <h4 className="text-white text-sm font-semibold mb-3">Volume</h4>
          <ResponsiveContainer width="100%" height={100}>
            <ComposedChart data={volumeData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-800 border border-slate-700 p-2 rounded shadow-lg">
                        <p className="text-white text-xs">{data.date}</p>
                        <p className="text-slate-400 text-xs">
                          Volume: {(data.volume / 1000000).toFixed(2)}M
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="volume" radius={[2, 2, 0, 0]}>
                {volumeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.volumeColor} opacity={0.6} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-400">Bullish (Close {'>'} Open)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-400">Bearish (Close {'<'} Open)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
