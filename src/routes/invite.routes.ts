import { Router } from 'express';
import InviteController from '@/controllers/invite.controller';
import { authenticateUser, requirePermission } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import crypto from 'crypto';

export const createInviteRoutes = (inviteController: InviteController): Router => {
  const router = Router();

  // Bot invite page - requires authentication
  router.get('/bot-invite', authenticateUser, (req, res) => {
    // Generate a unique nonce for this request
    const nonce = crypto.randomBytes(16).toString('base64');
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invite ScrimSync Bot</title>
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
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: center;
        }

        .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            font-weight: bold;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }

        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
            line-height: 1.5;
        }

        .permissions {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }

        .permissions h3 {
            color: #333;
            margin-bottom: 15px;
            font-size: 18px;
        }

        .permission-list {
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
        }

        .permission-list li {
            color: #555;
            font-size: 14px;
            padding: 5px 0;
            position: relative;
            padding-left: 20px;
        }

        .permission-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #28a745;
            font-weight: bold;
        }

        .invite-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
        }

        .invite-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .invite-button:active {
            transform: translateY(0);
        }

        .loading {
            display: none;
            color: #666;
            margin: 20px 0;
        }

        .error {
            color: #dc3545;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 10px;
            margin: 20px 0;
            display: none;
        }

        .back-link {
            color: #667eea;
            text-decoration: none;
            font-size: 14px;
            margin-top: 20px;
            display: inline-block;
        }

        .back-link:hover {
            text-decoration: underline;
        }

        @media (max-width: 480px) {
            .container {
                padding: 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .permission-list {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">SS</div>
        <h1>Invite ScrimSync Bot</h1>
        <p class="subtitle">Add ScrimSync to your Discord server to start managing invites and more!</p>
        
        <div class="permissions">
            <h3>Bot Permissions</h3>
            <ul class="permission-list">
                <li>View Channels</li>
                <li>Send Messages</li>
                <li>Manage Messages</li>
                <li>Embed Links</li>
                <li>Attach Files</li>
                <li>Read Message History</li>
                <li>Use External Emojis</li>
                <li>Add Reactions</li>
            </ul>
        </div>

        <div class="loading" id="loading">Generating invite link...</div>
        <div class="error" id="error"></div>

        <a href="#" class="invite-button" id="inviteButton">
            Invite to Server
        </a>

        <a href="/dashboard" class="back-link">← Back to Dashboard</a>
    </div>

    <script nonce="${nonce}">
        async function generateInvite() {
            const button = document.getElementById('inviteButton');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');

            // Show loading state
            button.style.display = 'none';
            loading.style.display = 'block';
            error.style.display = 'none';

            try {
                const response = await fetch('/api/invites/bot/invite', {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (data.success) {
                    // Log the URL for debugging
                    console.log('Generated invite URL:', data.data.inviteUrl);
                    
                    // Try to redirect
                    try {
                        window.location.href = data.data.inviteUrl;
                    } catch (redirectError) {
                        console.error('Redirect failed:', redirectError);
                        // Fallback: open in new tab
                        window.open(data.data.inviteUrl, '_blank');
                    }
                } else {
                    throw new Error(data.message || 'Failed to generate invite');
                }
            } catch (err) {
                console.error('Error generating invite:', err);
                error.textContent = err.message || 'Failed to generate invite link. Please try again.';
                error.style.display = 'block';
                button.style.display = 'inline-block';
            } finally {
                loading.style.display = 'none';
            }
        }

        // Add event listener to the invite button
        document.getElementById('inviteButton').addEventListener('click', generateInvite);

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

  // Create a new invite for a specific guild
  router.post(
    '/:guildId',
    authenticateUser,
    requirePermission('CreateInstantInvite'),
    asyncHandler(inviteController.createInvite)
  );

  // Check bot status for a specific guild
  router.get(
    '/:guildId/status',
    authenticateUser,
    asyncHandler(inviteController.checkBotStatus)
  );

  // Generate bot invite URL
  router.get(
    '/bot/invite',
    authenticateUser,
    asyncHandler(inviteController.generateBotInvite)
  );

  // Get a specific invite by code
  router.get(
    '/:code',
    asyncHandler(inviteController.getInvite)
  );

  // Get all invites for a specific guild
  router.get(
    '/guild/:guildId',
    authenticateUser,
    requirePermission('ManageGuild'),
    asyncHandler(inviteController.getGuildInvites)
  );

  // Delete an invite
  router.delete(
    '/:code',
    authenticateUser,
    requirePermission('ManageGuild'),
    asyncHandler(inviteController.deleteInvite)
  );

  return router;
}; 