import {
  Client,
  GatewayIntentBits,
  Guild,
  GuildMember,
  TextChannel,
  Invite,
  PermissionFlagsBits,
  Events,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
} from 'discord.js';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { IDiscordService, DiscordGuild, DiscordMember, LobbyData, LobbyStatus } from '@/types';
import LobbyService from './lobby.service';

export class DiscordService implements IDiscordService {
  private client: Client;
  private isReady = false;
  private lobbyService: LobbyService;

  constructor(lobbyService: LobbyService) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });
    this.lobbyService = lobbyService;

    this.setupEventHandlers();
    this.setupSlashCommands();
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

    // Handle slash command interactions
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleInteraction(interaction);
      }
    });

    // Handle when bot joins a new guild
    this.client.on(Events.GuildCreate, async (guild) => {
      logger.info(`Bot joined guild: ${guild.name} (${guild.id})`);
      await this.registerCommandsForGuild(guild.id);
    });

    // Handle message reactions
    this.client.on(Events.MessageReactionAdd, this.handleReactionAdd.bind(this));
    this.client.on(Events.MessageReactionRemove, this.handleReactionRemove.bind(this));
  }

  private setupSlashCommands(): void {
    const scrimCommand = new SlashCommandBuilder()
      .setName('scrim')
      .setDescription('Create a new scrim/lobby')
      .addStringOption(option =>
        option
          .setName('title')
          .setDescription('The title of the scrim')
          .setRequired(true)
      )
      .addStringOption(option =>
        option
          .setName('time')
          .setDescription('When the scrim should start (optional, format: YYYY-MM-DD HH:MM)')
          .setRequired(false)
      )
      .addIntegerOption(option =>
        option
          .setName('max_players')
          .setDescription('Maximum number of players (optional)')
          .setRequired(false)
          .setMinValue(2)
          .setMaxValue(50)
      );

    // Register the command
    this.client.once('ready', async () => {
      try {
        // For development, register as guild commands (appear instantly)
        // For production, you might want to use global commands
        const guilds = this.client.guilds.cache;
        
        for (const [guildId, guild] of guilds) {
          try {
            await guild.commands.set([scrimCommand]);
            logger.info(`Slash commands registered for guild: ${guild.name} (${guildId})`);
          } catch (error) {
            logger.error(`Failed to register commands for guild ${guild.name}:`, error);
          }
        }
        
        logger.info('Slash commands registration completed');
      } catch (error) {
        logger.error('Failed to register slash commands:', error);
      }
    });
  }

  private async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'scrim') {
      await this.handleScrimCommand(interaction);
    }
  }

  private async handleScrimCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      const title = interaction.options.getString('title', true);
      const timeString = interaction.options.getString('time');
      const maxPlayers = interaction.options.getInteger('max_players');

      let scheduledStartTime: Date | undefined;
      if (timeString) {
        scheduledStartTime = new Date(timeString);
        if (isNaN(scheduledStartTime.getTime())) {
          await interaction.reply({
            content: '❌ Invalid time format. Please use YYYY-MM-DD HH:MM format.',
            ephemeral: true
          });
          return;
        }
      }

      // Create the lobby
      const lobbyData = {
        guildId: interaction.guildId!,
        channelId: interaction.channelId,
        creatorId: interaction.user.id,
        title,
        scheduledStartTime,
        maxParticipants: maxPlayers || undefined,
      };

      const lobby = await this.lobbyService.createLobby(lobbyData);

      // Create the lobby message
      const embed = this.createLobbyEmbed(lobby, interaction.user.username);
      const buttons = this.createLobbyButtons(lobby.id);

      const message = await interaction.reply({
        embeds: [embed],
        components: [buttons],
        fetchReply: true
      });

      // Update the lobby with the message ID
      await this.lobbyService.setMessageId(lobby.id, message.id);

      logger.info(`Created scrim lobby ${lobby.id} by ${interaction.user.tag}`);
    } catch (error: any) {
      logger.error('Error handling scrim command:', error);
      await interaction.reply({
        content: `❌ Failed to create scrim: ${error.message}`,
        ephemeral: true
      });
    }
  }

  private createLobbyEmbed(lobby: LobbyData, creatorName: string): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(`🎮 ${lobby.title}`)
      .setColor(lobby.status === LobbyStatus.PENDING ? 0x00ff00 : 0xff0000)
      .setDescription(`Created by ${creatorName}`)
      .addFields(
        { name: 'Status', value: this.getStatusEmoji(lobby.status) + ' ' + lobby.status.toUpperCase(), inline: true },
        { name: 'Participants', value: `${lobby.participants.length}${lobby.maxParticipants ? `/${lobby.maxParticipants}` : ''}`, inline: true }
      );

    if (lobby.scheduledStartTime) {
      embed.addFields({
        name: 'Scheduled Start',
        value: `<t:${Math.floor(lobby.scheduledStartTime.getTime() / 1000)}:F>`,
        inline: true
      });
    }

    if (lobby.participants.length > 0) {
      const participantList = lobby.participants.map(id => `<@${id}>`).join(', ');
      embed.addFields({ name: 'Players', value: participantList });
    }

    embed.setTimestamp(lobby.createdAt);

    return embed;
  }

  private createLobbyButtons(lobbyId: string): ActionRowBuilder<ButtonBuilder> {
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`join_${lobbyId}`)
          .setLabel('Join')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`leave_${lobbyId}`)
          .setLabel('Leave')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('❌'),
        new ButtonBuilder()
          .setCustomId(`start_${lobbyId}`)
          .setLabel('Start')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('▶️'),
        new ButtonBuilder()
          .setCustomId(`cancel_${lobbyId}`)
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⏹️')
      );

    return row;
  }

  private getStatusEmoji(status: LobbyStatus): string {
    switch (status) {
      case LobbyStatus.PENDING: return '⏳';
      case LobbyStatus.ACTIVE: return '▶️';
      case LobbyStatus.CANCELLED: return '❌';
      case LobbyStatus.COMPLETED: return '✅';
      default: return '❓';
    }
  }

  private async handleReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
    if (user.bot) return;

    try {
      const messageId = reaction.message.id;
      const userId = user.id;

      // Find the lobby by message ID
      // This is a simplified approach - in a real implementation, you'd want to store messageId -> lobbyId mapping
      const lobbies = await this.lobbyService.getGuildLobbies(reaction.message.guildId!);
      const lobby = lobbies.find(l => l.messageId === messageId);

      if (!lobby) return;

      const emoji = reaction.emoji.name;

      switch (emoji) {
        case '✅':
          await this.lobbyService.addParticipant(lobby.id, userId);
          break;
        case '❌':
          await this.lobbyService.removeParticipant(lobby.id, userId);
          break;
        case '▶️':
          if (lobby.creatorId === userId) {
            await this.lobbyService.startLobby(lobby.id);
          }
          break;
        case '⏹️':
          if (lobby.creatorId === userId) {
            await this.lobbyService.cancelLobby(lobby.id);
          }
          break;
      }

      // Update the message
      await this.updateLobbyMessage(lobby.id);
    } catch (error) {
      logger.error('Error handling reaction add:', error);
    }
  }

  private async handleReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser): Promise<void> {
    if (user.bot) return;

    try {
      const messageId = reaction.message.id;
      const userId = user.id;

      // Find the lobby by message ID
      const lobbies = await this.lobbyService.getGuildLobbies(reaction.message.guildId!);
      const lobby = lobbies.find(l => l.messageId === messageId);

      if (!lobby) return;

      const emoji = reaction.emoji.name;

      if (emoji === '✅') {
        await this.lobbyService.removeParticipant(lobby.id, userId);
        await this.updateLobbyMessage(lobby.id);
      }
    } catch (error) {
      logger.error('Error handling reaction remove:', error);
    }
  }

  private async updateLobbyMessage(lobbyId: string): Promise<void> {
    try {
      const lobby = await this.lobbyService.getLobby(lobbyId);
      if (!lobby || !lobby.messageId) return;

      const channel = await this.client.channels.fetch(lobby.channelId);
      if (!channel?.isTextBased()) return;

      const message = await channel.messages.fetch(lobby.messageId);
      if (!message) return;

      const creator = await this.client.users.fetch(lobby.creatorId);
      const embed = this.createLobbyEmbed(lobby, creator.username);
      const buttons = this.createLobbyButtons(lobby.id);

      await message.edit({
        embeds: [embed],
        components: [buttons]
      });
    } catch (error) {
      logger.error('Error updating lobby message:', error);
    }
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
    } catch (error: any) {
      // Handle specific Discord API errors
      if (error.code === 50001) {
        logger.error(`Bot lacks access to channel ${channelId} - bot may have been kicked from the server`);
        throw new Error('Bot does not have access to this server. The bot may have been kicked from the server or lacks the required permissions.');
      } else if (error.code === 50013) {
        logger.error(`Bot lacks permissions to create invites in channel ${channelId}`);
        throw new Error('Bot does not have permission to create invites in this channel.');
      } else if (error.code === 10003) {
        logger.error(`Channel ${channelId} not found`);
        throw new Error('Channel not found. The channel may have been deleted or the bot lacks access.');
      } else if (error.code === 10004) {
        logger.error(`Guild not found for channel ${channelId}`);
        throw new Error('Server not found. The bot may have been kicked from the server.');
      } else {
        logger.error(`Failed to create invite for channel ${channelId}:`, error);
        throw new Error(`Failed to create invite: ${error.message || 'Unknown error'}`);
      }
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

  public async registerCommandsForGuild(guildId: string): Promise<boolean> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) {
        logger.error(`Guild ${guildId} not found`);
        return false;
      }

      const scrimCommand = new SlashCommandBuilder()
        .setName('scrim')
        .setDescription('Create a new scrim/lobby')
        .addStringOption(option =>
          option
            .setName('title')
            .setDescription('The title of the scrim')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('time')
            .setDescription('When the scrim should start (optional, format: YYYY-MM-DD HH:MM)')
            .setRequired(false)
        )
        .addIntegerOption(option =>
          option
            .setName('max_players')
            .setDescription('Maximum number of players (optional)')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(50)
        );

      await guild.commands.set([scrimCommand]);
      logger.info(`Slash commands registered for guild: ${guild.name} (${guildId})`);
      return true;
    } catch (error) {
      logger.error(`Failed to register commands for guild ${guildId}:`, error);
      return false;
    }
  }

  public async isBotInGuild(guildId: string): Promise<boolean> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      return guild !== null;
    } catch (error: any) {
      if (error.code === 10004) {
        // Guild not found - bot is not in this guild
        return false;
      }
      logger.error(`Error checking if bot is in guild ${guildId}:`, error);
      return false;
    }
  }

  public async getBotStatus(guildId: string): Promise<{
    botInGuild: boolean;
    guildName?: string;
    guildId: string;
    memberCount?: number;
    icon?: string;
  }> {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      
      const result: {
        botInGuild: boolean;
        guildName?: string;
        guildId: string;
        memberCount?: number;
        icon?: string;
      } = {
        botInGuild: true,
        guildName: guild.name,
        guildId: guild.id,
      };

      if (guild.memberCount) {
        result.memberCount = guild.memberCount;
      }

      if (guild.icon) {
        result.icon = guild.icon;
      }

      return result;
    } catch (error: any) {
      if (error.code === 10004) {
        // Guild not found - bot is not in this guild
        return {
          botInGuild: false,
          guildId,
        };
      }
      logger.error(`Error checking bot status for guild ${guildId}:`, error);
      return {
        botInGuild: false,
        guildId,
      };
    }
  }
}

export default DiscordService; 