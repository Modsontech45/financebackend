// src/services/rbac.service.ts
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Permission } from '../models/Permission';
import { Role } from '../models/Role';
import { User } from '../models/User';
import {
  APP_PERMISSIONS as DefaultPerms,
  APP_ROLES as DefaultRoles,
  ROLE_HIERARCHY,
} from '../utils/constant';

export class RBACService {
  private readonly userRepo: Repository<User>;
  private readonly roleRepo: Repository<Role>;
  private readonly permissionRepo: Repository<Permission>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.roleRepo = AppDataSource.getRepository(Role);
    this.permissionRepo = AppDataSource.getRepository(Permission);
  }

  // Check if user has specific permission
  async hasPermission(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return false;

    return this.checkUserPermission(user, resource, action);
  }

  // Check if user has ANY of the specified permissions
  async hasAnyPermission(
    userId: string,
    resource: string,
    actions: string[]
  ): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return false;

    return actions.some((action) =>
      this.checkUserPermission(user, resource, action)
    );
  }

  // Check if user has ALL of the specified permissions
  async hasAllPermissions(
    userId: string,
    resource: string,
    actions: string[]
  ): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return false;

    return actions.every((action) =>
      this.checkUserPermission(user, resource, action)
    );
  }

  // Helper method to check permission for a user object
  private checkUserPermission(
    user: User,
    resource: string,
    action: string
  ): boolean {
    // Check if user has the specific permission
    for (const role of user.roles) {
      for (const permission of role.permissions) {
        if (
          permission.resource === resource &&
          (permission.action === action || permission.action === '*')
        ) {
          return true;
        }

        // Check for wildcard permissions
        if (permission.resource === '*' && permission.action === '*') {
          return true;
        }
      }
    }

    return false;
  }

  // Check if user has specific role
  async hasRole(userId: string, roleName: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) return false;

    return user.roles.some((role) => role.name === roleName);
  }

  // Check if user has ANY of the specified roles
  async hasAnyRole(userId: string, roleNames: string[]): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) return false;

    const userRoleNames = user.roles.map((role) => role.name);
    return roleNames.some((roleName) => userRoleNames.includes(roleName));
  }

  // Check if user has ALL of the specified roles
  async hasAllRoles(userId: string, roleNames: string[]): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) return false;

    const userRoleNames = user.roles.map((role) => role.name);
    return roleNames.every((roleName) => userRoleNames.includes(roleName));
  }

  // Check if user has minimum role (hierarchical)
  async hasMinimumRole(userId: string, minimumRole: string): Promise<boolean> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) return false;

    // Define role hierarchy (higher index = higher privilege)
    const roleHierarchy = ROLE_HIERARCHY;

    const minimumLevel = roleHierarchy.indexOf(minimumRole);
    if (minimumLevel === -1) {
      throw new Error(`Unknown role: ${minimumRole}`);
    }

    // Check if user has any role with equal or higher privilege
    return user.roles.some((role) => {
      const userLevel = roleHierarchy.indexOf(role.name);
      return userLevel >= minimumLevel;
    });
  }

  // Check if user owns a specific resource
  async ownsResource(
    userId: string,
    resourceModel: string,
    resourceId: string
  ): Promise<boolean> {
    try {
      // This is a generic implementation - you might need to customize based on your models
      const repository = AppDataSource.getRepository(resourceModel);

      // Try different common ownership field names
      const ownershipFields = ['userId', 'ownerId', 'createdBy', 'authorId'];

      for (const field of ownershipFields) {
        try {
          const resource = await repository.findOne({
            where: {
              id: resourceId,
              [field]: userId,
            },
          });

          if (resource) return true;
        } catch {
          // Continue to next field if this one doesn't exist
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error(
        `Error checking resource ownership for ${resourceModel}:`,
        error
      );
      return false;
    }
  }

  // Get user permissions with formatted strings
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) return [];

    const permissions = new Set<string>();

    for (const role of user.roles) {
      for (const permission of role.permissions) {
        permissions.add(`${permission.resource}:${permission.action}`);
      }
    }

    return Array.from(permissions);
  }

  // Get user roles
  async getUserRoles(userId: string): Promise<string[]> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) return [];

    return user.roles.map((role) => role.name);
  }

  // Assign role to user
  async assignRole(userId: string, roleName: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    const role = await this.roleRepo.findOne({
      where: { name: roleName },
    });

    if (!user || !role) {
      throw new Error('User or role not found');
    }

    // Check if user already has this role
    if (!user.roles.some((r) => r.id === role.id)) {
      user.roles.push(role);
      await this.userRepo.save(user);
    }
  }

  // Assign multiple roles to user
  async assignRoles(userId: string, roleNames: string[]): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roles = await this.roleRepo.find({
      where: roleNames.map((name) => ({ name })),
    });

    if (roles.length !== roleNames.length) {
      throw new Error('Some roles not found');
    }

    // Add only new roles
    for (const role of roles) {
      if (!user.roles.some((r) => r.id === role.id)) {
        user.roles.push(role);
      }
    }

    await this.userRepo.save(user);
  }

  // Remove role from user
  async removeRole(userId: string, roleName: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.roles = user.roles.filter((role) => role.name !== roleName);
    await this.userRepo.save(user);
  }

  // Remove multiple roles from user
  async removeRoles(userId: string, roleNames: string[]): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.roles = user.roles.filter((role) => !roleNames.includes(role.name));
    await this.userRepo.save(user);
  }

  // Create role with permissions
  async createRole(roleName: string, permissionNames: string[]): Promise<Role> {
    // Check if role already exists
    const existingRole = await this.roleRepo.findOne({
      where: { name: roleName },
    });
    if (existingRole) {
      throw new Error(`Role '${roleName}' already exists`);
    }

    const permissions = await this.permissionRepo.find({
      where: permissionNames.map((name) => ({ name })),
    });

    if (permissions.length !== permissionNames.length) {
      throw new Error('Some permissions not found');
    }

    const role = this.roleRepo.create({
      name: roleName,
      permissions,
    });

    return await this.roleRepo.save(role);
  }

  // Update role permissions
  async updateRolePermissions(
    roleName: string,
    permissionNames: string[]
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { name: roleName },
      relations: ['permissions'],
    });

    if (!role) {
      throw new Error(`Role '${roleName}' not found`);
    }

    const permissions = await this.permissionRepo.find({
      where: permissionNames.map((name) => ({ name })),
    });

    if (permissions.length !== permissionNames.length) {
      throw new Error('Some permissions not found');
    }

    role.permissions = permissions;
    return await this.roleRepo.save(role);
  }

  // Create permission
  async createPermission(
    resource: string,
    action: string,
    description?: string
  ): Promise<Permission> {
    const name = `${resource}:${action}`;

    // Check if permission already exists
    const existingPermission = await this.permissionRepo.findOne({
      where: { name },
    });
    if (existingPermission) {
      throw new Error(`Permission '${name}' already exists`);
    }

    const permission = this.permissionRepo.create({
      name,
      resource,
      action,
      description,
    });

    return await this.permissionRepo.save(permission);
  }

  // Get all roles with their permissions
  async getAllRoles(): Promise<Role[]> {
    return await this.roleRepo.find({
      relations: ['permissions'],
    });
  }

  // Get all permissions
  async getAllPermissions(): Promise<Permission[]> {
    return await this.permissionRepo.find();
  }

  // Seed initial roles and permissions
  async seedRolesAndPermissions(): Promise<void> {
    console.log('Seeding RBAC roles and permissions...');

    try {
      // Create permissions
      const permissions = DefaultPerms;

      for (const perm of permissions) {
        const existingPerm = await this.permissionRepo.findOne({
          where: { name: perm.name },
        });
        if (!existingPerm) {
          await this.permissionRepo.save(this.permissionRepo.create(perm));
          console.log(`Created permission: ${perm.name}`);
        }
      }

      // Create roles
      const roles = DefaultRoles;
      for (const roleData of roles) {
        const existingRole = await this.roleRepo.findOne({
          where: { name: roleData.name },
        });
        if (!existingRole) {
          const permissions = await this.permissionRepo.find({
            where: roleData.permissions.map((name) => ({ name })),
          });

          const role = this.roleRepo.create({
            name: roleData.name,
            permissions,
          });

          await this.roleRepo.save(role);
          console.log(
            `Created role: ${roleData.name} with ${permissions.length} permissions`
          );
        }
      }

      console.log('RBAC seeding completed successfully');
    } catch (error) {
      console.error('Error seeding RBAC:', error);
      throw error;
    }
  }

  // Utility method to check if user is super admin
  async isSuperAdmin(userId: string): Promise<boolean> {
    return await this.hasRole(userId, 'super_admin');
  }

  // Get user with all RBAC data
  async getUserWithRBAC(userId: string): Promise<User | null> {
    return await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
  }
}
