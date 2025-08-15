import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Company } from '../models/Company';
import { Role } from '../models/Role';
import { Subscription, SubscriptionPlan } from '../models/Subscription';
import { User } from '../models/User';
import { LoginData, RateLimitData, RegisterData, TokenData } from '../types/';
import { ROLE_ENUM } from '../utils/constant';
import { InternalError, NotFoundError, ValidationError } from '../utils/error';
import { CacheService } from './cache.service';
import { CurrencyService } from './currency.service';
import { EmailService } from './email.service';
import { JWTService } from './jwt.service';
import { RBACService } from './rbac.service';

// Simple constants
const TOKEN_EXPIRY = {
  verify: 24 * 60 * 60, // 24 hours in seconds
  reset: 1 * 60 * 60, // 1 hour in seconds
};

const RATE_LIMIT = {
  window: 60 * 60, // 1 hour in seconds
  maxAttempts: 5,
  blockDuration: 15 * 60, // 15 minutes in seconds
};

export class AuthService {
  private userRepo: Repository<User>;
  private roleRepo: Repository<Role>;
  private companyRepo: Repository<Company>;
  private subscriptionRepo: Repository<Subscription>;
  private jwtService: JWTService;
  private rbacService: RBACService;
  private currencyService: CurrencyService;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.roleRepo = AppDataSource.getRepository(Role);
    this.companyRepo = AppDataSource.getRepository(Company);
    this.subscriptionRepo = AppDataSource.getRepository(Subscription);
    this.jwtService = JWTService.getInstance();
    this.rbacService = new RBACService();
    this.currencyService = new CurrencyService();
  }

  // Simple rate limiting check
  private async checkRateLimit(
    identifier: string,
    operation: string
  ): Promise<void> {
    console.log('checkRateLimit identifier:', typeof identifier, identifier);

    console.log(identifier);
    const key = `rate_limit:${operation}:${identifier}`;
    const rateLimitData = (await CacheService.get(key)) as RateLimitData | null;
    const now = Date.now();
    // console.log(rateLimitData)
    if (!rateLimitData) {
      await CacheService.set(
        key,
        {
          attempts: 1,
          windowStart: now,
          blocked: false,
        } as RateLimitData,
        RATE_LIMIT.window
      );
      return;
    }

    // Check if user is currently blocked
    if (
      rateLimitData.blocked &&
      rateLimitData.blockExpires &&
      now < rateLimitData.blockExpires
    ) {
      const minutesLeft = Math.ceil(
        (rateLimitData.blockExpires - now) / (60 * 1000)
      );
      throw new ValidationError(
        `Too many attempts. Try again in ${minutesLeft} minutes.`
      );
    }

    const windowExpired =
      now - rateLimitData.windowStart > RATE_LIMIT.window * 1000;

    if (windowExpired) {
      await CacheService.set(
        key,
        {
          attempts: 1,
          windowStart: now,
          blocked: false,
        } as RateLimitData,
        RATE_LIMIT.window
      );
      return;
    }

    if (rateLimitData.attempts >= RATE_LIMIT.maxAttempts) {
      const blockExpires = now + RATE_LIMIT.blockDuration * 1000;
      await CacheService.set(
        key,
        {
          ...rateLimitData,
          blocked: true,
          blockExpires,
        } as RateLimitData,
        RATE_LIMIT.blockDuration
      );

      const minutesLeft = Math.ceil(RATE_LIMIT.blockDuration / 60);
      throw new Error(
        `Too many attempts. Try again in ${minutesLeft} minutes.`
      );
    }

    await CacheService.set(
      key,
      {
        ...rateLimitData,
        attempts: rateLimitData.attempts + 1,
      } as RateLimitData,
      RATE_LIMIT.window
    );
  }

  // Generate and save token (simplified)
  private async generateUserToken(
    user: User,
    type: 'reset' | 'verify'
  ): Promise<string> {
    await this.checkRateLimit(user.email, type);

    const tokenId = crypto.randomUUID();
    const key = `auth_token:${type}:${user.id}:${tokenId}`;
    const createdAt = new Date().getTime();
    const tokenData: TokenData = {
      userId: user.id,
      email: user.email,
      type,
      tokenId,
      key,
      createdAt,
      attempts: 0,
      attemptsInInterval: 0,
      lastAttempt: undefined,
      nextRetryAt:
        createdAt +
        (type === 'verify'
          ? TOKEN_EXPIRY.verify * 1000
          : TOKEN_EXPIRY.reset * 1000),
    };

    // Generate JWT token with the key
    const jwtToken = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      type,
      tokenId,
      key,
    });

    // Store token data in cache
    const expiry = type === 'verify' ? TOKEN_EXPIRY.verify : TOKEN_EXPIRY.reset;
    await CacheService.set(key, tokenData, expiry);

    return jwtToken;
  }

  // Verify magic link (simplified version of your example)
  async verifyMagicLink<T extends 'reset' | 'verify'>(
    token: string
  ): Promise<{
    user: User;
    success: boolean;
    type: T;
    key: string;
  }> {
    try {
      // Decode JWT token
      const decoded = this.jwtService.verifyToken<{
        userId: string;
        email: string;
        type: T;
        tokenId: string;
        key: string;
      }>(token);

      if (!['reset', 'verify'].includes(decoded.type)) {
        throw new ValidationError('Invalid token type');
      }

      // Get token data from cache
      const tokenData = await CacheService.get<TokenData>(decoded.key, true);

      if (!tokenData || tokenData.tokenId !== decoded.tokenId) {
        throw new ValidationError('Invalid or expired token');
      }

      // Find user
      const user = await this.userRepo.findOne({
        where: { id: decoded.userId },
        relations: ['roles', 'company'],
      });

      if (!user) {
        throw new ValidationError('User not found');
      }

      return {
        user,
        success: true,
        type: decoded.type as T,
        key: decoded.key,
      };
    } catch (error) {
      console.error(error);
      throw new Error('Invalid or expired token');
    }
  }

  // Generate access/refresh tokens
  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles?.map((role) => role.name) || [],
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.generateToken(payload);
    const refreshToken = this.jwtService.generateRefreshToken({ sub: user.id });

    return { accessToken, refreshToken };
  }

  async oauthCallback(user: User) {
    const userWithRelations = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions', 'company'],
    });

    if (!userWithRelations) {
      throw new NotFoundError('User not found');
    }

    const tokens = this.generateTokens(userWithRelations);
    const permissions = await this.rbacService.getUserPermissions(
      userWithRelations.id
    );

    return {
      user: {
        id: userWithRelations.id,
        email: userWithRelations.email,
        firstName: userWithRelations.firstName,
        lastName: userWithRelations.lastName,
        roles: userWithRelations.roles.map((role) => role.name),
        company: userWithRelations.company,
        permissions,
      },
      ...tokens,
    };
  }

  async register(
    data: RegisterData
  ): Promise<{ message: string; userId: string }> {
    // Check if user exists
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        return await this.processEmail(
          existingUser.email,
          'verify',
          existingUser
        );
      }
      throw new ValidationError('User already exists with this email');
    }

    const defaultCurrency = await this.currencyService.getDefaultCurrency();
    const basicSubscription = await this.subscriptionRepo.findOne({
      where: { plan: SubscriptionPlan.BASIC },
    });

    if (!defaultCurrency || !basicSubscription) {
      throw new InternalError(
        'Default currency or subscription plan not found'
      );
    }

    // Get or create default role
    let role = await this.roleRepo.findOne({
      where: { name: ROLE_ENUM.SUPER_ADMIN },
    });
    if (!role) {
      await this.rbacService.seedRolesAndPermissions();
      role = await this.roleRepo.findOne({
        where: { name: ROLE_ENUM.SUPER_ADMIN },
      });
    }

    // 1. Create user first WITHOUT company
    const user = this.userRepo.create({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      roles: role ? [role] : [],
      isOnboarding: false,
    });
    const savedUser = await this.userRepo.save(user);

    // 2. Create company with ownerId = savedUser.id
    const company = this.companyRepo.create({
      name: data.companyName,
      isActive: true,
      isCompanyInit: true,
      defaultCurrency,
      subscription: basicSubscription,
      ownerId: savedUser.id,
    });
    const savedCompany = await this.companyRepo.save(company);

    // 3. Update user with company details
    savedUser.company = savedCompany;
    savedUser.companyId = savedCompany.id;
    await this.userRepo.save(savedUser);

    // 4. Send verification email
    await this.processEmail(savedUser.email, 'verify', savedUser);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: savedUser.id,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Use the magic link verifier
    const { user, key } = await this.verifyMagicLink<'verify'>(token);

    if (user.isEmailVerified) {
      throw new ValidationError('Email is already verified');
    }

    // Update user verification status
    user.isEmailVerified = true;
    await this.userRepo.save(user);

    // Clean up token
    await CacheService.delete(key);

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { message: 'Email verified successfully' };
  }

  async processEmail(
    email: string,
    type: 'reset' | 'verify',
    user: User | null,
    defaultPassword?: string,
    invited?: boolean
  ): Promise<{ message: string; userId: string }> {
    await this.checkRateLimit(email, type);
    console.log('hello');
    const resetMessage =
      'If an account with that email exists, a password reset link has been sent.';
    if (!user) user = await this.userRepo.findOne({ where: { email } });

    console.log({ user }, user);

    if (!user) {
      throw new ValidationError(
        type == 'reset' ? resetMessage : 'User not found'
      );
    }

    if (user.isEmailVerified && type == 'verify') {
      throw new ValidationError('Email is already verified');
    }

    // Generate new verification token
    const token = await this.generateUserToken(user, type);
    console.log({
      invited,
      token,
      defaultPassword,
    });
    // Send  email
    if (type == 'reset') {
      await EmailService.sendPasswordResetEmail(user, token);
    } else if (type == 'verify') {
      invited == true
        ? await EmailService.sendInvitationEmail(
            user.email,
            user.company?.name || 'Company',
            token,
            defaultPassword || 'defaultPassword'
          )
        : await EmailService.sendVerificationEmail(user, token);
    }

    return {
      message:
        type == 'reset' ? resetMessage : 'Verification email sent successfully',
      userId: user.id,
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    // await this.checkRateLimit(email, 'password_reset');
    return await this.processEmail(email, 'reset', null);
  }

  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    // Use the magic link verifier
    const { user, key } = await this.verifyMagicLink<'reset'>(token);

    // Update password
    user.password = newPassword; // Will be hashed by entity hooks
    user.loginAttempts = 0;
    user.lockUntil = null;
    await this.userRepo.save(user);

    // Clean up token
    await CacheService.delete(key);

    return { message: 'Password reset successfully' };
  }

  async login(data: LoginData, userAgent?: string) {
    const user = await this.userRepo.findOne({
      where: { email: data.email },
      relations: ['roles', 'roles.permissions', 'company'],
    });

    if (!user) {
      throw new ValidationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await user.validatePassword(data.password);
    if (!isValidPassword) {
      throw new ValidationError('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ValidationError('Please verify your email before logging in');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);
    const permissions = await this.rbacService.getUserPermissions(user.id);
    // Cache user session (optional)
    await CacheService.set(
      `user_session:${user.id}`,
      {
        userId: user.id,
        email: user.email,
        roles: user.roles.map((role) => role.name),
        lastLogin: new Date(),
        userAgent,
      },
      7 * 24 * 60 * 60
    ); // 7 days
    // update user login info
    await user.updateLoginDetails();
    await this.userRepo.save(user);
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles.map((role) => role.name),
        company: user.company
          ? {
              id: user.company.id,
              name: user.company.name,
            }
          : undefined,
        fullName: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        permissions,
      },
      ...tokens,
    };
  }

  // Simple token status check
  async getTokenStatus(token: string): Promise<{
    valid: boolean;
    type: 'verify' | 'reset' | null;
    expiresIn?: number;
  }> {
    try {
      const decoded = this.jwtService.verifyToken<{
        key: string;
        tokenId: string;
      }>(token);
      const tokenData = await CacheService.get<TokenData>(decoded.key);

      if (!tokenData || tokenData.tokenId !== decoded.tokenId) {
        return { valid: false, type: null };
      }

      const tokenAge = Date.now() - tokenData.createdAt;
      const maxAge =
        tokenData.type === 'verify'
          ? TOKEN_EXPIRY.verify * 1000
          : TOKEN_EXPIRY.reset * 1000;
      const expiresIn = Math.floor((maxAge - tokenAge) / 1000);

      return {
        valid: expiresIn > 0,
        type: tokenData.type,
        expiresIn: expiresIn > 0 ? expiresIn : undefined,
      };
    } catch (error) {
      console.log(`error: ${error}`);
      return { valid: false, type: null };
    }
  }

  // Clean up all user tokens
  async invalidateAllUserTokens(userId: string): Promise<void> {
    // In a simple implementation, you might need to track active tokens per user
    // For now, just clean up the session
    await CacheService.delete(`user_session:${userId}`);
  }
}
