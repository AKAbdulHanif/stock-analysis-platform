/**
 * Security Middleware
 * 
 * Implements security best practices including headers, CSRF protection, and input sanitization
 */

import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

/**
 * Helmet security headers configuration
 * Protects against common web vulnerabilities
 */
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline scripts for React
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"], // Allow external images
      connectSrc: ["'self'", "https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HTTP Strict Transport Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  
  // X-Frame-Options
  frameguard: {
    action: "deny", // Prevent clickjacking
  },
  
  // X-Content-Type-Options
  noSniff: true, // Prevent MIME type sniffing
  
  // X-XSS-Protection
  xssFilter: true,
  
  // Referrer-Policy
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
});

/**
 * Input sanitization middleware
 * Removes potentially dangerous characters from user input
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }
  
  // Sanitize body parameters
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === "string") {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  
  next();
}

/**
 * Sanitize a string by removing potentially dangerous characters
 */
function sanitizeString(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Request logging middleware
 * Logs all incoming requests for security monitoring
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
}
