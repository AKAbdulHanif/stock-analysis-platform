# Investment Outlook 2026 - System Architecture

**Version:** 1.0.0  
**Last Updated:** December 26, 2025  
**Author:** Manus AI

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture Layers](#architecture-layers)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Testing Strategy](#testing-strategy)

---

## Executive Summary

The Investment Outlook 2026 platform is an enterprise-grade financial analysis application built on a modern full-stack architecture. The system provides real-time stock market data integration, portfolio management, risk-based investment recommendations, and comprehensive performance tracking capabilities.

**Key Design Principles:**
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **Type Safety**: End-to-end TypeScript with tRPC for contract-based API communication
- **Scalability**: Stateless backend design enabling horizontal scaling
- **Security**: OAuth 2.0 authentication, role-based access control, and secure data handling
- **Testability**: Comprehensive unit and integration testing with Vitest

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   React    │  │  Tailwind  │  │   tRPC     │            │
│  │   19.x     │  │    CSS     │  │   Client   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / tRPC
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   Express  │  │    tRPC    │  │   OAuth    │            │
│  │   Server   │  │   Router   │  │   Handler  │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     Data Layer           │  │   External Services      │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │
│  │  MySQL/TiDB        │  │  │  │  Yahoo Finance API │  │
│  │  (Drizzle ORM)     │  │  │  │  (via Manus Hub)   │  │
│  └────────────────────┘  │  │  └────────────────────┘  │
│  ┌────────────────────┐  │  │  ┌────────────────────┐  │
│  │  S3 Storage        │  │  │  │  LLM Services      │  │
│  │  (File Storage)    │  │  │  │  (AI Analysis)     │  │
│  └────────────────────┘  │  │  └────────────────────┘  │
└──────────────────────────┘  └──────────────────────────┘
```

---

## Architecture Layers

### 1. Presentation Layer (Client)

**Location:** `client/src/`

**Responsibilities:**
- User interface rendering and interaction
- State management with React Query
- Real-time price updates via polling
- Form validation and user input handling
- Responsive design and accessibility

**Key Components:**
- **Pages** (`client/src/pages/`): Route-level components
- **Components** (`client/src/components/`): Reusable UI elements
- **Contexts** (`client/src/contexts/`): Global state management
- **Hooks** (`client/src/hooks/`): Custom React hooks
- **Lib** (`client/src/lib/`): Utility functions and helpers

**Technology:**
- React 19 with TypeScript
- Tailwind CSS 4 for styling
- shadcn/ui component library
- tRPC React Query hooks
- Wouter for routing

### 2. Application Layer (Server)

**Location:** `server/`

**Responsibilities:**
- Business logic execution
- API endpoint management via tRPC
- Authentication and authorization
- Data validation with Zod schemas
- External API integration
- Background job processing

**Key Modules:**
- **Routers** (`server/routers.ts`): tRPC procedure definitions
- **Database** (`server/db.ts`): Database query helpers
- **Core** (`server/_core/`): Framework-level utilities
  - `oauth.ts`: Authentication handling
  - `llm.ts`: AI/LLM integration
  - `dataApi.ts`: External data API client
  - `trpc.ts`: tRPC server configuration

**Technology:**
- Express 4 for HTTP server
- tRPC 11 for type-safe APIs
- Zod for schema validation
- Superjson for data serialization
- Jose for JWT handling

### 3. Data Layer

**Location:** `drizzle/schema.ts`, `server/db.ts`

**Responsibilities:**
- Data persistence and retrieval
- Schema management and migrations
- Query optimization
- Transaction management
- Data integrity enforcement

**Database Schema:**
```typescript
// Core entities
- users: User accounts and authentication
- portfolios: User portfolio configurations
- watchlists: Saved stock watchlists
- trades: Trade entries and exits
- alerts: Price target alerts
- performance_history: Historical performance data
```

**Technology:**
- MySQL/TiDB for relational data
- Drizzle ORM for type-safe queries
- S3 for file storage

### 4. Integration Layer

**Location:** `server/_core/`, `client/src/lib/`

**Responsibilities:**
- External API communication
- Data transformation and mapping
- Error handling and retry logic
- Rate limiting and caching

**External Services:**
- **Yahoo Finance API** (via Manus Data API Hub): Real-time stock quotes and historical data
- **LLM Services**: AI-powered analysis and insights
- **OAuth Provider**: Manus authentication
- **S3 Storage**: File and asset storage

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.1 | UI framework |
| TypeScript | 5.9.3 | Type safety |
| Tailwind CSS | 4.1.14 | Styling |
| tRPC Client | 11.6.0 | API communication |
| React Query | 5.90.2 | Data fetching and caching |
| Wouter | 3.3.5 | Routing |
| Recharts | 2.15.2 | Data visualization |
| Zod | 4.1.12 | Schema validation |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.13.0 | Runtime |
| Express | 4.21.2 | HTTP server |
| tRPC Server | 11.6.0 | API framework |
| Drizzle ORM | 0.44.5 | Database ORM |
| MySQL2 | 3.15.0 | Database driver |
| Jose | 6.1.0 | JWT handling |
| Axios | 1.12.0 | HTTP client |

### Development & Testing
| Technology | Version | Purpose |
|------------|---------|---------|
| Vitest | 2.1.4 | Unit testing |
| TypeScript | 5.9.3 | Type checking |
| ESBuild | 0.25.0 | Build tool |
| Vite | 7.1.7 | Dev server |
| Prettier | 3.6.2 | Code formatting |

---

## Data Flow

### 1. Authentication Flow

```
User → Login Request → OAuth Provider (Manus)
                              ↓
                        OAuth Callback
                              ↓
                    JWT Token Generation
                              ↓
                    Session Cookie Set
                              ↓
                    User Context Created
                              ↓
                Protected Routes Accessible
```

### 2. Stock Data Retrieval Flow

```
Client → tRPC Query → Server Router → Data API Client
                                            ↓
                                    Yahoo Finance API
                                            ↓
                                    Data Transformation
                                            ↓
                                    Cache Update
                                            ↓
                                    Return to Client
                                            ↓
                                    UI Update
```

### 3. Trade Entry Flow

```
User Input → Form Validation → tRPC Mutation
                                      ↓
                              Business Logic
                                      ↓
                              Database Insert
                                      ↓
                              Performance Calculation
                                      ↓
                              Cache Invalidation
                                      ↓
                              UI Optimistic Update
```

### 4. Price Update Flow

```
Timer Trigger → Fetch Current Prices → API Request
                                            ↓
                                    Batch Processing
                                            ↓
                                    Price Comparison
                                            ↓
                                    Alert Evaluation
                                            ↓
                                    Notification Trigger
                                            ↓
                                    UI State Update
```

---

## Security Architecture

### Authentication & Authorization

**Authentication Method:** OAuth 2.0 via Manus Provider
- Stateless JWT-based sessions
- HTTP-only secure cookies
- CSRF protection via SameSite cookies
- Automatic token refresh

**Authorization Levels:**
1. **Public**: Unauthenticated access (login, public pages)
2. **User**: Authenticated user access (portfolio, trades)
3. **Admin**: Administrative access (system management)

**Implementation:**
```typescript
// Public procedure - no auth required
publicProcedure.query(({ ctx }) => { ... })

// Protected procedure - requires authentication
protectedProcedure.query(({ ctx }) => {
  // ctx.user is guaranteed to exist
  return getUserData(ctx.user.id);
})

// Admin procedure - requires admin role
adminProcedure.query(({ ctx }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
  return getAdminData();
})
```

### Data Security

**Sensitive Data Handling:**
- Environment variables for secrets
- Encrypted database connections
- Secure S3 bucket policies
- API key rotation support

**Input Validation:**
- Zod schema validation on all inputs
- SQL injection prevention via ORM
- XSS protection via React escaping
- CORS configuration

---

## Deployment Architecture

### Development Environment

```
Local Machine
  ├── Vite Dev Server (Port 5173)
  ├── Express Server (Port 3000)
  ├── MySQL Database (Local/Remote)
  └── Hot Module Replacement
```

### Production Environment (Manus Platform)

```
Manus Platform
  ├── Load Balancer
  │     ↓
  ├── Application Instances (Horizontal Scaling)
  │     ├── Static Assets (CDN)
  │     └── API Server (Express + tRPC)
  │           ↓
  ├── Database Cluster (TiDB)
  │     ├── Primary Node
  │     └── Read Replicas
  │           ↓
  └── S3 Storage
        ├── User Uploads
        └── Generated Assets
```

### AWS Deployment (Alternative)

```
AWS Infrastructure
  ├── CloudFront (CDN)
  │     ↓
  ├── Application Load Balancer
  │     ↓
  ├── ECS Fargate (Container Orchestration)
  │     ├── Task Definition
  │     └── Auto Scaling Group
  │           ↓
  ├── RDS MySQL (Multi-AZ)
  │     ├── Primary Instance
  │     └── Read Replica
  │           ↓
  └── S3 Buckets
        ├── Static Assets
        └── User Data
```

**Infrastructure as Code:**
- Terraform for AWS resource provisioning
- Docker for containerization
- GitHub Actions for CI/CD

---

## Testing Strategy

### Unit Testing

**Scope:** Individual functions and components
**Framework:** Vitest
**Coverage Target:** 80%+

**Test Categories:**
1. **Utility Functions** (`client/src/lib/`, `server/db.ts`)
   - Pure function logic
   - Data transformations
   - Calculations

2. **tRPC Procedures** (`server/routers.ts`)
   - Business logic
   - Authorization checks
   - Error handling

3. **React Components** (`client/src/components/`)
   - Rendering logic
   - User interactions
   - State management

**Example:**
```typescript
// server/auth.logout.test.ts
describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    
    expect(result).toEqual({ success: true });
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});
```

### Integration Testing

**Scope:** API endpoints and database interactions
**Framework:** Vitest with test database

**Test Categories:**
1. **API Endpoints**
   - Request/response validation
   - Authentication flows
   - Error scenarios

2. **Database Operations**
   - CRUD operations
   - Transaction integrity
   - Migration verification

### End-to-End Testing

**Scope:** Complete user workflows
**Framework:** Playwright (future implementation)

**Test Scenarios:**
1. User registration and login
2. Portfolio creation and management
3. Trade entry and exit
4. Alert configuration
5. Performance tracking

### Performance Testing

**Scope:** Load and stress testing
**Tools:** k6, Artillery

**Metrics:**
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- Resource utilization

---

## Monitoring & Observability

### Logging

**Strategy:** Structured logging with context
**Levels:** ERROR, WARN, INFO, DEBUG

**Log Categories:**
- Authentication events
- API requests/responses
- Database queries
- External API calls
- Error stack traces

### Metrics

**Key Performance Indicators:**
- API response time
- Database query duration
- Cache hit rate
- Error rate by endpoint
- Active user sessions

### Alerting

**Alert Conditions:**
- Error rate > 5%
- Response time > 2s (p95)
- Database connection failures
- External API failures
- Disk space < 20%

---

## Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- No server-side session storage
- JWT-based authentication
- Database-backed state
- Shared cache layer

**Load Balancing:**
- Round-robin distribution
- Health check endpoints
- Graceful shutdown handling

### Caching Strategy

**Levels:**
1. **Client-side:** React Query cache (5 minutes)
2. **Server-side:** In-memory cache (1 minute)
3. **Database:** Query result caching

**Cache Invalidation:**
- Time-based expiration
- Event-based invalidation
- Manual cache clearing

### Database Optimization

**Strategies:**
- Indexed columns for frequent queries
- Read replicas for reporting
- Connection pooling
- Query optimization

---

## Future Enhancements

### Phase 2 (Q1 2026)
- WebSocket integration for real-time updates
- Advanced charting with TradingView
- Machine learning-based recommendations

### Phase 3 (Q2 2026)
- Mobile application (React Native)
- Social trading features
- Portfolio backtesting

### Phase 4 (Q3 2026)
- Multi-currency support
- International market data
- Advanced risk analytics

---

## Appendix

### A. Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:pass@host:port/db

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im

# External APIs
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Application
NODE_ENV=production
PORT=3000
```

### B. API Endpoints

```
POST /api/trpc/auth.me
POST /api/trpc/auth.logout
POST /api/trpc/portfolio.list
POST /api/trpc/portfolio.create
POST /api/trpc/trades.list
POST /api/trpc/trades.create
POST /api/trpc/alerts.list
POST /api/trpc/alerts.create
```

### C. Database Schema

See `drizzle/schema.ts` for complete schema definition.

### D. Code Style Guide

- **TypeScript:** Strict mode enabled
- **Naming:** camelCase for variables, PascalCase for components
- **Formatting:** Prettier with 2-space indentation
- **Imports:** Absolute imports with `@/` prefix

---

**Document Version:** 1.0.0  
**Last Review:** December 26, 2025  
**Next Review:** March 26, 2026
