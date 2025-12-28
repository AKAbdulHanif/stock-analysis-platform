import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, FileDown, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceChartProps {
  portfolioId: number;
}

interface ChartDataPoint {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
}

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  cagr: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export function PerformanceChart({ portfolioId }: PerformanceChartProps) {
  const [period, setPeriod] = useState('1M');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [portfolioId, period]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch history data
      const historyResponse = await fetch(`/api/portfolios/${portfolioId}/history?period=${period}`);
      const historyData = await historyResponse.json();
      
      // Fetch performance metrics
      const metricsResponse = await fetch(`/api/portfolios/${portfolioId}/performance`);
      const metricsData = await metricsResponse.json();
      
      // Transform data for chart
      const chartPoints: ChartDataPoint[] = [];
      const portfolioMap = new Map(historyData.portfolio.map((p: any) => [
        new Date(p.date).toISOString().split('T')[0],
        p.value
      ]));
      
      const benchmarkMap = new Map(historyData.benchmark.map((b: any) => [
        new Date(b.date).toISOString().split('T')[0],
        b.value
      ]));
      
      // Normalize benchmark to start at same value as portfolio
      const portfolioStart = historyData.portfolio[0]?.value || 10000;
      const benchmarkStart = historyData.benchmark[0]?.value || 1;
      const benchmarkMultiplier = portfolioStart / benchmarkStart;
      
      // Combine data points
      const allDates = new Set([...portfolioMap.keys(), ...benchmarkMap.keys()]);
      Array.from(allDates).sort().forEach(date => {
        const portfolioValue = portfolioMap.get(date);
        const benchmarkValue = benchmarkMap.get(date);
        
        if (portfolioValue && benchmarkValue) {
          chartPoints.push({
            date,
            portfolioValue,
            benchmarkValue: benchmarkValue * benchmarkMultiplier,
          });
        }
      });
      
      setChartData(chartPoints);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setExporting(true);
      toast.info('Generating PDF report...');
      
      const response = await fetch(`/api/portfolios/${portfolioId}/export/pdf`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio_report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF report');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async () => {
    try {
      setExporting(true);
      toast.info('Generating Excel report...');
      
      const response = await fetch(`/api/portfolios/${portfolioId}/export/excel`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Excel report downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  const periods = [
    { label: '1W', value: '1W' },
    { label: '1M', value: '1M' },
    { label: '3M', value: '3M' },
    { label: '6M', value: '6M' },
    { label: '1Y', value: '1Y' },
    { label: 'All', value: 'ALL' },
  ];

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-400">Loading performance data...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-1">Total Return</p>
            <div className="flex items-center gap-2">
              {metrics.totalReturnPercent >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <p className={`text-2xl font-bold ${metrics.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent.toFixed(2)}%
              </p>
            </div>
            <p className="text-xs text-slate-500">
              ${metrics.totalReturn.toFixed(2)}
            </p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-1">CAGR</p>
            <p className="text-2xl font-bold text-white">{metrics.cagr.toFixed(2)}%</p>
            <p className="text-xs text-slate-500">Annualized</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-1">Max Drawdown</p>
            <p className="text-2xl font-bold text-red-400">-{metrics.maxDrawdown.toFixed(2)}%</p>
            <p className="text-xs text-slate-500">Peak to trough</p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-1">Sharpe Ratio</p>
            <p className="text-2xl font-bold text-white">{metrics.sharpeRatio.toFixed(2)}</p>
            <p className="text-xs text-slate-500">
              {metrics.sharpeRatio > 1 ? 'Excellent' : metrics.sharpeRatio > 0 ? 'Good' : 'Poor'}
            </p>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <p className="text-sm text-slate-400 mb-1">Data Points</p>
            <p className="text-2xl font-bold text-white">{chartData.length}</p>
            <p className="text-xs text-slate-500">Snapshots</p>
          </Card>
        </div>
      )}
      
      {/* Chart */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Portfolio Performance vs S&P 500</h3>
          
          <div className="flex gap-4">
            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={exporting || chartData.length === 0}
                className="border-green-500/50 text-green-400 hover:bg-green-500/10"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={exporting || chartData.length === 0}
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            </div>
            
            {/* Period Selector */}
            <div className="flex gap-2">
            {periods.map(p => (
              <Button
                key={p.value}
                variant={period === p.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className={period === p.value ? 'bg-blue-600' : ''}
              >
                {p.label}
              </Button>
            ))}
            </div>
          </div>
        </div>
        
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
                formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              <Line 
                type="monotone" 
                dataKey="portfolioValue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Portfolio"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="benchmarkValue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="S&P 500"
                dot={false}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96">
            <p className="text-slate-400">No performance data available. Save your portfolio to start tracking.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
