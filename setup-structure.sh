#!/bin/bash

mkdir -p finance-backend/src/{controllers,models,routes,middleware,services,utils,config,workers,types}
mkdir -p finance-backend/{tests,docs}

# Controllers
touch finance-backend/src/controllers/{auth.controller.ts,company.controller.ts,transaction.controller.ts,analytics.controller.ts,notice.controller.ts,user.controller.ts}

# Models
touch finance-backend/src/models/{User.ts,Company.ts,Transaction.ts,Currency.ts,Notice.ts,Subscription.ts}

# Routes
touch finance-backend/src/routes/{auth.routes.ts,company.routes.ts,transaction.routes.ts,analytics.routes.ts,notice.routes.ts,user.routes.ts}

# Middleware
touch finance-backend/src/middleware/{auth.middleware.ts,validation.middleware.ts,error.middleware.ts}

# Services
touch finance-backend/src/services/{cache.service.ts,email.service.ts,notification.service.ts,analytics.service.ts,queue.service.ts}

# Utils
touch finance-backend/src/utils/{database.ts,logger.ts,helpers.ts}

# Config
touch finance-backend/src/config/{database.config.ts,app.config.ts,redis.config.ts, queue.config.ts}

# Types
touch finance-backend/src/types/{email.types.ts,notification.types.ts,analytics.types.ts,queue.types.ts,job.types.ts,transaction.types.ts,user.types.ts,index.ts,company.types.ts}


# Main App Entry
touch finance-backend/src/app.ts

# Workers
touch finance-backend/src/workers/{transaction.worker.ts,notification.worker.ts,email.worker.ts,analytics.worker.ts}

# Project Root Files
touch finance-backend/{.env.example,package.json,tsconfig.json,.eslintrc.js,.prettierrc,.commitlintrc.config.mjs,README.md}
