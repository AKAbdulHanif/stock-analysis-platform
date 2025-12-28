import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, PieChart, Activity, Save, FolderOpen, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { searchSecurities } from '../../../shared/stockUniverse';

interface Position {
  id: string;
  ticker: string;
  shares: number;
  avgCost: number;
  currentPrice?: number;
  value?: number;
  return?: number;
  returnPercent?: number;
  weight?: number;
}

interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  beta: number;
  diversificationScore: number;
  positions: Array<{
    ticker: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    value: number;
    return: number;
    returnPercent: number;
    weight: number;
  }>;
}

function SortablePosition({ position, onUpdate, onRemove }: { position: Position; onUpdate: (id: string, field: string, value: number) => void; onRemove: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: position.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-700/30 border border-slate-600 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-move text-slate-400 hover:text-white">
          <Activity className="h-5 w-5" />
        </div>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-slate-400 mb-1">Ticker</p>
            <p className="text-lg font-bold text-white">{position.ticker}</p>
          </div>
          
          <div>
            <p className="text-xs text-slate-400 mb-1">Shares</p>
            <Input
              type="number"
              value={position.shares}
              onChange={(e) => onUpdate(position.id, 'shares', parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <p className="text-xs text-slate-400 mb-1">Avg Cost</p>
            <Input
              type="number"
              value={position.avgCost}
              onChange={(e) => onUpdate(position.id, 'avgCost', parseFloat(e.target.value) || 0)}
              className="bg-slate-800 border-slate-600 text-white"
              step="0.01"
            />
          </div>
          
          {position.currentPrice && (
            <>
              <div>
                <p className="text-xs text-slate-400 mb-1">Current Value</p>
                <p className="text-lg font-semibold text-white">${position.value?.toFixed(2)}</p>
              </div>
              
              <div>
                <p className="text-xs text-slate-400 mb-1">Return</p>
                <p className={`text-lg font-semibold ${position.return! >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {position.return! >= 0 ? '+' : ''}${position.return?.toFixed(2)} ({position.returnPercent! >= 0 ? '+' : ''}{position.returnPercent?.toFixed(2)}%)
                </p>
              </div>
            </>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(position.id)}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface SavedPortfolio {
  id: number;
  name: string;
  description: string | null;
  positionCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PortfolioBuilder() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ ticker: string; name: string }>>([]);
  
  // Save/Load state
  const [savedPortfolios, setSavedPortfolios] = useState<SavedPortfolio[]>([]);
  const [currentPortfolioId, setCurrentPortfolioId] = useState<number | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (searchQuery.length >= 1) {
      const results = searchSecurities(searchQuery).slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (positions.length > 0) {
      calculateMetrics();
    } else {
      setMetrics(null);
    }
  }, [positions]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPositions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addPosition = (ticker: string) => {
    const exists = positions.find(p => p.ticker === ticker);
    if (exists) return;

    const newPosition: Position = {
      id: `${ticker}-${Date.now()}`,
      ticker,
      shares: 1,
      avgCost: 0,
    };
    setPositions([...positions, newPosition]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const updatePosition = (id: string, field: string, value: number) => {
    setPositions(positions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const removePosition = (id: string) => {
    setPositions(positions.filter(p => p.id !== id));
  };

  const calculateMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          positions: positions.map(p => ({
            ticker: p.ticker,
            shares: p.shares,
            avgCost: p.avgCost,
          })),
        }),
      });

      const data = await response.json();
      setMetrics(data);

      // Update positions with current data
      setPositions(positions.map(p => {
        const updated = data.positions.find((dp: any) => dp.ticker === p.ticker);
        return updated ? { ...p, ...updated } : p;
      }));
    } catch (error) {
      console.error('Failed to calculate metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load saved portfolios on mount
  useEffect(() => {
    loadSavedPortfolios();
  }, []);

  const loadSavedPortfolios = async () => {
    try {
      const response = await fetch('/api/portfolios');
      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }
      const data = await response.json();
      setSavedPortfolios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load portfolios:', error);
      setSavedPortfolios([]);
    }
  };

  const savePortfolio = async () => {
    if (!portfolioName.trim()) {
      toast.error('Please enter a portfolio name');
      return;
    }

    if (positions.length === 0) {
      toast.error('Cannot save an empty portfolio');
      return;
    }

    try {
      const url = currentPortfolioId 
        ? `/api/portfolios/${currentPortfolioId}` 
        : '/api/portfolios';
      
      const method = currentPortfolioId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolioName,
          description: portfolioDescription,
          positions: positions.map(p => ({
            ticker: p.ticker,
            shares: p.shares,
            avgCost: p.avgCost,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolio');
      }

      const savedPortfolio = await response.json();
      setCurrentPortfolioId(savedPortfolio.id);
      toast.success(currentPortfolioId ? 'Portfolio updated!' : 'Portfolio saved!');
      setSaveDialogOpen(false);
      loadSavedPortfolios();
    } catch (error) {
      console.error('Error saving portfolio:', error);
      toast.error('Failed to save portfolio');
    }
  };

  const loadPortfolio = async (portfolioId: number) => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      const data = await response.json();

      setCurrentPortfolioId(data.id);
      setPortfolioName(data.name);
      setPortfolioDescription(data.description || '');
      
      const loadedPositions = data.positions.map((p: any) => ({
        id: `${p.ticker}-${Date.now()}-${Math.random()}`,
        ticker: p.ticker,
        shares: p.shares,
        avgCost: p.avgCost,
      }));
      
      setPositions(loadedPositions);
      setLoadDialogOpen(false);
      toast.success(`Loaded portfolio: ${data.name}`);
    } catch (error) {
      console.error('Error loading portfolio:', error);
      toast.error('Failed to load portfolio');
    }
  };

  const deletePortfolio = async (portfolioId: number) => {
    if (!confirm('Are you sure you want to delete this portfolio?')) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      toast.success('Portfolio deleted');
      loadSavedPortfolios();
      
      if (currentPortfolioId === portfolioId) {
        newPortfolio();
      }
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error('Failed to delete portfolio');
    }
  };

  const newPortfolio = () => {
    setCurrentPortfolioId(null);
    setPortfolioName('');
    setPortfolioDescription('');
    setPositions([]);
    setMetrics(null);
    toast.success('Started new portfolio');
  };

  const chartData = metrics?.positions.map(p => ({
    name: p.ticker,
    value: p.weight,
  })) || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4 text-slate-300 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {currentPortfolioId ? portfolioName : 'Portfolio Builder'}
            </h1>
            <p className="text-slate-300">
              Build and analyze your custom portfolio with real-time metrics
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={newPortfolio}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <FileText className="mr-2 h-4 w-4" />
              New
            </Button>
            
            <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Load Portfolio</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedPortfolios.length === 0 ? (
                    <p className="text-slate-400 text-center py-8">No saved portfolios yet</p>
                  ) : (
                    savedPortfolios.map((portfolio) => (
                      <Card
                        key={portfolio.id}
                        className="bg-slate-700/50 border-slate-600 p-4 cursor-pointer hover:bg-slate-700"
                        onClick={() => loadPortfolio(portfolio.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{portfolio.name}</h3>
                            {portfolio.description && (
                              <p className="text-sm text-slate-400 mt-1">{portfolio.description}</p>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                              <span>{portfolio.positionCount} positions</span>
                              <span>Updated {new Date(portfolio.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePortfolio(portfolio.id);
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={positions.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {currentPortfolioId ? 'Update Portfolio' : 'Save Portfolio'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-slate-300">Portfolio Name</Label>
                    <Input
                      id="name"
                      value={portfolioName}
                      onChange={(e) => setPortfolioName(e.target.value)}
                      placeholder="My Investment Portfolio"
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-slate-300">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={portfolioDescription}
                      onChange={(e) => setPortfolioDescription(e.target.value)}
                      placeholder="Long-term growth portfolio focused on tech and healthcare..."
                      className="bg-slate-700 border-slate-600 text-white mt-2"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={savePortfolio}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {currentPortfolioId ? 'Update' : 'Save'} Portfolio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Portfolio Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Total Value</p>
              <p className="text-3xl font-bold text-white">${metrics.totalValue?.toFixed(2) ?? '0.00'}</p>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Total Return</p>
              <div className="flex items-center gap-2">
                {metrics.totalReturn >= 0 ? <TrendingUp className="h-6 w-6 text-green-400" /> : <TrendingDown className="h-6 w-6 text-red-400" />}
                <p className={`text-3xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn?.toFixed(2) ?? '0.00'}
                </p>
              </div>
              <p className={`text-sm ${metrics.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent?.toFixed(2) ?? '0.00'}%
              </p>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Sharpe Ratio</p>
              <p className="text-3xl font-bold text-white">{metrics.sharpeRatio?.toFixed(2) ?? '0.00'}</p>
              <Badge className={
                metrics.sharpeRatio > 1 ? 'bg-green-500/10 text-green-500' :
                metrics.sharpeRatio > 0 ? 'bg-blue-500/10 text-blue-500' :
                'bg-red-500/10 text-red-500'
              }>
                {metrics.sharpeRatio > 1 ? 'Excellent' : metrics.sharpeRatio > 0 ? 'Good' : 'Poor'}
              </Badge>
            </Card>
            
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <p className="text-sm text-slate-400 mb-1">Diversification Score</p>
              <p className="text-3xl font-bold text-white">{metrics.diversificationScore?.toFixed(0) ?? '0'}/100</p>
              <Badge className={
                metrics.diversificationScore > 70 ? 'bg-green-500/10 text-green-500' :
                metrics.diversificationScore > 40 ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }>
                {metrics.diversificationScore > 70 ? 'Well Diversified' : metrics.diversificationScore > 40 ? 'Moderate' : 'Concentrated'}
              </Badge>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Positions List */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Positions</h2>
              
              {/* Add Position */}
              <div className="mb-6 relative">
                <Input
                  type="text"
                  placeholder="Search stocks to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.ticker}
                        onClick={() => addPosition(result.ticker)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">{result.ticker}</p>
                          <p className="text-sm text-slate-400">{result.name}</p>
                        </div>
                        <Plus className="h-4 w-4 text-blue-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Positions */}
              {positions.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No positions yet. Search and add stocks to build your portfolio.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={positions.map(p => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {positions.map((position) => (
                        <SortablePosition
                          key={position.id}
                          position={position}
                          onUpdate={updatePosition}
                          onRemove={removePosition}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {positions.length > 0 && (
                <Button
                  onClick={calculateMetrics}
                  disabled={loading}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Calculating...' : 'Calculate Portfolio Metrics'}
                </Button>
              )}
            </Card>
          </div>

          {/* Portfolio Composition Chart */}
          <div>
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Portfolio Composition</h2>
              
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 space-y-2">
                    {metrics?.positions.map((pos, index) => (
                      <div key={pos.ticker} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-white font-medium">{pos.ticker}</span>
                        </div>
                        <span className="text-slate-400">{pos.weight.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <PieChart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Add positions to see composition</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
