// Cache configuration
const CACHE_CONFIG = {
  list: 5 * 60, // 5 minutes
  detail: 10 * 60, // 10 minutes
  analytics: 15 * 60, // 15 minutes
};

// Pagination defaults
const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

const APP_PERMISSIONS = [
  { name: 'transaction:read', resource: 'transaction', action: 'read' },
  { name: 'transaction:write', resource: 'transaction', action: 'write' },
  { name: 'transaction:delete', resource: 'transaction', action: 'delete' },
  { name: 'company:read', resource: 'company', action: 'read' },
  { name: 'company:write', resource: 'company', action: 'write' },
  { name: 'user:read', resource: 'user', action: 'read' },
  { name: 'user:write', resource: 'user', action: 'write' },
  { name: 'user:delete', resource: 'user', action: 'delete' },
  { name: 'notice:read', resource: 'notice', action: 'read' },
  { name: 'notice:write', resource: 'notice', action: 'write' },
  { name: 'analytics:read', resource: 'analytics', action: 'read' },
  { name: '*:*', resource: '*', action: '*' }, // Super admin
];
// Role enum for type safety
enum ROLE_ENUM {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member',
}

// Resource enum for permissions
enum RESOURCE_ENUM {
  TRANSACTION = 'transaction',
  COMPANY = 'company',
  USER = 'user',
  NOTICE = 'notice',
  ANALYTICS = 'analytics',
  ROLES = 'roles',
  ALL = '*',
}

// Action enum for permissions
enum ACTION_ENUM {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  CREATE = 'create',
  UPDATE = 'update',
  ALL = '*',
}

const APP_ROLES = [
  {
    name: ROLE_ENUM.SUPER_ADMIN,
    description: 'Super Administrator with full system access',
    permissions: ['*:*'],
  },
  {
    name: ROLE_ENUM.ADMIN,
    description: 'Administrator with comprehensive management access',
    permissions: [
      'transaction:read',
      'transaction:write',
      'transaction:delete',
      'company:read',
      'company:write',
      'user:read',
      'user:write',
      'user:delete',
      'notice:read',
      'notice:write',
      'analytics:read',
    ],
  },
  {
    name: ROLE_ENUM.MANAGER,
    description: 'Manager with operational access',
    permissions: [
      'transaction:read',
      'transaction:write',
      'company:read',
      'user:read',
      'notice:read',
      'notice:write',
      'analytics:read',
    ],
  },
  {
    name: ROLE_ENUM.MEMBER,
    description: 'Basic member with read-only access',
    permissions: [
      'transaction:read',
      'company:read',
      'user:read',
      'notice:read',
    ],
  },
];
const ROLE_HIERARCHY: string[] = [
  ROLE_ENUM.MEMBER,
  ROLE_ENUM.MANAGER,
  ROLE_ENUM.ADMIN,
  ROLE_ENUM.SUPER_ADMIN,
];

export {
  ACTION_ENUM,
  APP_PERMISSIONS,
  APP_ROLES,
  CACHE_CONFIG,
  PAGINATION,
  RESOURCE_ENUM,
  ROLE_ENUM,
  ROLE_HIERARCHY,
};
