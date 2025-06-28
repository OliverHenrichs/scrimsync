import { Request, Response, NextFunction } from 'express';

// Discord OAuth authentication middleware
export const authenticateUser = (req: Request, res: Response, next: NextFunction): void => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/auth/');
  }
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // For now, allow all authenticated users in development
    // In production, implement proper permission checking
    if (process.env.NODE_ENV === 'development') {
      next();
      return;
    }

    // TODO: Implement proper permission checking
    res.status(403).json({ success: false, error: 'Insufficient permissions' });
  };
}; 