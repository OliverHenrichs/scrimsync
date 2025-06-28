import {
  Client,
  GatewayIntentBits,
  Guild,
  GuildMember,
  TextChannel,
  Invite,
  PermissionFlagsBits,
} from 'discord.js';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { IDiscordService, DiscordGuild, DiscordMember } from '@/types';

export class DiscordService implements IDiscordService {
  private client: Client;
  private isReady = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
      ],
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      this.isReady = true;
      logger.info(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error:', error);
    });

    this.client.on('warn', (warning) => {
      logger.warn('Discord client warning:', warning);
    });
  }

  public async initialize(): Promise<void> {
    try {
      await this.client.login(config.discord.token);
      logger.info('Discord service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Discord service:', error);
      throw error;
    }
  }

  public async getGuild(guildId: string): Promise<DiscordGuild | null> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      return guild as DiscordGuild;
    } catch (error) {
      logger.error(`Failed to fetch guild ${guildId}:`, error);
      return null;
    }
  }

  public async getMember(guildId: string, userId: string): Promise<DiscordMember | null> {
    try {
      const guild = await this.getGuild(guildId);
      if (!guild) return null;

      const member = await guild.members.fetch(userId);
      return member as DiscordMember;
    } catch (error) {
      logger.error(`Failed to fetch member ${userId} from guild ${guildId}:`, error);
      return null;
    }
  }

  public async hasPermission(
    guildId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const member = await this.getMember(guildId, userId);
      if (!member) return false;

      // Check if user has the specific permission
      return member.permissions.has(permission as keyof typeof PermissionFlagsBits);
    } catch (error) {
      logger.error(`Failed to check permission for user ${userId}:`, error);
      return false;
    }
  }

  public async createInvite(
    channelId: string,
    options: {
      maxUses?: number;
      maxAge?: number;
      temporary?: boolean;
      reason?: string;
    } = {}
  ): Promise<Invite | null> {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error('Invalid text channel');
      }

      const inviteOptions: any = {};
      if (options.maxUses !== undefined) inviteOptions.maxUses = options.maxUses;
      if (options.maxAge !== undefined) inviteOptions.maxAge = options.maxAge;
      if (options.temporary !== undefined) inviteOptions.temporary = options.temporary;
      if (options.reason !== undefined) inviteOptions.reason = options.reason;

      const invite = await (channel as TextChannel).createInvite(inviteOptions);

      logger.info(`Created invite ${invite.code} for channel ${channelId}`);
      return invite;
    } catch (error) {
      logger.error(`Failed to create invite for channel ${channelId}:`, error);
      return null;
    }
  }

  public async deleteInvite(code: string): Promise<boolean> {
    try {
      const invite = await this.client.fetchInvite(code);
      await invite.delete();
      logger.info(`Deleted invite ${code}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete invite ${code}:`, error);
      return false;
    }
  }

  public async getGuildInvites(guildId: string): Promise<Invite[]> {
    try {
      const guild = await this.getGuild(guildId);
      if (!guild) return [];

      const invites = await guild.invites.fetch();
      return Array.from(invites.values());
    } catch (error) {
      logger.error(`Failed to fetch invites for guild ${guildId}:`, error);
      return [];
    }
  }

  public getClient(): Client {
    return this.client;
  }

  public isClientReady(): boolean {
    return this.isReady;
  }

  public async shutdown(): Promise<void> {
    try {
      await this.client.destroy();
      logger.info('Discord service shutdown successfully');
    } catch (error) {
      logger.error('Error during Discord service shutdown:', error);
    }
  }
}

export default DiscordService; 