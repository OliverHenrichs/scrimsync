import { Invite } from 'discord.js';
import { logger } from '@/utils/logger';
import { IInviteService, InviteData, CreateInviteRequest } from '@/types';
import DiscordService from './discord.service';

export class InviteService implements IInviteService {
  private discordService: DiscordService;

  constructor(discordService: DiscordService) {
    this.discordService = discordService;
  }

  public async createInvite(data: CreateInviteRequest): Promise<InviteData> {
    try {
      const inviteOptions: any = {};
      if (data.maxUses !== undefined) inviteOptions.maxUses = data.maxUses;
      if (data.maxAge !== undefined) inviteOptions.maxAge = data.maxAge;
      if (data.temporary !== undefined) inviteOptions.temporary = data.temporary;
      if (data.reason !== undefined) inviteOptions.reason = data.reason;

      const discordInvite = await this.discordService.createInvite(data.channelId, inviteOptions);

      if (!discordInvite) {
        throw new Error('Failed to create Discord invite');
      }

      const inviteData: InviteData = {
        id: discordInvite.code,
        code: discordInvite.code,
        guildId: discordInvite.guild?.id || '',
        channelId: discordInvite.channel?.id || '',
        creatorId: discordInvite.inviter?.id || '',
        createdAt: discordInvite.createdAt || new Date(),
        expiresAt: discordInvite.expiresAt || undefined,
        maxUses: discordInvite.maxUses || undefined,
        uses: discordInvite.uses || 0,
        temporary: discordInvite.temporary || false,
      };

      logger.info(`Created invite ${inviteData.code} for channel ${data.channelId}`);
      return inviteData;
    } catch (error) {
      logger.error('Error creating invite:', error);
      throw error;
    }
  }

  public async getInvite(code: string): Promise<InviteData | null> {
    try {
      const discordInvite = await this.discordService.getClient().fetchInvite(code);
      
      if (!discordInvite) {
        return null;
      }

      const inviteData: InviteData = {
        id: discordInvite.code,
        code: discordInvite.code,
        guildId: discordInvite.guild?.id || '',
        channelId: discordInvite.channel?.id || '',
        creatorId: discordInvite.inviter?.id || '',
        createdAt: discordInvite.createdAt || new Date(),
        expiresAt: discordInvite.expiresAt || undefined,
        maxUses: discordInvite.maxUses || undefined,
        uses: discordInvite.uses || 0,
        temporary: discordInvite.temporary || false,
      };

      return inviteData;
    } catch (error) {
      logger.error(`Error fetching invite ${code}:`, error);
      return null;
    }
  }

  public async getGuildInvites(guildId: string): Promise<InviteData[]> {
    try {
      const discordInvites = await this.discordService.getGuildInvites(guildId);
      
      return discordInvites.map((discordInvite) => ({
        id: discordInvite.code,
        code: discordInvite.code,
        guildId: discordInvite.guild?.id || '',
        channelId: discordInvite.channel?.id || '',
        creatorId: discordInvite.inviter?.id || '',
        createdAt: discordInvite.createdAt || new Date(),
        expiresAt: discordInvite.expiresAt || undefined,
        maxUses: discordInvite.maxUses || undefined,
        uses: discordInvite.uses || 0,
        temporary: discordInvite.temporary || false,
      }));
    } catch (error) {
      logger.error(`Error fetching invites for guild ${guildId}:`, error);
      return [];
    }
  }

  public async deleteInvite(code: string): Promise<boolean> {
    try {
      const success = await this.discordService.deleteInvite(code);
      if (success) {
        logger.info(`Successfully deleted invite ${code}`);
      }
      return success;
    } catch (error) {
      logger.error(`Error deleting invite ${code}:`, error);
      return false;
    }
  }

  public async validateInvitePermissions(
    guildId: string,
    userId: string,
    channelId: string
  ): Promise<boolean> {
    try {
      // For development/testing, allow all requests
      // In production, you'd want proper Discord permission checking
      if (process.env.NODE_ENV === 'development') {
        return true;
      }

      // Check if user has permission to create invites in the guild
      const hasGuildPermission = await this.discordService.hasPermission(
        guildId,
        userId,
        'CreateInstantInvite'
      );

      if (!hasGuildPermission) {
        logger.warn(`User ${userId} lacks CreateInstantInvite permission in guild ${guildId}`);
        return false;
      }

      // Additional validation can be added here
      // For example, checking channel-specific permissions
      
      return true;
    } catch (error) {
      logger.error(`Error validating invite permissions for user ${userId}:`, error);
      return false;
    }
  }
}

export default InviteService; 