import { Router } from 'express';
import { 
  getStockEvents, 
  getMultipleStockEvents,
  getUpcomingEvents,
  getDaysUntilEvent 
} from '../services/economicCalendarService';

const router = Router();

/**
 * GET /api/calendar/:ticker
 * Get upcoming events for a specific stock
 */
router.get('/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    const { days = '90' } = req.query;

    console.log(`[Economic Calendar API] Fetching events for ${ticker}`);

    const allEvents = await getStockEvents(ticker);
    const upcomingEvents = getUpcomingEvents(allEvents, parseInt(days as string));

    // Add days until event for each
    const eventsWithCountdown = upcomingEvents.map(event => ({
      ...event,
      daysUntil: getDaysUntilEvent(event)
    }));

    console.log(`[Economic Calendar API] Found ${eventsWithCountdown.length} upcoming events for ${ticker}`);

    res.json({
      ticker,
      events: eventsWithCountdown,
      total: eventsWithCountdown.length
    });

  } catch (error) {
    console.error('[Economic Calendar API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/calendar/multiple
 * Get upcoming events for multiple stocks
 */
router.post('/multiple', async (req, res) => {
  try {
    const { tickers, days = 90 } = req.body;

    if (!tickers || !Array.isArray(tickers)) {
      return res.status(400).json({ error: 'tickers array is required' });
    }

    console.log(`[Economic Calendar API] Fetching events for ${tickers.length} stocks`);

    const allEvents = await getMultipleStockEvents(tickers);
    const upcomingEvents = getUpcomingEvents(allEvents, days);

    // Add days until event for each
    const eventsWithCountdown = upcomingEvents.map(event => ({
      ...event,
      daysUntil: getDaysUntilEvent(event)
    }));

    console.log(`[Economic Calendar API] Found ${eventsWithCountdown.length} total upcoming events`);

    res.json({
      tickers,
      events: eventsWithCountdown,
      total: eventsWithCountdown.length
    });

  } catch (error) {
    console.error('[Economic Calendar API] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendar events',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
