import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginData, RegisterData } from '../types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Helper method to get client IP
  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string) ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  // Helper method to get user agent
  private getUserAgent(req: Request): string {
    return req.headers['user-agent'] || 'unknown';
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData: RegisterData = req.body;
      const result = await this.authService.register(userData);

      res.status(201).json({
        status: 'success',
        message: result.message,
        data: {
          userId: result.userId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const loginData: LoginData = req.body;
      const userAgent = this.getUserAgent(req);

      const result = await this.authService.login(loginData, userAgent);

      // Set HTTP-only cookies for tokens (recommended for security)
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: result.user,
          // Optionally include tokens in response body as well
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      // This would need to be implemented in your AuthService
      // For now, placeholder implementation
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          status: 'error',
          message: 'Refresh token not provided',
        });
      }

      // You'll need to implement refreshToken method in AuthService
      // const result = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        // data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async oauthCallback(req: Request, res: Response) {
    try {
      const user = req.user; // User object from passport strategy

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'OAuth authentication failed',
        });
      }

      // Use your AuthService's oauthCallback method
      const result = await this.authService.oauthCallback(user);

      // Set HTTP-only cookies for tokens
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend with success indicator
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      if (user.isOnboarding) {
        return res.redirect(`${frontendUrl}/onboarding`);
      } else {
        return res.redirect(`${frontendUrl}/dashboard`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);

      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?error=oauth_failed`;

      res.redirect(redirectUrl);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // The user should be attached to req by your auth middleware
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      res.status(200).json({
        status: 'success',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      if (user && user.id) {
        // Invalidate all user tokens
        await this.authService.invalidateAllUserTokens(user.id);
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  // Additional OAuth-specific methods you might need

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.query;
      const result = await this.authService.verifyEmail(token as string);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      const result = await this.authService.resetPassword(token, newPassword);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, type } = req.body;
      const result = await this.authService.processEmail(email, type, null);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
