import { Request, Response } from 'express';
import { ApiResponse, CreateInviteRequest } from '@/types';
import { AppError } from '@/types';
import InviteService from '@/services/invite.service';
import { config } from '@/config';
import { PermissionFlagsBits } from 'discord.js';
import { DiscordService } from '@/services/discord.service';
import { logger } from '@/utils/logger';

export class InviteController {
  private inviteService: InviteService;

  constructor(inviteService: InviteService) {
    this.inviteService = inviteService;
  }

  public createInvite = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { guildId } = req.params;
    const { channelId, maxUses, maxAge, temporary, reason } = req.body as CreateInviteRequest;

    if (!guildId || !channelId) {
      throw new AppError('Guild ID and channel ID are required', 400);
    }

    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Type assertion for user object
    const user = req.user as { id: string; username: string; discriminator: string; avatar?: string };

    // Validate permissions
    const hasPermission = await this.inviteService.validateInvitePermissions(
      guildId,
      user.id,
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
    req: Request,
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
    req: Request,
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
    req: Request,
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

  public generateBotInvite = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    try {
      // Generate bot invite URL with minimal required permissions
      const permissions = [
        'ViewChannel',            // View channels
        'SendMessages',           // Send messages
        'ManageMessages',         // Manage messages
        'EmbedLinks',             // Embed links
        'AttachFiles',            // Attach files
        'ReadMessageHistory',     // Read message history
        'UseExternalEmojis',      // Use external emojis
        'AddReactions',           // Add reactions
      ];

      // Calculate permission bits
      const permissionBits = permissions.reduce((bits, permission) => {
        const permissionBit = PermissionFlagsBits[permission as keyof typeof PermissionFlagsBits];
        if (permissionBit) {
          return bits | permissionBit;
        }
        return bits;
      }, BigInt(0));

      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&permissions=${permissionBits.toString()}&scope=bot%20applications.commands`;

      console.log('Generated bot invite URL:', inviteUrl);
      console.log('Client ID:', config.discord.clientId);
      console.log('Permission bits:', permissionBits.toString());

      res.json({
        success: true,
        data: {
          inviteUrl,
          permissions,
          clientId: config.discord.clientId,
        },
        message: 'Bot invite URL generated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to generate bot invite URL',
      });
    }
  };
}

export default InviteController; 