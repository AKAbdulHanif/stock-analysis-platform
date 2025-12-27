import { useState } from 'react';
import { Star, Plus } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface QuickAddToWatchlistProps {
  ticker: string;
  name: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md';
}

export function QuickAddToWatchlist({ ticker, name, variant = 'icon', size = 'md' }: QuickAddToWatchlistProps) {
  const { isAuthenticated, getLoginUrl } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [watchlists, setWatchlists] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please log in to add stocks to watchlists', {
        action: {
          label: 'Log In',
          onClick: () => window.location.href = getLoginUrl(),
        },
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/trpc/watchlist.getUserWatchlists');
      const data = await response.json();
      
      if (data.result?.data) {
        setWatchlists(data.result.data);
        setShowDialog(true);
      } else {
        // No watchlists, create default one and add stock
        await createDefaultWatchlist();
      }
    } catch (error) {
      console.error('Error fetching watchlists:', error);
      toast.error('Failed to load watchlists');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultWatchlist = async () => {
    try {
      const createResponse = await fetch('/api/trpc/watchlist.createWatchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Watchlist' }),
      });
      const createData = await createResponse.json();
      
      if (createData.result?.data?.id) {
        await addToWatchlist(createData.result.data.id);
      }
    } catch (error) {
      console.error('Error creating watchlist:', error);
      toast.error('Failed to create watchlist');
    }
  };

  const addToWatchlist = async (watchlistId: number) => {
    try {
      const response = await fetch('/api/trpc/watchlist.addStock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlistId, ticker }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.result) {
        toast.success(`Added ${ticker} to watchlist`, {
          description: name,
        });
        setShowDialog(false);
      } else {
        if (data.error?.message?.includes('already in watchlist')) {
          toast.info(`${ticker} is already in this watchlist`);
        } else {
          toast.error('Failed to add stock to watchlist');
        }
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add stock to watchlist');
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size={size === 'sm' ? 'sm' : 'icon'}
          onClick={handleClick}
          disabled={loading}
          className="hover:bg-yellow-500/10 hover:text-yellow-400"
        >
          <Star className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
        </Button>

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add {ticker} to Watchlist</DialogTitle>
              <DialogDescription className="text-slate-400">
                Select a watchlist to add {name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 mt-4">
              {watchlists.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <p className="mb-4">You don't have any watchlists yet.</p>
                  <Button onClick={createDefaultWatchlist} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Watchlist
                  </Button>
                </div>
              ) : (
                watchlists.map((watchlist) => (
                  <Button
                    key={watchlist.id}
                    variant="outline"
                    className="w-full justify-start border-slate-600 hover:bg-slate-700"
                    onClick={() => addToWatchlist(watchlist.id)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    {watchlist.name}
                  </Button>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size={size}
        onClick={handleClick}
        disabled={loading}
        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
      >
        <Star className="mr-2 h-4 w-4" />
        Add to Watchlist
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Add {ticker} to Watchlist</DialogTitle>
            <DialogDescription className="text-slate-400">
              Select a watchlist to add {name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {watchlists.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p className="mb-4">You don't have any watchlists yet.</p>
                <Button onClick={createDefaultWatchlist} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Watchlist
                </Button>
              </div>
            ) : (
              watchlists.map((watchlist) => (
                <Button
                  key={watchlist.id}
                  variant="outline"
                  className="w-full justify-start border-slate-600 hover:bg-slate-700"
                  onClick={() => addToWatchlist(watchlist.id)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  {watchlist.name}
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
