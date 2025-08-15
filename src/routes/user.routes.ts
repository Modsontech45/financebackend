import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import {
  authenticate,
  requireFullAuthenticate,
} from '../middleware/auth.middleware';
import { generalRateLimit } from '../middleware/rateLimiter.middleware';
import { authorize, requireAnyRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validation.middleware';
import { ROLE_ENUM } from '../utils/constant';
import {
  acceptInviteSchema,
  createCompanyInviteSchema,
  createCompanyUserSchema,
  inviteQuerySchema,
  updateCompanyUserSchema,
  updateUserSchema,
  userQuerySchema,
  uuidParamSchema,
  verifyTokenSchema,
} from '../validations/user.validation';

const router = Router();
const userController = new UserController();

// Bind controller methods to preserve 'this'
userController.getInvites = userController.getInvites.bind(userController);
userController.getUsers = userController.getUsers.bind(userController);
userController.getUserById = userController.getUserById.bind(userController);
userController.getProfile = userController.getProfile.bind(userController);
userController.createInvite = userController.createInvite.bind(userController);
userController.createUser = userController.createUser.bind(userController);
userController.updateUser = userController.updateUser.bind(userController);
userController.updateProfile =
  userController.updateProfile.bind(userController);
userController.deleteUser = userController.deleteUser.bind(userController);
userController.deleteProfile =
  userController.deleteProfile.bind(userController);
userController.deleteInvite = userController.deleteInvite.bind(userController);
userController.checkInviteToken =
  userController.checkInviteToken.bind(userController);
userController.acceptInvite = userController.acceptInvite.bind(userController);


// Public routes (no authentication required)
/**
 * @route   GET /api/users/invite/check/:token
 * @desc    Check invitation token validity
 * @access  Public
 */
router.get(
  '/invite/check',
  generalRateLimit,
  validate(verifyTokenSchema, 'query'),
  userController.checkInviteToken
);

/**
 * @route   POST /api/users/invite/accept
 * @desc    Accept invitation and create account
 * @access  Public
 */
router.post(
  '/invite/accept',
  generalRateLimit,
  validate(acceptInviteSchema),
  userController.acceptInvite
);

// Apply authentication and company middleware to all other user routes
router.use(authenticate);
router.use(requireFullAuthenticate);

/**
 * @route   GET /api/users/invite/check/:token
 * @desc    Check invitation token validity
 * @access  Public
 */
router.get(
  '/invites',
  requireAnyRole(ROLE_ENUM.MANAGER, ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  // authorize('user', 'read'),
  generalRateLimit,
  validate(inviteQuerySchema, 'query'),
  userController.getInvites
);


// Profile routes (current user)
/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private (Any authenticated user)
 * @cache   5 minutes
 */
router.get('/me', generalRateLimit, userController.getProfile);

/**
 * @route   PUT /api/users/me
 * @desc    Update current user profile
 * @access  Private (Any authenticated user)
 */
router.put(
  '/me',
  generalRateLimit,
  validate(updateUserSchema),
  userController.updateProfile
);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete current user profile
 * @access  Private (Any authenticated user)
 */
router.delete('/me', generalRateLimit, userController.deleteProfile);

// Admin user management routes
/**
 * @route   GET /api/users
 * @desc    Get all company users with pagination and filtering
 * @access  Private (Admin/Manager only)
 * @cache   5 minutes
 */
router.get(
  '/',
  requireAnyRole(ROLE_ENUM.MANAGER, ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'read'),
  validate(userQuerySchema, 'query'),
  generalRateLimit,
  userController.getUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Private (Admin/Manager only)
 * @cache   10 minutes
 */
router.get(
  '/:id',
  requireAnyRole(ROLE_ENUM.MANAGER, ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'read'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  userController.getUserById
);

/**
 * @route   POST /api/users/invite
 * @desc    Create and send user invitation
 * @access  Private (Admin only)
 */
router.post(
  '/invite',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'write'),
  generalRateLimit,
  validate(createCompanyInviteSchema),
  userController.createInvite
);

/**
 * @route   POST /api/users
 * @desc    Create new company user directly
 * @access  Private (Admin only)
 */
router.post(
  '/',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'write'),
  generalRateLimit,
  validate(createCompanyUserSchema),
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update existing user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'write'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  validate(updateCompanyUserSchema),
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'delete'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  userController.deleteUser
);

/**
 * @route   DELETE /api/users/invite/:id
 * @desc    Delete invitation
 * @access  Private (Admin only)
 */
router.delete(
  '/invite/:id',
  requireAnyRole(ROLE_ENUM.ADMIN, ROLE_ENUM.SUPER_ADMIN),
  authorize('user', 'delete'),
  generalRateLimit,
  validate(uuidParamSchema, 'params'),
  userController.deleteInvite
);

export default router;
