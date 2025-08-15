import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { User } from '../models/User';
import { UserStatus } from '../types';

// JWT Authentication
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: unknown, user: User) => {
      if (err) {
        return res
          .status(500)
          .json({ status: 'error', message: 'Authentication error' });
      }

      if (!user) {
        return res
          .status(401)
          .json({ status: 'error', message: 'Unauthorized' });
      }

      req.user = user;
      next();
    }
  )(req, res, next);
};

export const requireFullAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized' });
  }

  if (req.user.isOnboarding) {
    return res.status(403).json({
      status: 'error',
      message: 'You must complete onboarding before accessing this resource',
    });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      status: 'error',
      message: 'You must verify your email before accessing this resource',
    });
  }

  if (req.user.status !== UserStatus.ACTIVE) {
    return res.status(403).json({
      status: 'error',
      message:
        'You account has been suspended, contact company admin to resolve the issue or support if you are the admin',
    });
  }

  next();
};

// Optional authentication (for endpoints that work with or without auth)
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (_err: unknown, user: User) => {
      if (user) {
        req.user = user;
      }
      next();
    }
  )(req, res, next);
};
