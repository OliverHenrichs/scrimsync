import { Router } from 'express';
import InviteController from '@/controllers/invite.controller';
import { authenticateUser, requirePermission } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

export const createInviteRoutes = (inviteController: InviteController): Router => {
  const router = Router();

  // Bot invite page - requires authentication
  router.get('/bot-invite', authenticateUser, (req, res) => {
    try {
      // Generate a unique nonce for this request
      const nonce = crypto.randomBytes(16).toString('base64');
      
      // Read the HTML file from views directory
      const htmlPath = join(__dirname, '..', '..', 'src', 'views', 'bot-invite.html');
      let html = readFileSync(htmlPath, 'utf-8');
      
      // Replace the placeholder with the actual nonce
      html = html.replace('nonce="NONCE_PLACEHOLDER"', `nonce="${nonce}"`);
      
      // Set the nonce in the response headers for CSP
      res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
      res.send(html);
    } catch (error) {
      console.error('Error serving bot invite page:', error);
      res.status(500).send('Error loading bot invite page');
    }
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

  // Register slash commands for a specific guild
  router.post(
    '/:guildId/register-commands',
    authenticateUser,
    asyncHandler(inviteController.registerCommands)
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