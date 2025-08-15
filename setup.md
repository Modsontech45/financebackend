# Finance Record Backend - Complete Setup Guide

## Project Structure
```
finance-backend/
├── src/
│   ├── types/
│   │   ├── analytics.types.ts
│   │   ├── company.types.ts
│   │   ├── email.types.ts
│   │   ├── index.ts
│   │   ├── job.types.ts
│   │   ├── notification.types.ts
│   │   ├── queue.types.ts
│   │   ├── transaction.types.ts
│   │   └── user.types.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── company.controller.ts
│   │   ├── transaction.controller.ts
│   │   ├── analytics.controller.ts
│   │   ├── notice.controller.ts
│   │   └── user.controller.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Company.ts
│   │   ├── Transaction.ts
│   │   ├── Currency.ts
│   │   ├── Notice.ts
│   │   └── Subscription.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── company.routes.ts
│   │   ├── transaction.routes.ts
│   │   ├── analytics.routes.ts
│   │   ├── notice.routes.ts
│   │   └── user.routes.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── notification.service.ts
│   │   └── analytics.service.ts
│   ├── utils/
│   │   ├── database.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   └── app.ts
├── tests/
├── docs/
├── .env.example
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .commitlintrc.config.mjs
└── README.md
```

## Step 1: Initialize Project

```bash
mkdir finance-backend
cd finance-backend
npm init -y
```

## Step 2: Install Dependencies

### Core Dependencies
```bash
npm install express cors helmet morgan dotenv
npm install typeorm reflect-metadata pg # or mysql2
npm install bcryptjs jsonwebtoken
npm install nodemailer
npm install multer # for file uploads
npm install joi # for validation
npm install winston # for logging
npm install redis ioredis bullmq
```

### TypeScript & Development Dependencies
```bash
npm install -D typescript @types/node @types/express
npm install -D @types/cors @types/morgan @types/pg
npm install -D @types/jsonwebtoken
npm install -D @types/nodemailer @types/multer
npm install -D ts-node nodemon
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npm install -D jest @types/jest ts-jest supertest @types/supertest
npm install @bull-board/api @bull-board/express @bull-board/ui
```

## Step 3: Configuration Files

### package.json scripts
```json
{
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write src/**/*.ts",
    "prepare": "husky install"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    '@typescript-eslint/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### .commitlintrc.config.mjs
```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore'],
    ],
  },
};
```

## Step 4: Database Models (TypeORM)

### src/models/User.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './Company';

export enum UserRole {
  ADMIN = 'admin',
  MEMBER = 'member'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @ManyToOne(() => Company, company => company.users)
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### src/models/Company.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User';
import { Transaction } from './Transaction';
import { Currency } from './Currency';
import { Notice } from './Notice';
import { Subscription } from './Subscription';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => Currency, currency => currency.companies)
  defaultCurrency: Currency;

  @Column()
  currencyId: string;

  @OneToMany(() => User, user => user.company)
  users: User[];

  @OneToMany(() => Transaction, transaction => transaction.company)
  transactions: Transaction[];

  @OneToMany(() => Notice, notice => notice.company)
  notices: Notice[];

  @ManyToOne(() => Subscription, subscription => subscription.companies)
  subscription: Subscription;

  @Column({ nullable: true })
  subscriptionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### src/models/Transaction.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './Company';
import { Currency } from './Currency';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ nullable: true })
  action: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ default: false })
  isLocked: boolean;

  @ManyToOne(() => Company, company => company.transactions)
  company: Company;

  @Column()
  companyId: string;

  @ManyToOne(() => Currency, currency => currency.transactions)
  currency: Currency;

  @Column()
  currencyId: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### src/models/Currency.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Company } from './Company';
import { Transaction } from './Transaction';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // USD, EUR, GBP, etc.

  @Column()
  name: string;

  @Column()
  symbol: string; // $, €, £, etc.

  @OneToMany(() => Company, company => company.defaultCurrency)
  companies: Company[];

  @OneToMany(() => Transaction, transaction => transaction.currency)
  transactions: Transaction[];
}
```

### src/models/Notice.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Company } from './Company';

export enum NoticeType {
  TEXT = 'text',
  PDF = 'pdf'
}

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: NoticeType })
  type: NoticeType;

  @Column({ type: 'text', nullable: true })
  details: string; // For text type

  @Column({ nullable: true })
  pdfPath: string; // For PDF type

  @Column('simple-array', { nullable: true })
  tags: string[];

  @ManyToOne(() => Company, company => company.notices)
  company: Company;

  @Column()
  companyId: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### src/models/Subscription.ts
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Company } from './Company';

export enum SubscriptionPlan {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: SubscriptionPlan })
  plan: SubscriptionPlan;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  maxTeamMembers: number;

  @Column()
  maxSaves: number;

  @Column({ type: 'text', nullable: true })
  features: string;

  @OneToMany(() => Company, company => company.subscription)
  companies: Company[];
}
```

## Step 5: Database Configuration

### src/config/database.config.ts
```typescript
import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Company } from '../models/Company';
import { Transaction } from '../models/Transaction';
import { Currency } from '../models/Currency';
import { Notice } from '../models/Notice';
import { Subscription } from '../models/Subscription';

export const AppDataSource = new DataSource({
  type: 'postgres', // or 'mysql'
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finance_records',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [User, Company, Transaction, Currency, Notice, Subscription],
  migrations: ['src/migrations/*.ts'],
});
```

## Step 6: Main App Setup

### src/app.ts
```typescript
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/database.config';
import { errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import transactionRoutes from './routes/transaction.routes';
import analyticsRoutes from './routes/analytics.routes';
import noticeRoutes from './routes/notice.routes';
import userRoutes from './routes/user.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');

    // Set up transaction locking job (runs every minute)
    setInterval(async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      await AppDataSource
        .createQueryBuilder()
        .update(Transaction)
        .set({ isLocked: true })
        .where('createdAt <= :date AND isLocked = false', { date: fiveMinutesAgo })
        .execute();
    }, 60000);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

export default app;
```

## Step 7: Environment Variables

### .env.example
```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_NAME=finance_records

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

## Step 8: Setup Husky

```bash
# Initialize husky
npm run prepare

# Add pre-commit hook
npx husky init

# Add commit-msg hook
npm pkg set scripts.commitlint="commitlint --edit"
npx husky add .husky/commit-msg "npx --no-install commitlint --edit $1"
```

### .lintstagedrc.json
```json
{
  "*.{ts,js}": [
    "eslint --fix",
    "prettier --write"
  ]
}
```

## Step 9: Running the Project

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Testing
npm test

# Linting
npm run lint
npm run lint:fix
```

## Next Steps

1. Implement authentication middleware
2. Create validation schemas with Joi
3. Set up email service for user verification
4. Implement analytics calculations
5. Add comprehensive error handling
6. Write unit and integration tests
7. Set up API documentation with Swagger
8. Implement rate limiting and security measures

This setup gives you a solid foundation for your finance record backend with TypeScript, proper tooling, and a clear structure that other developers can easily understand and contribute to.