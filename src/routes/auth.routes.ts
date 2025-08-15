// src/routes/auth.routes.ts
import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendEmailSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();
// Traditional auth routes
router.post(
  '/register',
  validate(registerSchema),
  authController.register.bind(authController)
);
router.post(
  '/login',
  validate(loginSchema),
  authController.login.bind(authController)
);
router.post('/refresh', authController.refreshToken.bind(authController));

// Email verification
router.get(
  '/verify-email',
  validate(verifyEmailSchema, 'query'),
  authController.verifyEmail.bind(authController)
);
router.post(
  '/resend-email',
  validate(resendEmailSchema),
  authController.resendEmail.bind(authController)
);

// Password reset
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
);
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  authController.resetPassword.bind(authController)
);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // Important: disable sessions for JWT-based auth
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`,
  }),
  authController.oauthCallback.bind(authController)
);

// GitHub OAuth routes
// router.get('/github',
//   passport.authenticate('github', {
//     scope: ['user:email'],
//     session: false
//   })
// );

// router.get('/github/callback',
//   passport.authenticate('github', {
//     session: false,
//     failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`
//   }),
//   authController.oauthCallback.bind(authController)
// );

// Protected routes
router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController)
);
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController)
);

// Health check route for OAuth
router.get('/oauth/status', (req, res) => {
  res.json({
    status: 'success',
    message: 'OAuth endpoints are available',
    providers: ['google', 'github', 'linkedin', 'microsoft'],
  });
});

export default router;
