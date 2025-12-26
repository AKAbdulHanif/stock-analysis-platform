import React, { createContext, useContext, useEffect, useState } from "react";
import { getStockPrice, subscribeToPriceUpdates, type PriceData } from "@/lib/priceService";

interface PriceContextType {
  prices: Record<string, PriceData>;
  lastUpdate: string;
  isLive: boolean;
  toggleLiveUpdates: () => void;
  refreshPrice: (ticker: string) => void;
  refreshAllPrices: (tickers: string[]) => void;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: React.ReactNode }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString());
  const [isLive, setIsLive] = useState<boolean>(true);
  const [subscribedTickers, setSubscribedTickers] = useState<string[]>([]);

  // Initialize with base prices
  useEffect(() => {
    const baseTickers = ["TSM", "NVDA", "AVGO", "ASML", "UNH", "JNJ", "JPM", "BAC", "GLD", "SLV"];
    const initialPrices: Record<string, PriceData> = {};
    
    baseTickers.forEach((ticker) => {
      initialPrices[ticker] = getStockPrice(ticker);
    });
    
    setPrices(initialPrices);
    setSubscribedTickers(baseTickers);
  }, []);

  // Subscribe to live updates
  useEffect(() => {
    if (!isLive || subscribedTickers.length === 0) return;

    const unsubscribe = subscribeToPriceUpdates(subscribedTickers, (updatedPrices) => {
      setPrices((prev) => ({ ...prev, ...updatedPrices }));
      setLastUpdate(new Date().toISOString());
    });

    return () => unsubscribe();
  }, [isLive, subscribedTickers]);

  const refreshPrice = (ticker: string) => {
    const priceData = getStockPrice(ticker);
    setPrices((prev) => ({ ...prev, [ticker]: priceData }));
    setLastUpdate(new Date().toISOString());
  };

  const refreshAllPrices = (tickers: string[]) => {
    const updatedPrices: Record<string, PriceData> = {};
    tickers.forEach((ticker) => {
      updatedPrices[ticker] = getStockPrice(ticker);
    });
    setPrices((prev) => ({ ...prev, ...updatedPrices }));
    setLastUpdate(new Date().toISOString());
  };

  const toggleLiveUpdates = () => {
    setIsLive((prev) => !prev);
  };

  return (
    <PriceContext.Provider
      value={{
        prices,
        lastUpdate,
        isLive,
        toggleLiveUpdates,
        refreshPrice,
        refreshAllPrices
      }}
    >
      {children}
    </PriceContext.Provider>
  );
}

export function usePrices() {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error("usePrices must be used within PriceProvider");
  }
  return context;
}

export function useStockPrice(ticker: string) {
  const { prices, refreshPrice } = usePrices();
  const priceData = prices[ticker] || getStockPrice(ticker);

  return {
    price: priceData.currentPrice,
    previousPrice: priceData.previousPrice,
    change: priceData.change,
    changeAmount: priceData.changeAmount,
    lastUpdated: priceData.lastUpdated,
    isLive: priceData.isLive,
    refresh: () => refreshPrice(ticker)
  };
}
