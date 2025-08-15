# Finance Record Backend - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Design](#architecture--design)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Authentication & Authorization](#authentication--authorization)
6. [Business Logic](#business-logic)
7. [Caching & Queue System](#caching--queue-system)
8. [Installation & Setup](#installation--setup)
9. [Development Workflow](#development-workflow)
10. [Deployment Guide](#deployment-guide)
11. [Testing Strategy](#testing-strategy)
12. [Contributing Guidelines](#contributing-guidelines)

---

## Project Overview

### What is Finance Record Backend?
A comprehensive backend system for managing company financial records, built with Express.js, TypeScript, and TypeORM. The system allows companies to track income/expenses, manage team members, generate analytics, and maintain financial transparency with high-performance caching and background job processing.

### Key Features
- **Multi-tenant Company Management**: Each company operates independently
- **Role-based Access Control**: Admin and Member roles with different permissions
- **Transaction Management**: Track income and expenses with automatic locking
- **Currency Support**: Multi-currency transactions with historical accuracy
- **Analytics Dashboard**: Financial insights and trend analysis with intelligent caching
- **Notice Board**: Company-wide announcements and document sharing
- **Email Notifications**: Automated user verification and notifications via background jobs
- **Subscription Plans**: Tiered access with feature limitations
- **High-Performance Caching**: Redis-powered caching for analytics and session management
- **Background Job Processing**: BullMQ-powered email delivery and analytics computation
- **Real-time Queue Monitoring**: Development dashboard for job queue visibility

### Target Users
- **Company Admins**: Manage financial records, team members, and company settings
- **Team Members**: View financial data and receive company notices
- **Developers**: Learn Express.js backend development patterns with modern queue and caching systems

---

## Architecture & Design

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (External)    │◄──►│   Express.js    │◄──►│   MySQL/PG      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │     Redis       │
                       │   Cache & Queue │
                       └─────────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │  Email   │ │Analytics │ │Notification│
              │ Worker   │ │ Worker   │ │  Worker   │
              └──────────┘ └──────────┘ └──────────┘
```

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MySQL/PostgreSQL with TypeORM
- **Caching**: Redis with ioredis client
- **Queue System**: BullMQ for background job processing
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer with queue-based delivery
- **Validation**: Joi
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier + Husky
- **Monitoring**: BullMQ Dashboard for queue visibility

### Project Structure
```
finance-backend/
├── src/
│   ├── controllers/         # Request handlers
│   ├── models/             # Database entities
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom middleware
│   ├── services/           # Business logic
│   ├── workers/            # Background job processors
│   ├── utils/              # Helper functions
│   ├── config/             # Configuration files
│   └── app.ts              # Application entry point
├── tests/                  # Test files
├── docs/                   # Documentation
├── uploads/                # File storage
└── package.json            # Dependencies
```

---

## Database Schema

### Entity Relationship Diagram
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │     │   Company   │     │ Subscription│
│─────────────│     │─────────────│     │─────────────│
│ id (PK)     │────►│ id (PK)     │────►│ id (PK)     │
│ email       │     │ name        │     │ plan        │
│ password    │     │ ownerId     │     │ maxMembers  │
│ role        │     │ currencyId  │     │ maxSaves    │
│ companyId   │     └─────────────┘     └─────────────┘
│ isVerified  │            │
└─────────────┘            │
                           ▼
                    ┌─────────────┐     ┌─────────────┐
                    │Transaction  │     │   Currency  │
                    │─────────────│     │─────────────│
                    │ id (PK)     │────►│ id (PK)     │
                    │ name        │     │ code        │
                    │ amount      │     │ name        │
                    │ type        │     │ symbol      │
                    │ companyId   │     └─────────────┘
                    │ currencyId  │
                    │ isLocked    │     ┌─────────────┐
                    └─────────────┘     │ Redis Cache │
                                       │─────────────│
                    ┌─────────────┐     │ analytics:* │
                    │   Notice    │     │ session:*   │
                    │─────────────│     │ queue:*     │
                    │ id (PK)     │     └─────────────┘
                    │ title       │
                    │ type        │
                    │ details     │
                    │ companyId   │
                    │ createdBy   │
                    └─────────────┘
```

### Table Descriptions

#### Users Table
Stores all system users (admins and members).
- **Primary Key**: `id` (UUID)
- **Unique Fields**: `email`
- **Relationships**: Belongs to one Company
- **Key Fields**: `role` (admin/member), `isEmailVerified`
- **Cache Integration**: User sessions cached in Redis for 24 hours

#### Companies Table
Central entity representing each organization.
- **Primary Key**: `id` (UUID)
- **Relationships**: Has many Users, Transactions, Notices
- **Key Fields**: `ownerId` (admin user), `defaultCurrency`
- **Cache Integration**: Analytics data cached per company

#### Transactions Table
Financial records (income/expense entries).
- **Primary Key**: `id` (UUID)
- **Key Fields**: `type` (income/expense), `isLocked`, `amount`
- **Business Rule**: Locked after 5 minutes of creation
- **Cache Integration**: Triggers analytics cache invalidation on create/update

#### Currency Table
Supported currencies for multi-currency support.
- **Primary Key**: `id` (UUID)
- **Key Fields**: `code` (USD, EUR), `symbol` ($, €)

#### Notices Table
Company announcements and document sharing.
- **Primary Key**: `id` (UUID)
- **Key Fields**: `type` (text/pdf), `details`, `pdfPath`
- **Queue Integration**: Triggers notification emails via BullMQ

#### Subscriptions Table
Subscription plans with feature limitations.
- **Primary Key**: `id` (UUID)
- **Key Fields**: `plan`, `maxTeamMembers`, `maxSaves`

---

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/register          # Admin registration + queued verification email
POST   /api/auth/login             # User login + session caching
POST   /api/auth/verify-email      # Email verification
POST   /api/auth/forgot-password   # Password reset request + queued email
POST   /api/auth/reset-password    # Password reset
POST   /api/auth/refresh           # Refresh JWT token
```

### Company Management
```
GET    /api/companies/:id          # Get company details (cached)
PUT    /api/companies/:id          # Update company (admin only) + cache invalidation
POST   /api/companies/:id/members  # Add team member (admin only) + queued verification
GET    /api/companies/:id/members  # List team members (cached)
DELETE /api/companies/:id/members/:userId # Remove member (admin only)
```

### Transaction Management
```
GET    /api/transactions           # List transactions (paginated, cached)
POST   /api/transactions           # Create new transaction + analytics cache invalidation
GET    /api/transactions/:id       # Get transaction details (cached)
PUT    /api/transactions/:id       # Update transaction (if not locked) + cache invalidation
DELETE /api/transactions/:id       # Delete transaction (if not locked) + cache invalidation
GET    /api/transactions/export    # Export transactions (CSV/Excel)
```

### Analytics Endpoints
```
GET    /api/analytics/summary      # Financial summary (cached 30 mins, background refresh)
GET    /api/analytics/monthly      # Monthly income/expense chart (cached)
GET    /api/analytics/trends       # Profit trends (cached)
GET    /api/analytics/distribution # Expense/income distribution (cached)
GET    /api/analytics/highest      # Highest income/expense records (cached)
POST   /api/analytics/refresh      # Force analytics recalculation (queued)
```

### Notice Board
```
GET    /api/notices               # List company notices (cached)
POST   /api/notices               # Create notice (admin only) + queued notifications
GET    /api/notices/:id           # Get notice details (cached)
PUT    /api/notices/:id           # Update notice (admin only) + cache invalidation
DELETE /api/notices/:id           # Delete notice (admin only) + cache invalidation
GET    /api/notices/:id/download  # Download PDF notice
```

### User Profile
```
GET    /api/users/profile         # Get current user profile (cached)
PUT    /api/users/profile         # Update user profile + cache invalidation
PUT    /api/users/password        # Change password
PUT    /api/users/email           # Update email (requires verification) + queued email
GET    /api/users/settings        # Get user preferences (cached)
PUT    /api/users/settings        # Update user preferences + cache invalidation
```

### Queue Management (Development)
```
GET    /admin/queues              # BullMQ Dashboard for queue monitoring
GET    /api/queues/stats          # Queue statistics and health
POST   /api/queues/retry/:jobId   # Retry failed job
DELETE /api/queues/clean          # Clean completed jobs
```

### Request/Response Examples

#### Create Transaction (with Cache Invalidation)
```json
// POST /api/transactions
{
  "name": "Office Supplies",
  "amount": 150.00,
  "type": "expense",
  "transactionDate": "2025-07-29",
  "comment": "Purchased stationery and printer ink",
  "action": "office_supplies"
}

// Response
{
  "status": "success",
  "data": {
    "id": "uuid-here",
    "name": "Office Supplies",
    "amount": 150.00,
    "type": "expense",
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "isLocked": false,
    "createdAt": "2025-07-29T10:30:00Z"
  },
  "meta": {
    "analyticsRefreshQueued": true,
    "cacheInvalidated": ["analytics:company-id", "transactions:company-id"]
  }
}
```

#### Get Analytics Summary (Cached Response)
```json
// GET /api/analytics/summary
{
  "status": "success",
  "data": {
    "totalIncome": 45000.00,
    "totalExpenses": 32000.00,
    "netProfit": 13000.00,
    "transactionCount": 156,
    "currency": {
      "code": "USD",
      "symbol": "$"
    },
    "period": {
      "from": "2025-01-01",
      "to": "2025-07-29"
    }
  },
  "meta": {
    "cached": true,
    "cacheAge": 1200,
    "nextRefresh": "2025-07-29T11:00:00Z"
  }
}
```

---

## Authentication & Authorization

### Authentication Flow
1. **User Registration**: Admin creates account with email verification
2. **Email Verification**: User receives email via background queue with verification token
3. **Login**: User authenticates with email/password
4. **JWT Token**: Server returns JWT access token and refresh token
5. **Session Caching**: User session cached in Redis for fast authentication
6. **Protected Routes**: Client sends JWT in Authorization header

### Role-Based Access Control

#### Admin Permissions
- Create, read, update, delete transactions
- Manage company settings
- Add/remove team members
- Create notices and announcements
- Access all analytics
- Export financial data
- Force analytics refresh
- Access queue management endpoints

#### Member Permissions
- Read-only access to transactions
- View company notices
- Access basic analytics
- Update own profile

### Security Measures
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Short-lived access tokens + refresh tokens
- **Session Caching**: Redis-based session management with TTL
- **Rate Limiting**: Prevent brute force attacks
- **Input Validation**: Joi schema validation
- **CORS Configuration**: Controlled cross-origin requests
- **Helmet Security**: HTTP security headers

---

## Business Logic

### Transaction Locking System
**Purpose**: Prevent accidental modification of financial records

**Implementation**:
- Background job runs every minute
- Automatically locks transactions older than 5 minutes
- Locked transactions cannot be edited or deleted
- Provides data integrity and audit trail
- Analytics cache invalidated when transactions are locked

```typescript
// Auto-lock transactions after 5 minutes
setInterval(async () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const updatedTransactions = await AppDataSource
    .createQueryBuilder()
    .update(Transaction)
    .set({ isLocked: true })
    .where('createdAt <= :date AND isLocked = false', { date: fiveMinutesAgo })
    .returning('companyId')
    .execute();

  // Invalidate analytics cache for affected companies
  for (const transaction of updatedTransactions.raw) {
    await CacheService.invalidateAnalytics(transaction.companyId);
  }
}, 60000);
```

### Currency Handling
**Problem**: When companies change default currency, historical data remains accurate

**Solution**:
- Each transaction stores its currency at creation time
- Company currency changes don't affect existing transactions
- Frontend handles currency conversion for display
- Backend always returns transaction with original currency
- Currency data cached to reduce database queries

### Email Notification System
**User Verification Flow**:
1. Admin adds new member with email
2. System queues verification email job in BullMQ
3. Email worker processes job with automatic retries
4. User clicks link and sets password
5. Account becomes active

**Notice Notifications**:
- Email queued when new notice is created
- Background worker sends emails to all company members
- Failed emails automatically retried with exponential backoff
- Users can configure email preferences

**Queue Benefits**:
- Immediate API responses (emails sent asynchronously)
- Automatic retry on failures
- Rate limiting and prioritization
- Monitoring via BullMQ dashboard

### Subscription Limitations
**Basic Plan**:
- Max 5 team members
- Max 100 saved transactions
- Basic analytics

**Premium Plan**:
- Max 20 team members
- Max 1000 saved transactions
- Advanced analytics

**Enterprise Plan**:
- Unlimited team members
- Unlimited transactions
- Full analytics suite

---

## Caching & Queue System

### Redis Caching Strategy

#### Cache Types
- **Analytics Cache**: 30-minute TTL for expensive calculations
- **Session Cache**: 24-hour TTL for user authentication
- **Query Cache**: 5-minute TTL for frequently accessed data
- **Company Data Cache**: 1-hour TTL for company settings

#### Cache Keys Pattern
```
analytics:{companyId}        # Company analytics data
session:{userId}             # User session data
transactions:{companyId}     # Paginated transaction lists
company:{companyId}          # Company details
currency:all                 # Currency list (rarely changes)
```

#### Cache Invalidation Strategy
- **Transaction Changes**: Invalidate analytics and transaction caches
- **Company Updates**: Invalidate company and related caches
- **User Updates**: Invalidate session cache
- **Notice Creation**: Invalidate notice list cache

### BullMQ Queue System

#### Queue Types
1. **Email Queue**: User verification, password reset, notice notifications
2. **Analytics Queue**: Background calculation of financial analytics
3. **Notification Queue**: Push notifications and alerts

#### Job Priorities
- **High Priority (8-10)**: Verification emails, password resets
- **Medium Priority (3-5)**: Notice notifications, user communications
- **Low Priority (1-2)**: Analytics calculations, maintenance tasks

#### Queue Configuration
```typescript
// Email Queue - High reliability
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 50,
  removeOnFail: 100
}

// Analytics Queue - Performance focused
{
  attempts: 2,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 20,
  removeOnFail: 50
}
```

#### Background Workers
- **Email Worker**: Processes 5 concurrent email jobs
- **Analytics Worker**: Processes 3 concurrent calculation jobs
- **Notification Worker**: Processes 10 concurrent notification jobs

### Performance Benefits

#### Before Cache/Queue Implementation
- Analytics API: 2-5 seconds response time
- Email sending: Blocking API calls
- Database load: High on complex queries
- User experience: Slow responses, timeouts

#### After Cache/Queue Implementation
- Analytics API: 50-200ms response time (cached)
- Email sending: Immediate API response
- Database load: Reduced by 70%
- User experience: Fast, responsive interface

#### Monitoring & Metrics
- Queue job success/failure rates
- Cache hit/miss ratios
- Worker processing times
- Memory usage optimization

---

## Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- MySQL or PostgreSQL database
- Redis server (v6+ recommended)
- SMTP email service (Gmail, SendGrid, etc.)

### Quick Start
```bash
# 1. Clone repository
git clone <repository-url>
cd finance-backend

# 2. Install dependencies
npm install

# 3. Environment setup
cp .env.example .env
# Edit .env with your configuration

# 4. Start Redis server (if not running)
redis-server

# 5. Database setup
npm run db:migrate
npm run db:seed

# 6. Start development server (includes workers)
npm run dev
```

### Environment Variables
```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=finance_records

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000

# BullMQ Dashboard (development only)
BULL_BOARD_USERNAME=admin
BULL_BOARD_PASSWORD=your_secure_password
```

### Database Migration
```bash
# Generate migration
npm run migration:generate -- -n CreateInitialTables

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Redis Setup
```bash
# Install Redis (Ubuntu/Debian)
sudo apt update
sudo apt install redis-server

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test Redis connection
redis-cli ping
# Should return: PONG

# Monitor Redis in development
redis-cli monitor
```

### Queue Monitoring
```bash
# Development: Access BullMQ Dashboard
http://localhost:3000/admin/queues

# Production: Monitor queue stats
curl http://localhost:3000/api/queues/stats
```

---

## Development Workflow

### Git Workflow
1. **Feature Branch**: Create branch from `main`
2. **Development**: Write code with tests
3. **Cache/Queue Testing**: Test with Redis running
4. **Commit**: Use conventional commits
5. **Pull Request**: Create PR with description
6. **Review**: Code review and approval
7. **Merge**: Merge to main branch

### Commit Message Format
```
type(scope): description

feat(cache): add Redis analytics caching
feat(queue): implement BullMQ email processing
fix(worker): resolve email worker retry logic
docs(readme): update queue system documentation
test(cache): add unit tests for cache service
```

### Development Environment Setup

#### Required Services
```bash
# Terminal 1: Database
mysql -u root -p # or PostgreSQL

# Terminal 2: Redis Server
redis-server

# Terminal 3: Redis Monitor (optional)
redis-cli monitor

# Terminal 4: Application
npm run dev
```

#### Queue Dashboard Access
- **URL**: http://localhost:3000/admin/queues
- **Username**: admin (from .env)
- **Password**: your_secure_password (from .env)

### Code Quality Tools

#### ESLint Configuration
- TypeScript strict rules
- No unused variables
- Consistent code style
- Import/export organization
- Redis/Queue specific linting rules

#### Prettier Configuration
- 2-space indentation
- Single quotes
- Trailing commas
- Line width 80 characters

#### Husky Hooks
- **Pre-commit**: Run ESLint, Prettier, and Redis connection test
- **Commit-msg**: Validate commit message format
- **Pre-push**: Run tests including cache/queue integration tests

### Testing Strategy
```bash
# Unit tests (including cache/queue mocks)
npm run test:unit

# Integration tests (requires Redis)
npm run test:integration

# End-to-end tests (full system)
npm run test:e2e

# Cache-specific tests
npm run test:cache

# Queue-specific tests
npm run test:queue

# Coverage report
npm run test:coverage
```

### Cache & Queue Development Tips

#### Cache Development
```typescript
// Always provide fallback for cache misses
const data = await CacheService.get(key) || await fetchFromDatabase();

// Use consistent cache key patterns
const cacheKey = `analytics:${companyId}:summary`;

// Set appropriate TTL based on data volatility
await CacheService.set(key, data, 1800); // 30 minutes for analytics
```

#### Queue Development
```typescript
// Always handle job failures gracefully
try {
  await processJob(jobData);
} catch (error) {
  console.error('Job failed:', error);
  throw error; // Let BullMQ handle retries
}

// Use appropriate job priorities
await emailQueue.add('send-verification', data, { priority: 10 });
```

---

## Deployment Guide

### Production Environment Setup

#### 1. Server Requirements
- Ubuntu 20.04 LTS or similar
- Node.js v16+
- PM2 process manager
- Nginx reverse proxy
- SSL certificate (Let's Encrypt)
- Redis server (with persistence enabled)

#### 2. Database Setup
```bash
# Install MySQL
sudo apt update
sudo apt install mysql-server

# Create database and user
mysql -u root -p
CREATE DATABASE finance_records;
CREATE USER 'finance_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON finance_records.* TO 'finance_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 3. Redis Setup
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis for production
sudo nano /etc/redis/redis.conf

# Key configurations:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 4. Application Deployment
```bash
# Clone and build
git clone <repository-url> /var/www/finance-backend
cd /var/www/finance-backend
npm install --production
npm run build

# Install PM2
npm install -g pm2

# Create ecosystem config
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'finance-api',
      script: 'dist/app.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'finance-workers',
      script: 'dist/workers/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 5. Nginx Configuration
```nginx
upstream finance_backend {
    server localhost:3000;
    server localhost:3001;
}

server {
    listen 80;
    server_name your-domain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    location /api/auth {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://finance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://finance_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Disable queue dashboard in production
    location /admin/queues {
        return 403;
    }
}
```

#### 6. SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker Deployment
```dockerfile
FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose with Redis
```yaml
services:
  app:
    build: .
    ports:
      - "5000:3000"
    depends_on:
      - postgres
      - redis
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    volumes:
      - ./uploads:/app/uploads
    restart: unless-stopped

  postgres:
    image: postgres:17-alpine
    environment:
      - POSTGRES_DB=finance_records
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    restart: unless-stopped

  redis:
    image: redis:8-alpine
    command: redis-server --appendonly yes
    ports:
      - "6399:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # Optional: Redis monitoring
  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis

volumes:
  postgres_data:
  redis_data:
```

### Environment-Specific Configurations

#### Development
- Debug logging enabled
- Hot reload with nodemon
- Detailed error messages
- Database synchronization
- BullMQ dashboard enabled
- Redis monitoring enabled

#### Production
- Error logging only
- Process clustering
- Security headers
- Rate limiting
- Health check endpoints
- Redis persistence enabled
- Queue job retention optimized
- Cache TTL optimized for production load

### Monitoring & Maintenance

#### Redis Monitoring
```bash
# Monitor Redis performance
redis-cli info stats
redis-cli info memory
redis-cli info clients

# Monitor cache hit rates
redis-cli info stats | grep keyspace
```

#### Queue Monitoring
```bash
# Check queue health
curl http://localhost:3000/api/queues/stats

# Clear old completed jobs (cron job)
0 2 * * * curl -X DELETE http://localhost:3000/api/queues/clean
```

---

## Testing Strategy

### Testing Pyramid

#### Unit Tests (70%)
Test individual functions and classes in isolation.

```typescript
// Example: Transaction service test
describe('TransactionService', () => {
  it('should create transaction with correct currency', async () => {
    const mockTransaction = {
      name: 'Test Transaction',
      amount: 100,
      type: 'income'
    };

    const result = await transactionService.create(mockTransaction, companyId);

    expect(result.currency.code).toBe('USD');
    expect(result.isLocked).toBe(false);
  });
});
```

#### Integration Tests (20%)
Test API endpoints and database interactions.

```typescript
// Example: Transaction API test
describe('POST /api/transactions', () => {
  it('should create transaction and return 201', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Office Supplies',
        amount: 150.00,
        type: 'expense'
      });

    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('Office Supplies');
  });
});
```

#### End-to-End Tests (10%)
Test complete user workflows.

```typescript
// Example: User registration flow
describe('User Registration Flow', () => {
  it('should register, verify email, and login', async () => {
    // 1. Register user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    // 2. Verify email
    const verifyResponse = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: registerResponse.body.verificationToken });

    // 3. Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(loginResponse.body.token).toBeDefined();
  });
});
```

### Test Data Management
- Use factories for test data generation
- Database seeding for consistent test environment
- Cleanup after each test run
- Mock external services (email, payment)

---

## Contributing Guidelines

### Getting Started
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes with tests
4. Commit changes: `git commit -m 'feat: add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards
- Follow TypeScript strict mode
- Write self-documenting code
- Add JSDoc comments for public APIs
- Maintain test coverage above 80%
- Use meaningful variable and function names

### Pull Request Process
1. Ensure all tests pass
2. Update documentation if needed
3. Add reviewers from CODEOWNERS
4. Respond to review feedback
5. Squash commits before merge

### Issue Reporting
When reporting bugs, include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs/screenshots

### Feature Requests
For new features, provide:
- Clear use case description
- Proposed solution
- Alternative approaches considered
- Impact on existing functionality

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database service
sudo systemctl status mysql

# Verify credentials
mysql -u finance_user -p -h localhost finance_records

# Check firewall
sudo ufw status
```

#### JWT Token Errors
- Verify JWT_SECRET in environment
- Check token expiration time
- Ensure proper Authorization header format

#### Email Not Sending
- Verify SMTP credentials
- Check firewall blocking port 587
- Enable "Less secure app access" for Gmail
- Use app-specific passwords

#### File Upload Issues
- Check UPLOAD_PATH permissions
- Verify MAX_FILE_SIZE setting
- Ensure disk space available

### Performance Optimization

#### Database Optimization
- Add indexes on frequently queried columns
- Use connection pooling
- Implement query result caching
- Regular database maintenance

#### Application Optimization
- Enable compression middleware
- Implement response caching
- Use CDN for static assets
- Monitor memory usage

#### Monitoring & Logging
- Set up application monitoring (New Relic, DataDog)
- Implement structured logging
- Create health check endpoints
- Set up alerts for errors

---

## API Documentation

### Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

### Response Format
All API responses follow consistent format:
```json
{
  "status": "success|error",
  "message": "Human readable message",
  "data": {}, // Response data
  "meta": {   // Pagination, etc.
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `422` - Unprocessable Entity (business logic error)
- `500` - Internal Server Error

### Rate Limiting
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

---

This documentation provides a comprehensive guide for developers at all levels to understand, set up, and contribute to the Finance Record Backend project. Keep this documentation updated as the project evolves.# financebackend
