import { NextFunction, Request, Response } from 'express';
import { UserService } from '../services/user.service';
import {
  AcceptInviteData,
  CreateCompanyInvite,
  CreateCompanyUserData,
  InviteQueryParams,
  InviteStatus,
  UpdateCompanyUserData,
  UpdateUserData,
  UserQueryParams,
  UserStatus,
} from '../types/';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // GET /api/users/invites - List company user invites with pagination and filtering
  getInvites = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      console.log(req);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse query parameters
      const queryParams: InviteQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        status: req.query.status as InviteStatus,
        role: req.query.role as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        includeExpired: req.query.includeInactive === 'true',
      };

      const result = await this.userService.getAllInvites(
        queryParams,
        user.companyId
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users - List company users with pagination and filtering
  getUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Parse query parameters
      const queryParams: UserQueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        search: req.query.search as string,
        status: req.query.status as UserStatus,
        role: req.query.role as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        includeInactive: req.query.includeInactive === 'true',
      };

      const result = await this.userService.getUsers(
        queryParams,
        user.companyId
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/:id - Get user details
  getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const userData = await this.userService.getUserById(id, user.companyId);

      res.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/users/me - Get current user profile
  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userData = await this.userService.getUserById(
        user.id,
        user.companyId
      );

      res.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users/invite - Create new company invite
  createInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const inviteData: CreateCompanyInvite = req.body;

      const createdInvite = await this.userService.createInvite(
        inviteData,
        user.companyId,
        user.id
      );

      res.status(201).json({
        success: true,
        data: createdInvite,
        message: 'User invitation sent successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/users - Create new company user
  createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const userData: CreateCompanyUserData = req.body;

      const createdUser = await this.userService.createUser(
        userData,
        user.companyId,
        user.id,
      );

      res.status(201).json({
        success: true,
        data: createdUser,
        message: 'User created successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/users/:id - Update user (admin)
  updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const updateData: UpdateCompanyUserData = req.body;

      const updatedUser = await this.userService.updateUser(
        id,
        updateData,
        user.companyId
      );

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/users/me - Update current user profile
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const updateData: UpdateUserData = req.body;

      const updatedUser = await this.userService.updateUser(
        user.id,
        updateData,
        user.companyId
      );

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/:id - Delete user
  deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      const result = await this.userService.deleteUser(id, user.companyId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/users/me - Delete current user profile
  deleteProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const result = await this.userService.deleteUser(user.id, user.companyId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/invites/:id - Delete invite
  deleteInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req;
      const { id } = req.params;

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ message: 'Invite ID is required' });
      }

      const result = await this.userService.deleteInvite(id, user.companyId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/invites/check/:token - Check invitation token
  checkInviteToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res
          .status(400)
          .json({ message: 'Invitation token is required' });
      }

      const result = await this.userService.checkInviteToken(token as string);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/invites/accept - Accept invitation
  acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inviteData: AcceptInviteData = req.body;

      const result = await this.userService.acceptInvite(inviteData);

      res.json({
        success: true,
        data: result,
        message: 'Invitation accepted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
