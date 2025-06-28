import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, CreateInviteRequest } from '@/types';
import { AppError } from '@/types';
import InviteService from '@/services/invite.service';
import { config } from '@/config';

export class InviteController {
  private inviteService: InviteService;

  constructor(inviteService: InviteService) {
    this.inviteService = inviteService;
  }

  public createInvite = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { channelId, maxUses, maxAge, temporary, reason } = req.body as CreateInviteRequest;
    const { guildId } = req.params;

    if (!channelId) {
      throw new AppError('Channel ID is required', 400);
    }

    if (!guildId) {
      throw new AppError('Guild ID is required', 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate permissions
    const hasPermission = await this.inviteService.validateInvitePermissions(
      guildId,
      req.user.id,
      channelId
    );

    if (!hasPermission) {
      throw new AppError('Insufficient permissions to create invite', 403);
    }

    // Check if bot is still in the guild
    const botAccess = await this.inviteService.validateBotAccess(guildId);
    if (!botAccess) {
      res.status(403).json({
        success: false,
        error: 'Bot Access Error',
        message: 'The bot is not a member of this server. Please re-invite the bot to continue using this feature.',
      });
      return;
    }

    try {
      const inviteData = await this.inviteService.createInvite({
        channelId,
        maxUses,
        maxAge,
        temporary,
        reason,
      });

      res.status(201).json({
        success: true,
        data: inviteData,
        message: 'Invite created successfully',
      });
    } catch (error: any) {
      // Handle specific Discord API errors with appropriate status codes
      if (error.message?.includes('Bot does not have access to this server')) {
        res.status(403).json({
          success: false,
          error: 'Bot Access Error',
          message: 'The bot has been kicked from this server or lacks access. Please re-invite the bot to continue using this feature.',
        });
      } else if (error.message?.includes('Bot does not have permission')) {
        res.status(403).json({
          success: false,
          error: 'Permission Error',
          message: 'The bot lacks permission to create invites in this channel. Please ensure the bot has the "Create Instant Invite" permission.',
        });
      } else if (error.message?.includes('Channel not found') || error.message?.includes('Server not found')) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'The channel or server could not be found. It may have been deleted or the bot lacks access.',
        });
      } else {
        // Generic error handling
        res.status(500).json({
          success: false,
          error: 'Internal Server Error',
          message: error.message || 'Failed to create invite',
        });
      }
    }
  };

  public getInvite = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { code } = req.params;

    if (!code) {
      throw new AppError('Invite code is required', 400);
    }

    const inviteData = await this.inviteService.getInvite(code);

    if (!inviteData) {
      throw new AppError('Invite not found', 404);
    }

    res.json({
      success: true,
      data: inviteData,
    });
  };

  public getGuildInvites = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { guildId } = req.params;

    if (!guildId) {
      throw new AppError('Guild ID is required', 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const invites = await this.inviteService.getGuildInvites(guildId);

    res.json({
      success: true,
      data: invites,
    });
  };

  public checkBotStatus = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { guildId } = req.params;

    if (!guildId) {
      throw new AppError('Guild ID is required', 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    try {
      const botAccess = await this.inviteService.validateBotAccess(guildId);
      
      res.json({
        success: true,
        data: {
          guildId,
          botInGuild: botAccess,
          message: botAccess 
            ? 'Bot is active in this server' 
            : 'Bot is not a member of this server'
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to check bot status',
      });
    }
  };

  public deleteInvite = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { code } = req.params;

    if (!code) {
      throw new AppError('Invite code is required', 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const success = await this.inviteService.deleteInvite(code);

    if (!success) {
      throw new AppError('Failed to delete invite', 500);
    }

    res.json({
      success: true,
      message: 'Invite deleted successfully',
    });
  };
}

export default InviteController; 