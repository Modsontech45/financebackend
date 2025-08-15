import { NextFunction, Request, Response } from 'express';
import { RBACService } from '../services/rbac.service';

const rbacService = new RBACService();

// Permission-based authorization with multiple permissions support
export const authorize = (resource: string, action: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const actions = Array.isArray(action) ? action : [action];
      const permissions = actions.map((a) => `${resource}:${a}`);

      // Check if user has ANY of the required permissions
      const hasPermission = await rbacService.hasAnyPermission(
        req.user.id,
        resource,
        actions
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: 'error',
          message: `Insufficient permissions. Required one of: ${permissions.join(', ')}`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Enhanced permission check requiring ALL permissions
export const authorizeAll = (resource: string, actions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const hasAllPermissions = await rbacService.hasAllPermissions(
        req.user.id,
        resource,
        actions
      );

      if (!hasAllPermissions) {
        const permissions = actions.map((a) => `${resource}:${a}`);
        return res.status(403).json({
          status: 'error',
          message: `Insufficient permissions. Required all: ${permissions.join(', ')}`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Multi-role authorization - user must have ANY of the specified roles
export const requireAnyRole = (...roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const hasAnyRole = await rbacService.hasAnyRole(req.user.id, roleNames);

      if (!hasAnyRole) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required one of these roles: ${roleNames.join(', ')}`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Multi-role authorization - user must have ALL specified roles
export const requireAllRoles = (...roleNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const hasAllRoles = await rbacService.hasAllRoles(req.user.id, roleNames);

      if (!hasAllRoles) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Required all roles: ${roleNames.join(', ')}`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Original single role check (kept for backward compatibility)
export const requireRole = (roleName: string) => {
  return requireAnyRole(roleName);
};

// Hierarchical role check - checks if user has specified role or higher
export const requireMinimumRole = (minimumRole: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      const hasMinimumRole = await rbacService.hasMinimumRole(
        req.user.id,
        minimumRole
      );

      if (!hasMinimumRole) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Minimum required role: ${minimumRole}`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Company ownership check with enhanced error handling
export const requireCompanyOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ status: 'error', message: 'Authentication required' });
  }

  const companyId =
    req.params.companyId || req.body.companyId || req.query.companyId;

  if (!companyId) {
    return res.status(400).json({
      status: 'error',
      message: 'Company ID is required',
    });
  }

  if (req.user.companyId !== companyId) {
    return res.status(403).json({
      status: 'error',
      message: 'Access denied. You can only access your own company data.',
    });
  }

  next();
};

// Enhanced resource ownership check with dynamic model support
export const requireResourceOwnership = (
  resourceModel: string,
  resourceIdParam: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    const resourceId = req.params[resourceIdParam];

    if (!resourceId) {
      return res.status(400).json({
        status: 'error',
        message: `${resourceModel} ID is required`,
      });
    }

    try {
      const ownsResource = await rbacService.ownsResource(
        req.user.id,
        resourceModel,
        resourceId
      );

      if (!ownsResource) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. You can only access your own ${resourceModel.toLowerCase()} resources.`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Resource ownership check failed' });
    }
  };
};

// Conditional authorization - check ownership OR permission
export const requireOwnershipOrPermission = (
  resourceModel: string,
  resource: string,
  action: string,
  resourceIdParam: string = 'id'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    const resourceId = req.params[resourceIdParam];

    try {
      // First check if user owns the resource
      if (resourceId) {
        const ownsResource = await rbacService.ownsResource(
          req.user.id,
          resourceModel,
          resourceId
        );

        if (ownsResource) {
          return next();
        }
      }

      // If not owner, check permission
      const hasPermission = await rbacService.hasPermission(
        req.user.id,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          status: 'error',
          message: `Access denied. Must own resource or have ${resource}:${action} permission.`,
        });
      }

      next();
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};

// Super admin bypass - allows super admin to access anything
export const allowSuperAdmin = (middleware: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ status: 'error', message: 'Authentication required' });
    }

    try {
      // Check if user is super admin
      const isSuperAdmin = await rbacService.hasRole(
        req.user.id,
        'super_admin'
      );

      if (isSuperAdmin) {
        return next();
      }

      // If not super admin, apply the original middleware
      return middleware(req, res, next);
    } catch (_error) {
      return res
        .status(500)
        .json({ status: 'error', message: 'Authorization error' });
    }
  };
};
