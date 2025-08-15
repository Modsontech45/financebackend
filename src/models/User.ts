import bcrypt from 'bcryptjs';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserStatus } from '../types';
import { Company } from './Company';
import { Role } from './Role';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', generated: 'increment', unique: true })
  serialNumber: number;

  @Column()
  firstName: string;

  @Column({ nullable: true, default: '' })
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  password: string; // Nullable for OAuth users

  @Column({ nullable: true })
  googleId: string; // For Google OAuth

  // @Column({ nullable: true })
  // githubId: string; // For GitHub OAuth

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isOnboarding: boolean; // for oauth to know if company need to be setup

  @Column({ nullable: true })
  phoneNumber: string; // Nullable for users without a phone number

  @Column({ nullable: true })
  profilePicture: string; // Nullable for users without a profile picture

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin: Date; // Nullable for users who haven't logged in yet

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockUntil: Date | null; // Nullable for users who are not locked out

  @ManyToMany(() => Role, (role) => role.users, {
    cascade: ['update'],
    eager: true,
  })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @ManyToOne(() => Company, (company) => company.users, { eager: true })
  company: Company;

  @Column({ nullable: true })
  companyId: string;

  @Column({ nullable: true })
  invitedBy: string;

  @Column({ type: 'timestamptz', nullable: true })
  joinedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @BeforeInsert()
  setPlaceholderName() {
    if (!this.firstName?.trim()) {
      this.firstName = 'User';
    }
    if (!this.lastName?.trim()) {
      this.lastName = this.id
        ? this.id.split('-')[0]
        : Math.random().toString(36).slice(2, 7);
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Instance methods
  async validatePassword(candidatePassword: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
  }

  async updateLoginDetails() {
    this.loginAttempts += 1;
    this.lastLogin = new Date();
  }

  get isLocked(): boolean {
    return !!(this.lockUntil && this.lockUntil > new Date());
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  toSafeObject() {
    const { password: _password, ...safeUser } = this;
    return safeUser;
  }
}
