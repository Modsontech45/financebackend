import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionType } from '../types';
import { Company } from './Company';
import { Currency } from './Currency';

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
  department: string;

  @Column({ nullable: true })
  action: string;

  @Column({ type: 'date' })
  transactionDate: Date;

  @Column({ default: false })
  isLocked: boolean;

  @ManyToOne(() => Company, (company) => company.transactions)
  company: Company;

  @Column()
  companyId: string;

  @ManyToOne(() => Currency, (currency) => currency.transactions)
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
