import './config/load-env';
import './config/oauth.config'; // Initialize passport strategies
// Do not remove below lines as .vscode setting will
// update import order and will break .env load
// and cause app crash
//

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import 'reflect-metadata';
import { AppDataSource } from './config/database.config';
import { errorHandler } from './middleware/error.middleware';

// Import route factories
import authRoutes from './routes/auth.routes';

// Import services and controllers

// Import models

// import companyRoutes from './routes/company.routes';
import transactionRoutes from './routes/transaction.routes';
// import analyticsRoutes from './routes/analytics.routes';
// import noticeRoutes from './routes/notice.routes';
import { analyticsQueue, emailQueue, notificationQueue } from './config/queue.config';
import redisClient from './config/redis.config';
import { Transaction } from './models/Transaction';
import userRoutes from './routes/user.routes';
import './workers/analytics.worker';
import './workers/email.worker';

// dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware

//Security Middleware
app.use(helmet());

// CORS Middleware
app.use(cors());
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:3000',
//   credentials: true,
//   optionsSuccessStatus: 200
// }));

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Body Parsing Middleware
app.use(express.json({ limit: '10mb', }));
app.use(express.urlencoded({ limit: '10mb', extended: true, }));
// Global middleware to check for empty bodies on POST/PUT/PATCH
app.use((req, res, next) => {
    if (req.body === null || req.body === undefined) {
        req.body = {};
    }
    next();
});
app.use((req, res, next) => {
    const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
    //|| Object.keys(req.body).length === 0
    if (methodsRequiringBody.includes(req.method) &&
        (!req.body)) {
        return res.status(400).json({
            error: 'Request body is required for this operation'
        });
    }

    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Finance Record Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// BullMQ Dashboard (development only)
if (process.env.NODE_ENV === 'development') {
    const serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues')


    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
        queues: [
            new BullMQAdapter(emailQueue),
            new BullMQAdapter(analyticsQueue),
            new BullMQAdapter(notificationQueue),
        ],
        serverAdapter: serverAdapter,
    });
    app.use('/admin/queues', serverAdapter.getRouter());
    console.log('🔧 BullMQ Dashboard available at http://localhost:3000/admin/queues');
}

app.use('/api/auth', authRoutes);
// app.use('/api/companies', companyRoutes);
app.use('/api/transactions', transactionRoutes);
// app.use('/api/analytics', analyticsRoutes);
// app.use('/api/notices', noticeRoutes);
app.use('/api/users', userRoutes);

// Error handling
// app.use(errorHandler);

// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        status: 'success',
        message: 'Finance Record Backend API',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                verifyEmail: 'POST /api/auth/verify-email',
                forgotPassword: 'POST /api/auth/forgot-password',
                resetPassword: 'POST /api/auth/reset-password',
                refresh: 'POST /api/auth/refresh'
            },
            companies: {
                getCompany: 'GET /api/companies/:id',
                updateCompany: 'PUT /api/companies/:id',
                addMember: 'POST /api/companies/:id/members',
                getMembers: 'GET /api/companies/:id/members',
                removeMember: 'DELETE /api/companies/:id/members/:userId',
                updateMemberRole: 'PUT /api/companies/:id/members/:userId/role',
                resendInvitation: 'POST /api/companies/:id/members/:userId/resend-invitation',
                getCurrencies: 'GET /api/companies/currencies'
            }
        }
    });
});

// 404 handler
// app.use(notFound);

// Global error handler
app.use(errorHandler);


// Initialize database and start server
async function startServer() {
    try {
        console.log('🔄 Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Database connected successfully');
        // await AppDataSource.dropDatabase();
        // await AppDataSource.synchronize(); // Recreates all tables
        // console.log('Database dropped and recreated.');
        // Connect to Redis
        await redisClient.connect();
        console.log('✅ Redis connected successfully');

        // Initialize services after database connection
        console.log('🔄 Initializing services...');


        console.log('✅ Services initialized successfully');

        // Set up transaction auto-locking job (runs every minute)
        console.log('🔄 Setting up transaction auto-locking...');
        setInterval(async () => {
            try {
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

                const result = await AppDataSource
                    .createQueryBuilder()
                    .update(Transaction)
                    .set({ isLocked: true })
                    .where('createdAt <= :date AND isLocked = false', { date: fiveMinutesAgo })
                    .execute();

                if (result.affected && result.affected > 0) {
                    console.log(`🔒 Auto-locked ${result.affected} transactions`);
                }
            } catch (error) {
                console.error('❌ Transaction auto-lock error:', error);
            }
        }, 60000); // Run every minute

        app.listen(+PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
            console.log(`❤️  Health Check: http://localhost:${PORT}/health`);

            if (process.env.NODE_ENV === 'development') {
                console.log('');
                console.log('📋 Development Endpoints:');
                console.log(`   Auth: http://localhost:${PORT}/api/auth`);
                console.log(`   BullMq: http://localhost:${PORT}/admin/queues`);
                console.log(`   Companies: http://localhost:${PORT}/api/companies`);
                console.log('');
                console.log('🔑 Don\'t forget to:');
                console.log('   1. Run database migrations');
                console.log('   2. Seed initial data: npm run db:seed');
                console.log('   3. Start Redis server for caching/queues');
                console.log('   4. Configure email settings in .env');
            }
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received, shutting down gracefully...');

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }

    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🔄 SIGINT received, shutting down gracefully...');

    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ Database connection closed');
    }

    process.exit(0);
});

// Start the server
startServer();

export default app;