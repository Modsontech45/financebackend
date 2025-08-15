import { DataSource } from 'typeorm';
import { Company } from '../models/Company';
import { Currency } from '../models/Currency';
import { Invite } from '../models/Invite';
import { Notice } from '../models/Notice';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { Subscription } from '../models/Subscription';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import './load-env';

export const AppDataSource = new DataSource({
  type: 'postgres', // or 'mysql'
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'finance_records',
  synchronize: process.env.NODE_ENV === 'development',
  // logging: process.env.NODE_ENV === 'development',
  entities: [
    User,
    Company,
    Transaction,
    Currency,
    Notice,
    Subscription,
    Permission,
    Role,
    Invite,
  ],
  migrations: ['src/migrations/*.ts'],
});
