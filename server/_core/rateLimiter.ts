/**
 * Rate Limiting Middleware
 * 
 * Protects API endpoints from abuse by limiting request rates
 */

import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store in memory (for production, consider Redis)
  skipSuccessfulRequests: false,
});

/**
 * Strict rate limiter for sensitive operations
 * Allows 20 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: "Too many requests for this operation, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Authentication rate limiter
 * Allows 5 login attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true, // Don't count successful requests
});

/**
 * Stock data rate limiter
 * Allows 200 requests per 15 minutes per IP (higher limit for data fetching)
 */
export const stockDataLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: "Too many stock data requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

/**
 * Create custom rate limiter with specific configuration
 */
export function createRateLimiter(windowMs: number, max: number, message?: string) {
  return rateLimit({
    windowMs,
    max,
    message: message || "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });
}
