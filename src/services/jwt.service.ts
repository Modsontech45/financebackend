import jwt from 'jsonwebtoken';

export class AppError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

export class JWTService {
  private static instance: JWTService;
  private static JWT_SECRET = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');
    return secret;
  })();
  private static JWT_EXPIRATION = (process.env.JWT_EXPIRATION ||
    '1h') as jwt.SignOptions['expiresIn'];
  private static JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRATION ||
    '7d') as jwt.SignOptions['expiresIn'];

  private constructor() {}

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  public generateToken(payload: object): string {
    return jwt.sign(payload, JWTService.JWT_SECRET, {
      expiresIn: JWTService.JWT_EXPIRATION,
    });
  }

  public generateRefreshToken(payload: object): string {
    return jwt.sign(payload, JWTService.JWT_SECRET, {
      expiresIn: JWTService.JWT_REFRESH_EXPIRES_IN,
    });
  }

  public verifyToken<T>(token: string): T {
    try {
      const decoded = jwt.verify(token, JWTService.JWT_SECRET);
      return decoded as T;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401);
      } else {
        throw new AppError('Token verification failed', 500);
      }
    }
  }

  public decodeToken<T>(token: string): T | null {
    try {
      return jwt.decode(token) as T;
    } catch {
      return null;
    }
  }
}
