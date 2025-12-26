import { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import { Card } from "@/components/ui/card";
import { generateCandleData, generateDailyCandleData, calculateTechnicalIndicators, getPriceStats, type CandleData } from "@/lib/candlestickData";

interface CandlestickChartProps {
  ticker: string;
  basePrice: number;
  period?: "1h" | "4h" | "1d" | "7d" | "30d";
}

interface ChartDataPoint extends CandleData {
  sma20?: number | null;
  sma50?: number | null;
  bollingerUpper?: number | null;
  bollingerLower?: number | null;
}

export default function CandlestickChart({ ticker, basePrice, period = "1h" }: CandlestickChartProps) {
  const chartData = useMemo(() => {
    let candles: CandleData[];

    // Generate candlestick data based on period
    switch (period) {
      case "1h":
        candles = generateCandleData(basePrice, 12, 0.01); // 12 periods * 5 min = 1 hour
        break;
      case "4h":
        candles = generateCandleData(basePrice, 48, 0.015); // 48 periods * 5 min = 4 hours
        break;
      case "1d":
        candles = generateDailyCandleData(basePrice, 1, 0.025);
        break;
      case "7d":
        candles = generateDailyCandleData(basePrice, 7, 0.025);
        break;
      case "30d":
        candles = generateDailyCandleData(basePrice, 30, 0.025);
        break;
      default:
        candles = generateCandleData(basePrice, 48, 0.015);
    }

    // Calculate technical indicators
    const indicators = calculateTechnicalIndicators(candles);

    // Merge candles with indicators
    return candles.map((candle, i) => ({
      ...candle,
      sma20: indicators[i].sma20,
      sma50: indicators[i].sma50,
      bollingerUpper: indicators[i].bollingerUpper,
      bollingerLower: indicators[i].bollingerLower
    })) as ChartDataPoint[];
  }, [ticker, basePrice, period]);

  const stats = useMemo(() => getPriceStats(chartData), [chartData]);

  // Custom candlestick shape
  const CustomCandlestick = (props: any) => {
    const { x, y, width, xAxis, yAxis, data } = props;

    if (!data || data.length === 0) return null;

    return data.map((entry: ChartDataPoint, index: number) => {
      const xPos = xAxis.scale(entry.timestamp);
      const yOpen = yAxis.scale(entry.open);
      const yClose = yAxis.scale(entry.close);
      const yHigh = yAxis.scale(entry.high);
      const yLow = yAxis.scale(entry.low);

      const candleWidth = Math.max(width * 0.6, 2);
      const isGain = entry.close >= entry.open;
      const color = isGain ? "#10b981" : "#ef4444"; // Green for gains, red for losses

      return (
        <g key={`candle-${index}`}>
          {/* High-Low line (wick) */}
          <line
            x1={xPos}
            y1={yHigh}
            x2={xPos}
            y2={yLow}
            stroke={color}
            strokeWidth={1}
          />
          {/* Open-Close rectangle (body) */}
          <rect
            x={xPos - candleWidth / 2}
            y={Math.min(yOpen, yClose)}
            width={candleWidth}
            height={Math.abs(yClose - yOpen) || 1}
            fill={color}
            stroke={color}
            strokeWidth={1}
          />
        </g>
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Price Statistics */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-slate-700 border-slate-600 p-2">
          <p className="text-slate-400 text-xs mb-1">Open</p>
          <p className="text-white font-semibold text-sm">${(stats.open || 0).toFixed(2)}</p>
        </Card>
        <Card className="bg-slate-700 border-slate-600 p-2">
          <p className="text-slate-400 text-xs mb-1">High</p>
          <p className="text-white font-semibold text-sm">${(stats.high || 0).toFixed(2)}</p>
        </Card>
        <Card className="bg-slate-700 border-slate-600 p-2">
          <p className="text-slate-400 text-xs mb-1">Low</p>
          <p className="text-white font-semibold text-sm">${(stats.low || 0).toFixed(2)}</p>
        </Card>
        <Card className={`border-slate-600 p-2 ${(stats.changePercent || 0) >= 0 ? "bg-emerald-600/10" : "bg-red-600/10"}`}>
          <p className="text-slate-400 text-xs mb-1">Change</p>
          <p className={`font-semibold text-sm ${(stats.changePercent || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {(stats.changePercent || 0) >= 0 ? "+" : ""}{(stats.changePercent || 0).toFixed(2)}%
          </p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-slate-700 border-slate-600 p-4">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 6)}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              domain={["dataMin - 5", "dataMax + 5"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
                borderRadius: "8px"
              }}
              labelStyle={{ color: "#e2e8f0" }}
              formatter={(value: any) => {
                if (typeof value === "number") {
                  return `$${value.toFixed(2)}`;
                }
                return value;
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend
              wrapperStyle={{ color: "#cbd5e1" }}
              iconType="line"
            />

            {/* Bollinger Bands */}
            <Line
              type="monotone"
              dataKey="bollingerUpper"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="BB Upper"
              strokeWidth={1}
            />
            <Line
              type="monotone"
              dataKey="bollingerLower"
              stroke="#f59e0b"
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
              name="BB Lower"
              strokeWidth={1}
            />

            {/* SMA Lines */}
            <Line
              type="monotone"
              dataKey="sma20"
              stroke="#3b82f6"
              dot={false}
              isAnimationActive={false}
              name="SMA 20"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="sma50"
              stroke="#8b5cf6"
              dot={false}
              isAnimationActive={false}
              name="SMA 50"
              strokeWidth={2}
            />

            {/* Candlestick shapes - rendered as custom elements */}
            <Bar
              dataKey="close"
              shape={<CustomCandlestick data={chartData} />}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
          <span className="text-slate-400">Bullish (Close {'>'} Open)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-slate-400">Bearish (Close {'<'} Open)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-slate-400">SMA 20</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span className="text-slate-400">SMA 50</span>
        </div>
      </div>
    </div>
  );
}
