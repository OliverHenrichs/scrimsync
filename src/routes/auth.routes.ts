import { Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '@/middleware/error.middleware';

export const createAuthRoutes = (): Router => {
  const router = Router();

  // Login route - redirects to Discord OAuth
  router.get(
    '/login',
    (req, res, next) => {
      console.log('Login route accessed');
      next();
    },
    passport.authenticate('discord', {
      scope: ['identify', 'guilds'],
    })
  );

  // OAuth callback route
  router.get(
    '/discord/callback',
    (req, res, next) => {
      console.log('Callback route accessed with code:', req.query.code);
      next();
    },
    passport.authenticate('discord', {
      failureRedirect: '/auth/login',
      successRedirect: '/',
    })
  );

  // Logout route
  router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Logout failed' });
      }
      res.redirect('/');
    });
  });

  // Get current user info
  router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any; // Type assertion for now
      res.json({
        success: true,
        data: {
          id: user?.id,
          username: user?.username,
          discriminator: user?.discriminator,
          avatar: user?.avatar,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }
  });

  return router;
}; 