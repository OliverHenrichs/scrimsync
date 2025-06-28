import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { AppError } from '@/types';
import { config } from '@/config';

// Simple authentication middleware - can be extended with Discord OAuth
export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // For now, we'll use a simple header-based auth
  // In production, you'd want to implement Discord OAuth
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError('Authorization header required', 401);
  }

  // Check if the token matches our JWT secret (simple validation for now)
  // In production, you'd validate a proper JWT token
  const expectedToken = `Bearer ${config.security.jwtSecret}`;
  
  if (authHeader !== expectedToken) {
    throw new AppError('Invalid authorization token', 401);
  }

  // Mock user data - replace with actual Discord user data
  req.user = {
    id: '123456789',
    username: 'testuser',
    discriminator: '0000',
  };

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Add permission checking logic here
    // For now, we'll allow all authenticated users
    // In production, check against Discord permissions

    next();
  };
}; 