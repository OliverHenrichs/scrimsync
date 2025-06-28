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
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #5865F2; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #4752C4; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .user-info { background: #e2e3e5; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
        .logout { text-align: right; margin-bottom: 20px; }
        .logout a { color: #dc3545; text-decoration: none; }
        .logout a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="logout">
        <a href="/auth/logout">Logout</a>
    </div>
    
    <h1>ScrimSync Dashboard</h1>
    
    <div class="user-info">
        <h3>Your Discord Account</h3>
        <div id="userInfo">Loading...</div>
        <small>This shows your Discord user ID, username, and discriminator (the numbers after your username)</small>
    </div>

    <h2>Create Invite</h2>
    <form id="inviteForm">
        <div class="form-group">
            <label for="guildId">Server ID:</label>
            <input type="text" id="guildId" required placeholder="e.g., 123456789012345678">
            <small>Right-click your Discord server name → "Copy Server ID"</small>
        </div>
        <div class="form-group">
            <label for="channelId">Channel ID:</label>
            <input type="text" id="channelId" required placeholder="e.g., 987654321098765432">
            <small>Right-click the channel → "Copy Channel ID"</small>
        </div>
        <div class="form-group">
            <label for="maxUses">Max Uses:</label>
            <input type="number" id="maxUses" min="1" max="100" value="10">
            <small>How many times the invite can be used (leave empty for unlimited)</small>
        </div>
        <div class="form-group">
            <label for="maxAge">Max Age (seconds):</label>
            <input type="number" id="maxAge" min="0" value="3600">
            <small>How long the invite is valid (0 = never expires)</small>
        </div>
        <div class="form-group">
            <label for="temporary">Temporary:</label>
            <select id="temporary">
                <option value="false">No</option>
                <option value="true">Yes</option>
            </select>
            <small>Temporary members get kicked when they go offline</small>
        </div>
        <div class="form-group">
            <label for="reason">Reason:</label>
            <input type="text" id="reason" placeholder="Scrim invite">
            <small>Optional reason for creating the invite</small>
        </div>
        <button type="submit">Create Invite</button>
    </form>

    <div id="result"></div>

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
                    document.getElementById('userInfo').innerHTML = 
                        \`<strong>ID:</strong> \${data.data.id}<br>
                         <strong>Username:</strong> \${data.data.username || 'N/A'}<br>
                         <strong>Discriminator:</strong> \${data.data.discriminator || 'N/A'}\`;
                } else {
                    document.getElementById('userInfo').innerHTML = 'Not authenticated';
                }
            })
            .catch(error => {
                console.error('Error loading user info:', error);
                document.getElementById('userInfo').innerHTML = 'Error loading user info - you may need to <a href="/auth/login">login again</a>';
            });

        // Handle form submission
        document.getElementById('inviteForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Creating...';
            submitButton.disabled = true;
            
            const guildId = document.getElementById('guildId').value;
            const channelId = document.getElementById('channelId').value;
            const maxUses = parseInt(document.getElementById('maxUses').value);
            const maxAge = parseInt(document.getElementById('maxAge').value);
            const temporary = document.getElementById('temporary').value === 'true';
            const reason = document.getElementById('reason').value;

            const payload = {
                channelId,
                maxUses: maxUses || undefined,
                maxAge: maxAge || undefined,
                temporary,
                reason: reason || undefined
            };

            console.log('Submitting payload:', payload);

            try {
                const response = await fetch(\`/api/invites/\${guildId}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                console.log('Response status:', response.status);
                const result = await response.json();
                console.log('Response result:', result);
                
                const resultDiv = document.getElementById('result');
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.innerHTML = \`
                        <h3>✅ Invite Created Successfully!</h3>
                        <p><strong>Invite Code:</strong> \${result.data.code}</p>
                        <p><strong>Invite URL:</strong> <a href="https://discord.gg/\${result.data.code}" target="_blank">https://discord.gg/\${result.data.code}</a></p>
                        <p><strong>Max Uses:</strong> \${result.data.maxUses || 'Unlimited'}</p>
                        <p><strong>Expires:</strong> \${result.data.expiresAt ? new Date(result.data.expiresAt).toLocaleString() : 'Never'}</p>
                    \`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.innerHTML = \`<h3>❌ Error</h3><p>\${result.error}</p>\`;
                }
            } catch (error) {
                console.error('Network error:', error);
                const resultDiv = document.getElementById('result');
                resultDiv.className = 'result error';
                resultDiv.innerHTML = \`<h3>❌ Network Error</h3><p>\${error.message}</p><p>Check the browser console for more details.</p>\`;
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    </script>
</body>
</html>`;
    
    // Set the nonce in the response headers for CSP
    res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
    res.send(html);
  });

  return router;
}; 