import { Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '@/middleware/error.middleware';
import crypto from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

export const createAuthRoutes = (): Router => {
  const router = Router();

  // Login page route - shows login interface
  router.get('/', (req, res) => {
    try {
      // Generate a unique nonce for this request
      const nonce = crypto.randomBytes(16).toString('base64');
      
      // Read the HTML file from views directory
      const htmlPath = join(__dirname, '..', '..', 'src', 'views', 'login.html');
      let html = readFileSync(htmlPath, 'utf-8');
      
      // Replace the placeholder with the actual nonce (if needed for future JS injection)
      html = html.replace('nonce="NONCE_PLACEHOLDER"', `nonce="${nonce}"`);
      
      // Set the nonce in the response headers for CSP
      res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
      res.send(html);
    } catch (error) {
      console.error('Error serving login page:', error);
      res.status(500).send('Error loading login page');
    }
  });

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
      failureRedirect: '/auth/',
      successRedirect: '/dashboard',
    })
  );

  // Logout route
  router.get('/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Logout failed' });
      }
      return res.redirect('/auth/');
    });
  });

  // Get current user info
  router.get('/user', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any; // Type assertion for now
      console.log('User data from session:', user);
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

  // Authentication status endpoint
  router.get('/status', (req, res) => {
    res.json({
      success: true,
      data: {
        authenticated: req.isAuthenticated(),
        user: req.isAuthenticated() ? req.user : null,
        sessionId: req.sessionID,
      },
    });
  });

  return router;
}; 