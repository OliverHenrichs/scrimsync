import { Router } from 'express';
import { authenticateUser } from '@/middleware/auth.middleware';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const createDashboardRoutes = (): Router => {
  const router = Router();

  // Dashboard page - requires authentication
  router.get('/', (req, res, next) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/');
    }
    next();
  }, (req, res) => {
    try {
      // Generate a unique nonce for this request
      const nonce = crypto.randomBytes(16).toString('base64');
      
      // Read the HTML file from views directory (relative to project root)
      const htmlPath = join(__dirname, '..', '..', 'src', 'views', 'dashboard.html');
      let html = readFileSync(htmlPath, 'utf-8');
      
      // Replace the placeholder with the actual nonce
      html = html.replace('nonce="NONCE_PLACEHOLDER"', `nonce="${nonce}"`);
      
      // Set the nonce in the response headers for CSP
      res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
      res.send(html);
    } catch (error) {
      console.error('Error serving dashboard:', error);
      res.status(500).send('Error loading dashboard');
    }
  });

  return router;
}; 