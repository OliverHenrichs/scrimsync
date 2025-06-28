import { Router } from 'express';
import InviteController from '@/controllers/invite.controller';
import { authenticateUser, requirePermission } from '@/middleware/auth.middleware';
import { asyncHandler } from '@/middleware/error.middleware';

export const createInviteRoutes = (inviteController: InviteController): Router => {
  const router = Router();

  // Create a new invite for a specific guild
  router.post(
    '/:guildId',
    authenticateUser,
    requirePermission('CreateInstantInvite'),
    asyncHandler(inviteController.createInvite)
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