// src/config/load-env.ts
import path from 'path';
import dotenv from 'dotenv';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const envFile = path.resolve(
  process.cwd(),
  `.env.${NODE_ENV === 'development' ? 'local' : NODE_ENV === 'production' ? 'prod' : NODE_ENV}`
);

dotenv.config({ path: envFile });

console.log(`Loaded environment: ${NODE_ENV} → ${envFile}`);
