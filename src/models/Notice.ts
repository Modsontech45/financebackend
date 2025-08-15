import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './Company';

export enum NoticeType {
  TEXT = 'text',
  PDF = 'pdf',
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

  @ManyToOne(() => Company, (company) => company.notices)
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
