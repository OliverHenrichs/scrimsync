import { Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '@/middleware/error.middleware';
import crypto from 'crypto';

export const createAuthRoutes = (): Router => {
  const router = Router();

  // Login page route - shows login interface
  router.get('/', (req, res) => {
    // Generate a unique nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScrimSync - Login</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; 
            padding: 0; 
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            color: #5865F2;
            margin-bottom: 10px;
        }
        .tagline {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .discord-btn {
            background: #5865F2;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 8px;
            font-size: 1.1em;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(88, 101, 242, 0.4);
        }
        .discord-btn:hover {
            background: #4752C4;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(88, 101, 242, 0.6);
        }
        .discord-btn:active {
            transform: translateY(0);
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .features h3 {
            color: #333;
            margin-bottom: 15px;
        }
        .feature {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            color: #666;
        }
        .feature::before {
            content: "✓";
            color: #28a745;
            font-weight: bold;
            margin-right: 10px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">ScrimSync</div>
        <div class="tagline">Discord Bot Management Dashboard</div>
        
        <a href="/auth/login" class="discord-btn">
            Login with Discord
        </a>
        
        <div class="features">
            <h3>What you can do:</h3>
            <div class="feature">Create and manage Discord invites</div>
            <div class="feature">Multi-server support</div>
            <div class="feature">Secure OAuth authentication</div>
            <div class="feature">Persistent sessions</div>
        </div>
        
        <div class="footer">
            Secure authentication powered by Discord OAuth2
        </div>
    </div>
</body>
</html>`;
    
    // Set the nonce in the response headers for CSP
    res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
    res.send(html);
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
      res.redirect('/auth/');
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