import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types';
import { AppError } from '@/types';

// Discord OAuth authentication middleware
export const authenticateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as unknown as AuthenticatedRequest;
  
  if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
    throw new AppError('Authentication required', 401);
  }

  if (!authReq.user) {
    throw new AppError('User not found in session', 401);
  }

  next();
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as unknown as AuthenticatedRequest;
    
    if (!authReq.isAuthenticated || !authReq.isAuthenticated()) {
      throw new AppError('Authentication required', 401);
    }

    if (!authReq.user) {
      throw new AppError('User not found in session', 401);
    }

    // Add permission checking logic here
    // For now, we'll allow all authenticated users
    // In production, check against Discord permissions

    next();
  };
}; 