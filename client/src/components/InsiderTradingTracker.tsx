/**
 * Insider Trading Tracker Component
 * Displays SEC Form 4 insider trading data with sentiment analysis
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, Users, Calendar, DollarSign } from 'lucide-react';

interface InsiderTransaction {
  id: string;
  ticker: string;
  insiderName: string;
  relation: string;
  transactionDate: string;
  transactionType: 'buy' | 'sell' | 'option_exercise' | 'gift' | 'other';
  shares: number;
  sharesFormatted: string;
  pricePerShare?: number;
  transactionValue?: number;
  transactionValueFormatted?: string;
  positionDirect: number;
  positionDirectFormatted: string;
  positionDirectDate: string;
  transactionDescription: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface InsiderSentiment {
  ticker: string;
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  bullishSignals: number;
  bearishSignals: number;
  neutralSignals: number;
  recentBuys: number;
  recentSells: number;
  totalTransactions: number;
  clusteringDetected: boolean;
  clusteringDescription?: string;
}

interface InsiderTradingTrackerProps {
  ticker: string;
}

export function InsiderTradingTracker({ ticker }: InsiderTradingTrackerProps) {
  const [transactions, setTransactions] = useState<InsiderTransaction[]>([]);
  const [sentiment, setSentiment] = useState<InsiderSentiment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');

  useEffect(() => {
    fetchInsiderData();
  }, [ticker, filter]);

  const fetchInsiderData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch transactions
      const transactionsUrl = filter === 'all'
        ? `/api/insider-trading/${ticker}`
        : `/api/insider-trading/${ticker}/type/${filter}`;
      
      const transactionsResponse = await fetch(transactionsUrl);
      if (!transactionsResponse.ok) {
        throw new Error('Failed to fetch insider transactions');
      }
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);

      // Fetch sentiment
      const sentimentResponse = await fetch(`/api/insider-trading/${ticker}/sentiment`);
      if (!sentimentResponse.ok) {
        throw new Error('Failed to fetch insider sentiment');
      }
      const sentimentData = await sentimentResponse.json();
      setSentiment(sentimentData);

    } catch (err: any) {
      console.error('Error fetching insider data:', err);
      setError(err.message || 'Failed to load insider trading data');
    } finally {
      setLoading(false);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Bullish</Badge>;
      case 'bearish':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Bearish</Badge>;
      default:
        return <Badge variant="outline">Neutral</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case 'buy':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Buy</Badge>;
      case 'sell':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Sell</Badge>;
      case 'option_exercise':
        return <Badge variant="outline">Option Exercise</Badge>;
      case 'gift':
        return <Badge variant="outline">Gift</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading insider trading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Insider Sentiment Summary */}
      {sentiment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Insider Sentiment
            </CardTitle>
            <CardDescription>
              Analysis of recent insider trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-1">
                  {getSentimentBadge(sentiment.overallSentiment)}
                </div>
                <div className="text-sm text-muted-foreground">Overall Sentiment</div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-1 text-green-500">{sentiment.recentBuys}</div>
                <div className="text-sm text-muted-foreground">Recent Buys (90d)</div>
              </div>

              <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold mb-1 text-red-500">{sentiment.recentSells}</div>
                <div className="text-sm text-muted-foreground">Recent Sells (90d)</div>
              </div>
            </div>

            {/* Clustering Alert */}
            {sentiment.clusteringDetected && sentiment.clusteringDescription && (
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <div className="font-semibold text-yellow-500 mb-1">Clustering Detected</div>
                  <div className="text-sm text-muted-foreground">
                    {sentiment.clusteringDescription}
                  </div>
                </div>
              </div>
            )}

            {/* Signal Breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="text-center p-2 bg-green-500/5 rounded">
                <div className="text-lg font-bold text-green-500">{sentiment.bullishSignals}</div>
                <div className="text-xs text-muted-foreground">Bullish</div>
              </div>
              <div className="text-center p-2 bg-red-500/5 rounded">
                <div className="text-lg font-bold text-red-500">{sentiment.bearishSignals}</div>
                <div className="text-xs text-muted-foreground">Bearish</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="text-lg font-bold">{sentiment.neutralSignals}</div>
                <div className="text-xs text-muted-foreground">Neutral</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Filter */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Transactions
        </Button>
        <Button
          variant={filter === 'buy' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('buy')}
        >
          Buys Only
        </Button>
        <Button
          variant={filter === 'sell' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('sell')}
        >
          Sells Only
        </Button>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Insider Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No insider transactions found for this filter
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Transaction Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getTransactionIcon(transaction.transactionType)}
                  </div>

                  {/* Transaction Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold">{transaction.insiderName}</div>
                        <div className="text-sm text-muted-foreground">{transaction.relation}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getTransactionBadge(transaction.transactionType)}
                        {getSentimentBadge(transaction.sentiment)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Transaction Date</div>
                        <div className="font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {transaction.transactionDate}
                        </div>
                      </div>

                      <div>
                        <div className="text-muted-foreground">Position</div>
                        <div className="font-medium">{transaction.positionDirectFormatted} shares</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-muted-foreground">Description</div>
                        <div className="font-medium text-xs">{transaction.transactionDescription}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
