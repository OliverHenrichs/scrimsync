import { Router } from 'express';
import { authenticateUser } from '@/middleware/auth.middleware';
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
    // Generate a unique nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ScrimSync Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #f0f0f0;
        }

        .logo {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            color: white;
            font-weight: bold;
        }

        h1 {
            color: #333;
            font-size: 28px;
            margin: 0;
        }

        .logout {
            text-align: right;
        }

        .logout a {
            color: #dc3545;
            text-decoration: none;
            font-weight: 500;
            padding: 8px 16px;
            border: 1px solid #dc3545;
            border-radius: 20px;
            transition: all 0.3s ease;
        }

        .logout a:hover {
            background: #dc3545;
            color: white;
        }

        .invite-notice {
            margin-bottom: 30px;
            padding: 20px;
            background: #e7f3ff;
            border-radius: 15px;
            border-left: 4px solid #2196F3;
        }

        .invite-notice h3 {
            margin: 0 0 10px 0;
            color: #1976D2;
            font-size: 18px;
        }

        .invite-notice p {
            margin: 0 0 15px 0;
            color: #333;
            line-height: 1.5;
        }

        .invite-button {
            background: #2196F3;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 25px;
            display: inline-block;
            font-weight: 500;
            transition: all 0.3s ease;
        }

        .invite-button:hover {
            background: #1976D2;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(33, 150, 243, 0.3);
        }

        .user-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
        }

        .user-info h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }

        .user-info-content {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .user-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            border: 3px solid #667eea;
            flex-shrink: 0;
        }

        .user-details {
            color: #555;
            line-height: 1.6;
        }

        .user-info small {
            color: #666;
            font-size: 12px;
            margin-top: 10px;
            display: block;
        }

        .form-section {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 20px;
        }

        .form-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 22px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }

        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            transition: border-color 0.3s ease;
        }

        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }

        small {
            color: #666;
            font-size: 12px;
            margin-top: 5px;
            display: block;
        }

        .button-group {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-bottom: 20px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-success {
            background: #28a745;
            color: white;
        }

        .btn-success:hover {
            background: #218838;
            transform: translateY(-2px);
        }

        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        .status-indicator {
            font-weight: 600;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
        }

        .result {
            margin-top: 20px;
            padding: 20px;
            border-radius: 15px;
            border: none;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border-left: 4px solid #28a745;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border-left: 4px solid #dc3545;
        }

        .result h3 {
            margin-bottom: 10px;
            font-size: 18px;
        }

        .result p {
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .result a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }

        .result a:hover {
            text-decoration: underline;
        }

        @media (max-width: 768px) {
            .container {
                padding: 20px;
            }
            
            .header {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }
            
            .button-group {
                flex-direction: column;
                align-items: stretch;
            }
            
            .btn {
                text-align: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div style="display: flex; align-items: center; gap: 15px;">
                <div class="logo">SS</div>
                <h1>ScrimSync Dashboard</h1>
            </div>
            <div class="logout">
                <a href="/auth/logout">Logout</a>
            </div>
        </div>
        
        <div class="invite-notice">
            <h3>Need to add the bot to a server?</h3>
            <p>If the bot isn't in your server yet, you can invite it using the button below.</p>
            <a href="/api/invites/bot-invite" class="invite-button">Invite Bot to Server</a>
        </div>

        <div class="user-info">
            <h3>Your Discord Account</h3>
            <div class="user-info-content">
                <img id="userAvatar" class="user-avatar" src="" alt="User Avatar" style="display: none;">
                <div class="user-details" id="userInfo">Loading...</div>
            </div>
            <small>This shows your Discord user ID, username, and discriminator (the numbers after your username)</small>
        </div>

        <div class="form-section">
            <h2>Bot Status Check</h2>
            <p style="margin-bottom: 20px; color: #666;">Check if the bot is active in a specific server.</p>
            
            <div class="form-group">
                <label for="guildId">Server ID:</label>
                <input type="text" id="guildId" placeholder="e.g., 123456789012345678">
                <small>Right-click your Discord server name → "Copy Server ID"</small>
            </div>
            
            <div class="form-group">
                <div class="button-group">
                    <button type="button" id="checkBotStatus" class="btn btn-success">Check Bot Status</button>
                    <span id="botStatus" class="status-indicator"></span>
                </div>
            </div>

            <div id="result"></div>
        </div>
    </div>

    <script nonce="${nonce}">
        // Load user info
        fetch('/auth/user')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Not authenticated');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Display user info
                    document.getElementById('userInfo').innerHTML = 
                        \`<strong>ID:</strong> \${data.data.id}<br>
                         <strong>Username:</strong> \${data.data.username || 'N/A'}<br>
                         <strong>Discriminator:</strong> \${data.data.discriminator || 'N/A'}\`;
                    
                    // Display avatar if available
                    const avatarImg = document.getElementById('userAvatar');
                    if (data.data.avatar) {
                        const avatarUrl = \`https://cdn.discordapp.com/avatars/\${data.data.id}/\${data.data.avatar}.png\`;
                        avatarImg.src = avatarUrl;
                        avatarImg.style.display = 'block';
                    } else {
                        // Use default Discord avatar if no custom avatar
                        const defaultAvatarUrl = \`https://cdn.discordapp.com/embed/avatars/\${parseInt(data.data.discriminator) % 5}.png\`;
                        avatarImg.src = defaultAvatarUrl;
                        avatarImg.style.display = 'block';
                    }
                } else {
                    document.getElementById('userInfo').innerHTML = 'Not authenticated';
                }
            })
            .catch(error => {
                console.error('Error loading user info:', error);
                document.getElementById('userInfo').innerHTML = 'Error loading user info - you may need to <a href="/auth/login">login again</a>';
            });

        // Handle bot status check
        document.getElementById('checkBotStatus').addEventListener('click', async () => {
            const guildId = document.getElementById('guildId').value;
            const statusSpan = document.getElementById('botStatus');
            const checkButton = document.getElementById('checkBotStatus');
            
            if (!guildId) {
                statusSpan.textContent = 'Please enter a Server ID first';
                statusSpan.style.color = '#dc3545';
                statusSpan.style.background = '#f8d7da';
                return;
            }
            
            checkButton.textContent = 'Checking...';
            checkButton.disabled = true;
            
            try {
                const response = await fetch(\`/api/invites/\${guildId}/status\`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (result.data.botInGuild) {
                        statusSpan.textContent = '✅ Bot is active in this server';
                        statusSpan.style.color = '#155724';
                        statusSpan.style.background = '#d4edda';
                    } else {
                        statusSpan.textContent = '❌ Bot is not in this server - use the invite button above';
                        statusSpan.style.color = '#721c24';
                        statusSpan.style.background = '#f8d7da';
                    }
                } else {
                    statusSpan.textContent = '❌ Error checking bot status';
                    statusSpan.style.color = '#721c24';
                    statusSpan.style.background = '#f8d7da';
                }
            } catch (error) {
                console.error('Error checking bot status:', error);
                statusSpan.textContent = '❌ Network error checking bot status';
                statusSpan.style.color = '#721c24';
                statusSpan.style.background = '#f8d7da';
            } finally {
                checkButton.textContent = 'Check Bot Status';
                checkButton.disabled = false;
            }
        });

        // Check if user is authenticated
        async function checkAuth() {
            try {
                const response = await fetch('/auth/user', {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    window.location.href = '/auth/login';
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                window.location.href = '/auth/login';
            }
        }

        // Check authentication on page load
        checkAuth();
    </script>
</body>
</html>`;
    
    // Set the nonce in the response headers for CSP
    res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
    res.send(html);
  });

  return router;
}; 