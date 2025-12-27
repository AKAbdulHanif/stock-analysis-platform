import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, DollarSign, Clock, AlertCircle } from 'lucide-react';

interface CalendarEvent {
  id: string;
  ticker: string;
  type: 'earnings' | 'dividend' | 'split' | 'economic';
  title: string;
  date: string;
  timestamp: number;
  description: string;
  importance: 'high' | 'medium' | 'low';
  daysUntil: number;
  metadata?: {
    earningsTime?: 'BMO' | 'AMC' | 'Unknown';
    dividendAmount?: number;
    exDividendDate?: string;
    splitRatio?: string;
  };
}

interface EconomicCalendarProps {
  ticker: string;
  initialDays?: number;
}

export default function EconomicCalendar({ ticker, initialDays = 90 }: EconomicCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(initialDays);

  useEffect(() => {
    fetchCalendarEvents();
  }, [ticker, days]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/calendar/${ticker}?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch calendar events');

      const data = await response.json();
      setEvents(data.events || []);

    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'earnings':
        return <TrendingUp className="w-5 h-5" />;
      case 'dividend':
        return <DollarSign className="w-5 h-5" />;
      case 'split':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getEventColor = (importance: CalendarEvent['importance']) => {
    switch (importance) {
      case 'high':
        return 'border-red-500 bg-red-500/10';
      case 'medium':
        return 'border-amber-500 bg-amber-500/10';
      case 'low':
        return 'border-green-500 bg-green-500/10';
      default:
        return 'border-slate-600 bg-slate-700';
    }
  };

  const getEventTextColor = (importance: CalendarEvent['importance']) => {
    switch (importance) {
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-amber-400';
      case 'low':
        return 'text-green-400';
      default:
        return 'text-slate-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCountdownText = (daysUntil: number) => {
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`;
    return `In ${daysUntil} days`;
  };

  const dayOptions = [
    { label: '30D', value: 30 },
    { label: '60D', value: 60 },
    { label: '90D', value: 90 },
  ];

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Economic Calendar
          </CardTitle>
          <CardDescription className="text-slate-400">Loading upcoming events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
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
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Economic Calendar
          </CardTitle>
          <CardDescription className="text-red-400">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Economic Calendar
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upcoming earnings, dividends, and key events
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {dayOptions.map(opt => (
                <Button
                  key={opt.value}
                  variant={days === opt.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDays(opt.value)}
                  className={days === opt.value ? 'bg-blue-600' : ''}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No upcoming events in the next {days} days</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Economic Calendar
            </CardTitle>
            <CardDescription className="text-slate-400">
              {events.length} upcoming event{events.length !== 1 ? 's' : ''} in the next {days} days
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {dayOptions.map(opt => (
              <Button
                key={opt.value}
                variant={days === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(opt.value)}
                className={days === opt.value ? 'bg-blue-600' : ''}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border-l-4 ${getEventColor(event.importance)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-1 ${getEventTextColor(event.importance)}`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-white font-semibold">{event.title}</h4>
                      {event.metadata?.earningsTime && (
                        <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                          {event.metadata.earningsTime === 'BMO' ? 'Before Market' : 
                           event.metadata.earningsTime === 'AMC' ? 'After Market' : 'During Market'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{event.description}</p>
                    
                    {/* Metadata */}
                    {event.metadata?.dividendAmount && (
                      <div className="text-sm text-slate-400">
                        <span className="text-green-400 font-semibold">
                          ${event.metadata.dividendAmount.toFixed(2)}
                        </span>
                        {event.metadata.exDividendDate && (
                          <span className="ml-2">
                            (Ex-date: {formatDate(event.metadata.exDividendDate)})
                          </span>
                        )}
                      </div>
                    )}
                    
                    {event.metadata?.splitRatio && (
                      <div className="text-sm text-slate-400">
                        Split Ratio: <span className="text-white font-semibold">{event.metadata.splitRatio}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4">
                  <div className="text-white font-semibold text-sm mb-1">
                    {formatDate(event.date)}
                  </div>
                  <div className={`text-xs flex items-center gap-1 ${getEventTextColor(event.importance)}`}>
                    <Clock className="w-3 h-3" />
                    {getCountdownText(event.daysUntil)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-slate-400">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded"></div>
              <span className="text-slate-400">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-400">Low Priority</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
