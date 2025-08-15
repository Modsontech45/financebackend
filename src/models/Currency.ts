import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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

  @Column({ default: false })
  isDefault: boolean; // Indicates if this is the default currency

  @OneToMany(() => Transaction, (transaction) => transaction.currency)
  transactions: Transaction[];
}
