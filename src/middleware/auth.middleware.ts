import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { AppError } from '@/types';

// Discord OAuth authentication middleware
export const authenticateUser = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    throw new AppError('Authentication required', 401);
  }

  if (!req.user) {
    throw new AppError('User not found in session', 401);
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user) {
      throw new AppError('User not found in session', 401);
    }

    // Add permission checking logic here
    // For now, we'll allow all authenticated users
    // In production, check against Discord permissions

    next();
  };
}; 