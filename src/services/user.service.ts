import crypto from 'crypto';
import {
  FindManyOptions,
  FindOptionsWhere,
  ILike,
  In,
  Like,
  Repository,
} from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Company } from '../models/Company';
import { Invite } from '../models/Invite';
import { Role } from '../models/Role';
import { User } from '../models/User';
import {
  AcceptInviteData,
  CreateCompanyInvite,
  CreateCompanyUserData,
  InviteQueryParams,
  InviteStatus,
  PaginatedResponse,
  UpdateCompanyUserData,
  UserQueryParams,
  UserStatus,
} from '../types/';
import { CACHE_CONFIG, PAGINATION, ROLE_ENUM } from '../utils/constant';
import { NotFoundError, ValidationError } from '../utils/error';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { EmailService } from './email.service';
import { RBACService } from './rbac.service';

export class UserService {
  private userRepo: Repository<User>;
  private companyRepo: Repository<Company>;
  private inviteRepo: Repository<Invite>;
  private roleRepo: Repository<Role>;
  private rbacService: RBACService;
  private authService: AuthService;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.roleRepo = AppDataSource.getRepository(Role);
    this.companyRepo = AppDataSource.getRepository(Company);
    this.inviteRepo = AppDataSource.getRepository(Invite);
    this.rbacService = new RBACService();
    this.authService = new AuthService();
  }

  // Generate cache keys
  private generateCacheKey(
    type: string,
    params: Record<string, unknown> = {}
  ): string {
    const keyParts = [type];
    if (params.id) keyParts.push(`${params.id}`);
    if (params.companyId) keyParts.push(`company:${params.companyId}`);
    if (params.page) keyParts.push(`page:${params.page}`);
    if (params.limit) keyParts.push(`limit:${params.limit}`);

    return `user:${keyParts.join(':')}`;
  }

  // Invalidate user-related caches
  private async invalidateUserCaches(
    companyId: string,
    userId?: string
  ): Promise<void> {
    const patterns = [`user:list:company:${companyId}*`];

    if (userId) {
      patterns.push(`user:detail:${userId}`);
    }

    await Promise.all(
      patterns.map((pattern) => CacheService.deletePattern(pattern))
    );
  }

  // Build query filters for invites
  private buildInviteQueryFilters(
    params: InviteQueryParams,
    companyId: string
  ): FindManyOptions<any> {
    const relations = ['company'];
    const order: any = {};
    const where: FindOptionsWhere<Invite>[] = [];

    // Base condition (companyId + status)
    const baseCondition: FindOptionsWhere<any> = { companyId };

    if (params.status) {
      baseCondition.status = params.status;
    } else if (!params.includeExpired) {
      baseCondition.status = In([InviteStatus.ACTIVE]);
    }

    if (params.role) {
      baseCondition.roles = Like(`%${params.role}%`);
    }

    // Date range filters
    if (params.dateFrom || params.dateTo) {
      const dateCondition: any = {};
      if (params.dateFrom) {
        dateCondition.createdAt = { $gte: params.dateFrom };
      }
      if (params.dateTo) {
        dateCondition.createdAt = {
          ...dateCondition.createdAt,
          $lte: params.dateTo,
        };
      }
      Object.assign(baseCondition, dateCondition);
    }

    // Search filter (OR across targetEmail, firstName, lastName)
    if (params.search) {
      where.push(
        { ...baseCondition, targetEmail: ILike(`%${params.search}%`) },
        { ...baseCondition, firstName: ILike(`%${params.search}%`) },
        { ...baseCondition, lastName: ILike(`%${params.search}%`) }
      );
    } else {
      where.push(baseCondition);
    }

    // Sorting
    if (params.sortBy) {
      order[params.sortBy] = params.sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return {
      where,
      relations,
      order,
      skip:
        ((params.page || PAGINATION.defaultPage) - 1) *
        (params.limit || PAGINATION.defaultLimit),
      take: Math.min(
        params.limit || PAGINATION.defaultLimit,
        PAGINATION.maxLimit
      ),
    };
  }

  // Get all invites with pagination and filtering
  async getAllInvites(
    params: InviteQueryParams,
    companyId: string
  ): Promise<PaginatedResponse<Invite>> {
    let invites: Invite[];
    let total: number;

    const queryOptions = this.buildInviteQueryFilters(params, companyId);
    [invites, total] = await this.inviteRepo.findAndCount(queryOptions);

    const page = params.page || PAGINATION.defaultPage;
    const limit = Math.min(
      params.limit || PAGINATION.defaultLimit,
      PAGINATION.maxLimit
    );

    return {
      data: invites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  // Build query filters for users
  private buildQueryFilters(
    params: UserQueryParams,
    companyId: string
  ): FindManyOptions<User> {
    const relations = ['company'];
    const order: any = {};
    const where: FindOptionsWhere<User>[] = [];

    // Base condition (companyId + status/role)
    const baseCondition: FindOptionsWhere<User> = { companyId };

    if (params.status) {
      baseCondition.status = params.status;
    } else if (!params.includeInactive) {
      baseCondition.status = In([UserStatus.ACTIVE, UserStatus.PENDING]);
    }

    if (params.role) {
      baseCondition.roles = Like(`%${params.role}%`);
    }

    // Search filter (OR across firstName, lastName, email)
    if (params.search) {
      where.push(
        { ...baseCondition, firstName: ILike(`%${params.search}%`) },
        { ...baseCondition, lastName: ILike(`%${params.search}%`) },
        { ...baseCondition, email: ILike(`%${params.search}%`) }
      );
    } else {
      where.push(baseCondition);
    }

    // Sorting
    if (params.sortBy) {
      order[params.sortBy] = params.sortOrder || 'DESC';
    } else {
      order.createdAt = 'DESC';
    }

    return {
      where,
      relations,
      order,
      skip:
        ((params.page || PAGINATION.defaultPage) - 1) *
        (params.limit || PAGINATION.defaultLimit),
      take: Math.min(
        params.limit || PAGINATION.defaultLimit,
        PAGINATION.maxLimit
      ),
    };
  }

  // Get all users with pagination and filtering
  async getUsers(
    params: UserQueryParams,
    companyId: string
  ): Promise<PaginatedResponse<User>> {
    const cacheKey = this.generateCacheKey('list', {
      companyId,
      page: params.page,
      limit: params.limit,
      filters: params,
    });

    return CacheService.withCache<PaginatedResponse<User>>(
      cacheKey,
      async () => {
        let users: User[];
        let total: number;

        const queryOptions = this.buildQueryFilters(params, companyId);
        [users, total] = await this.userRepo.findAndCount(queryOptions);

        const page = params.page || PAGINATION.defaultPage;
        const limit = Math.min(
          params.limit || PAGINATION.defaultLimit,
          PAGINATION.maxLimit
        );

        return {
          data: users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        };
      },
      true,
      CACHE_CONFIG.list
    );
  }

  // Get user by ID
  async getUserById(id: string, companyId: string): Promise<User> {
    const cacheKey = `user:detail:${id}`;

    return CacheService.withCache(
      cacheKey,
      async () => {
        const user = await this.userRepo.findOne({
          where: { id, companyId },
          relations: ['company'],
        });

        if (!user) {
          throw new NotFoundError('User not found');
        }

        return user;
      },
      true,
      CACHE_CONFIG.detail
    );
  }
  // Admin: Create invite
  async createInvite(
    data: CreateCompanyInvite,
    companyId: string,
    userId: string
  ): Promise<Invite> {
    // Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ValidationError('User already exists with this email');
    }

    // Validate company exists
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new ValidationError('Company not found');
    }

    // Check if active invite already exists
    const existingInvite = await this.inviteRepo.findOne({
      where: {
        targetEmail: data.email,
        companyId,
        status: InviteStatus.ACTIVE,
      },
    });
    if (existingInvite) {
      throw new ValidationError('Active invite already exists for this email');
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + (company?.inviteExpiresAfter || 72 * 60 * 60 * 1000)
    ); // 72 hours

    // Create invite
    const invite = this.inviteRepo.create({
      targetEmail: data.email,
      roles: data.roles,
      companyId,
      invitedBy: userId,
      company,
      token,
      status: InviteStatus.ACTIVE,
      expiresAt,
    });

    const savedInvite = await this.inviteRepo.save(invite);

    // Send invitation email

    await EmailService.sendInvitationEmail(
      data.email,
      company?.name || 'Company',
      token,
      'kkkkkkk'
    );

    // Invalidate caches
    await this.invalidateUserCaches(companyId);

    return savedInvite;
  }

  // Admin: Create user directly
  async createUser(
    data: CreateCompanyUserData,
    companyId: string,
    userId: string,
    invited: boolean = false
  ): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ValidationError('User already exists with this email');
    }

    // Validate company exists
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new ValidationError('Company not found');
    }

    // Step 1: Try fetching roles based on input or default to MEMBER
    let roles = await this.roleRepo.find({
      where: data.roles?.length
        ? data.roles.map((r) => ({ name: r }))
        : { name: ROLE_ENUM.MEMBER },
    });

    // Step 2: If none found, try repopulating the roles table
    if (!roles.length) {
      await this.rbacService.seedRolesAndPermissions();

      roles = await this.roleRepo.find({
        where: data.roles?.length
          ? data.roles.map((r) => ({ name: r }))
          : { name: ROLE_ENUM.MEMBER },
      });
    }

    // Step 3: If still none found, force assign MEMBER role
    if (!roles.length) {
      roles = await this.roleRepo.find({ where: { name: ROLE_ENUM.MEMBER } });
    }
    const password = crypto.randomBytes(16).toString('hex');
    // Create user
    const user = this.userRepo.create({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      profilePicture: data.profilePicture,
      roles,
      companyId,
      invitedBy: userId,
      company,
      isOnboarding:false,
      isEmailVerified: invited,
      status: invited ? UserStatus.PENDING : UserStatus.ACTIVE, // Will be ACTIVE after email verification
      password,
    });

    const savedUser = await this.userRepo.save(user);

    // Send verification email
    if (!invited)
      await this.authService.processEmail(
        savedUser.email,
        'verify',
        savedUser,
        password,
        true
      );
    // Invalidate caches
    await this.invalidateUserCaches(companyId);

    return savedUser;
  }

  // Admin: Update user
  async updateUser(
    id: string,
    data: UpdateCompanyUserData,
    companyId: string
  ): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, companyId },
      relations: ['company'],
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Store previous values for comparison
    const previousStatus = user.status;
    const previousRoles = user.roles.map((r) => r.name) || [];

    let roles = user.roles;

    if (data.roles) {
      roles = await this.roleRepo.find({
        where: data.roles?.length
          ? data.roles.map((r) => ({ name: r }))
          : user.roles.map((r) => ({ name: r.name })),
      });
      // Step 2: If none found, try repopulating the roles table
      if (!roles.length) {
        await this.rbacService.seedRolesAndPermissions();

        roles = await this.roleRepo.find({
          where: data.roles?.length
            ? data.roles.map((r) => ({ name: r }))
            : user.roles.map((r) => ({ name: r.name })),
        });
      }

      if (!roles.length) roles = user.roles;
    }

    // Update user fields
    Object.assign(user, { ...data, roles });
    const updatedUser = await this.userRepo.save(user);

    // Check for status changes and send emails
    if (data.status && data.status !== previousStatus) {
      try {
        if (
          data.status === UserStatus.ACTIVE &&
          previousStatus !== UserStatus.ACTIVE
        ) {
          await EmailService.sendAccountActivationEmail(updatedUser);
        } else if (data.status === UserStatus.SUSPENDED) {
          await EmailService.sendAccountSuspensionEmail(updatedUser);
        }
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
        // Don't throw error here, user update was successful
      }
    }

    // Check for role changes and send email
    if (
      data.roles &&
      JSON.stringify(data.roles) !== JSON.stringify(previousRoles)
    ) {
      try {
        await EmailService.sendRoleUpdateEmail(
          updatedUser,
          previousRoles,
          data.roles
        );
      } catch (emailError) {
        console.error('Failed to send role change email:', emailError);
        // Don't throw error here, user update was successful
      }
    }

    // Invalidate caches
    await this.invalidateUserCaches(companyId, id);

    return await this.getUserById(id, companyId);
  }

  // Admin: Delete user
  async deleteUser(
    id: string,
    companyId: string
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id, companyId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepo.softRemove(user);
    return { message: 'User deleted successfully' };
  }

  // Admin: Delete invite
  async deleteInvite(
    id: string,
    companyId: string
  ): Promise<{ message: string }> {
    const invite = await this.inviteRepo.findOne({ where: { id, companyId } });
    if (!invite) {
      throw new NotFoundError('Invite not found');
    }

    await this.inviteRepo.softRemove(invite);
    return { message: 'Invite deleted successfully' };
  }

  // User: Check invite by token
  async checkInviteToken(token: string): Promise<{
    valid: boolean;
    invite: Invite;
  }> {
    const invite = await this.inviteRepo.findOne({
      where: { token },
      relations: ['company'],
    });
    console.log(invite);
    if (!invite) {
      throw new ValidationError('Invalid Invite');
    }

    if (invite.status !== InviteStatus.ACTIVE) {
      throw new ValidationError(
        'Invite expired, contact admin of your company'
      );
    }

    if (new Date() > invite.expiresAt) {
      // Update status to expired
      invite.status = InviteStatus.EXPIRED;
      await this.inviteRepo.save(invite);
      throw new ValidationError(
        'Invite expired, contact admin of your company'
      );
    }

    return {
      valid: true,
      invite,
    };
  }

  // User: Accept invite and create account
  async acceptInvite(data: AcceptInviteData): Promise<User> {
    const { token, ...details } = data;
    // Get invite
    const { valid, invite } = await this.checkInviteToken(token);
    if (!valid) {
      throw new ValidationError('Invite Invalid');
    }

    const savedUser = this.createUser(
      {
        ...details,
        roles: invite.roles,
        email: invite.targetEmail,
        firstName: invite.firstName ?? details.firstName,
        lastName: invite.lastName ?? details.lastName,
      },
      invite.companyId,
      invite.invitedBy,
      true
    );

    // Mark invite as used
    invite.status = InviteStatus.USED;
    await this.inviteRepo.save(invite);

    return savedUser;
  }
}
