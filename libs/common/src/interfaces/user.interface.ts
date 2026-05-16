import { UserRole } from '../constants';

export interface ITokenPayload {
  sub: string;       // userId
  role: UserRole;
  restaurantId?: string; // for RESTAURANT_OWNER
  jti: string;       // JWT ID for blacklisting
  iat: number;
  exp: number;
}

export interface IUser {
  id: string;
  phone?: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  status: 'ACTIVE' | 'BANNED' | 'PENDING';
}

// Forwarded from API Gateway via TCP payload
export interface IRequestUser {
  userId: string;
  role: UserRole;
  restaurantId?: string;
}

export interface ISocialProfile {
  provider: 'google' | 'facebook';
  providerId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}
