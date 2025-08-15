import { BaseUserData } from './user.types';

export interface RegisterData extends BaseUserData {
  password: string;
  companyName: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phoneNumber?: string;
    profilePicture?: string;
    isEmailVerified: boolean;
    roles: string[];
    permissions: string[];
    company?: {
      id: string;
      name: string;
    };
    lastLogin?: Date;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}
