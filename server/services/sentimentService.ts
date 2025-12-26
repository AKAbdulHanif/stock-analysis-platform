/**
 * Sentiment Analysis Service
 * 
 * Analyzes financial news sentiment using keyword-based NLP
 * Classifies articles as positive, negative, or neutral
 */

export type SentimentType = 'positive' | 'negative' | 'neutral';

export interface SentimentResult {
  sentiment: SentimentType;
  score: number; // -1 to 1 (negative to positive)
  confidence: number; // 0 to 1
}

// Financial sentiment keywords
const POSITIVE_KEYWORDS = [
  'surge', 'soar', 'rally', 'gain', 'rise', 'jump', 'climb', 'advance', 'boost',
  'profit', 'revenue', 'growth', 'beat', 'exceed', 'outperform', 'strong', 'robust',
  'upgrade', 'bullish', 'optimistic', 'positive', 'success', 'breakthrough', 'innovation',
  'expand', 'acquisition', 'merger', 'partnership', 'dividend', 'buyback', 'recovery',
  'momentum', 'upside', 'opportunity', 'favorable', 'improved', 'better', 'higher',
  'record', 'milestone', 'achievement', 'winner', 'leading', 'dominant', 'competitive'
];

const NEGATIVE_KEYWORDS = [
  'plunge', 'plummet', 'crash', 'fall', 'drop', 'decline', 'tumble', 'slump', 'sink',
  'loss', 'miss', 'disappoint', 'underperform', 'weak', 'poor', 'struggle', 'concern',
  'downgrade', 'bearish', 'pessimistic', 'negative', 'failure', 'risk', 'threat',
  'lawsuit', 'investigation', 'scandal', 'fraud', 'bankruptcy', 'debt', 'layoff',
  'cut', 'reduce', 'lower', 'worse', 'deteriorate', 'warning', 'caution', 'volatile',
  'uncertainty', 'crisis', 'recession', 'inflation', 'pressure', 'challenge', 'problem'
];

// Intensifiers that amplify sentiment
const INTENSIFIERS = [
  'very', 'extremely', 'significantly', 'substantially', 'dramatically', 'sharply',
  'heavily', 'strongly', 'highly', 'deeply', 'severely', 'massively', 'hugely'
];

// Negation words that flip sentiment
const NEGATIONS = [
  'not', 'no', 'never', 'neither', 'nor', 'none', 'nobody', 'nothing', 'nowhere',
  'hardly', 'scarcely', 'barely', 'doesn\'t', 'don\'t', 'didn\'t', 'won\'t', 'wouldn\'t',
  'shouldn\'t', 'couldn\'t', 'can\'t', 'isn\'t', 'aren\'t', 'wasn\'t', 'weren\'t'
];

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      sentiment: 'neutral',
      score: 0,
      confidence: 0
    };
  }

  // Convert to lowercase and split into words
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\W+/).filter(w => w.length > 0);
  
  let positiveScore = 0;
  let negativeScore = 0;
  let totalMatches = 0;

  // Analyze each word with context
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : '';
    
    // Check for intensifiers
    const hasIntensifier = INTENSIFIERS.includes(prevWord);
    const multiplier = hasIntensifier ? 1.5 : 1.0;
    
    // Check for negation
    const hasNegation = NEGATIONS.includes(prevWord);
    
    // Check positive keywords
    if (POSITIVE_KEYWORDS.includes(word)) {
      const score = multiplier;
      if (hasNegation) {
        negativeScore += score; // Negation flips sentiment
      } else {
        positiveScore += score;
      }
      totalMatches++;
    }
    
    // Check negative keywords
    if (NEGATIVE_KEYWORDS.includes(word)) {
      const score = multiplier;
      if (hasNegation) {
        positiveScore += score; // Negation flips sentiment
      } else {
        negativeScore += score;
      }
      totalMatches++;
    }
  }

  // Calculate net score
  const netScore = positiveScore - negativeScore;
  const maxPossibleScore = Math.max(positiveScore + negativeScore, 1);
  const normalizedScore = netScore / maxPossibleScore; // -1 to 1
  
  // Calculate confidence based on number of matches
  const confidence = Math.min(totalMatches / 10, 1); // More matches = higher confidence
  
  // Determine sentiment category
  let sentiment: SentimentType;
  if (normalizedScore > 0.15) {
    sentiment = 'positive';
  } else if (normalizedScore < -0.15) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }

  return {
    sentiment,
    score: normalizedScore,
    confidence
  };
}

/**
 * Analyze sentiment of news article (title + summary)
 */
export function analyzeArticleSentiment(title: string, summary: string): SentimentResult {
  // Title has more weight than summary
  const titleSentiment = analyzeSentiment(title);
  const summarySentiment = analyzeSentiment(summary);
  
  // Weighted average (title: 60%, summary: 40%)
  const combinedScore = (titleSentiment.score * 0.6) + (summarySentiment.score * 0.4);
  const combinedConfidence = (titleSentiment.confidence * 0.6) + (summarySentiment.confidence * 0.4);
  
  // Determine final sentiment
  let sentiment: SentimentType;
  if (combinedScore > 0.15) {
    sentiment = 'positive';
  } else if (combinedScore < -0.15) {
    sentiment = 'negative';
  } else {
    sentiment = 'neutral';
  }
  
  return {
    sentiment,
    score: combinedScore,
    confidence: combinedConfidence
  };
}

/**
 * Get sentiment statistics for a collection of articles
 */
export function getSentimentStats(sentiments: SentimentType[]) {
  const total = sentiments.length;
  if (total === 0) {
    return {
      positive: 0,
      negative: 0,
      neutral: 0,
      positivePercent: 0,
      negativePercent: 0,
      neutralPercent: 0
    };
  }

  const positive = sentiments.filter(s => s === 'positive').length;
  const negative = sentiments.filter(s => s === 'negative').length;
  const neutral = sentiments.filter(s => s === 'neutral').length;

  return {
    positive,
    negative,
    neutral,
    positivePercent: (positive / total) * 100,
    negativePercent: (negative / total) * 100,
    neutralPercent: (neutral / total) * 100
  };
}
