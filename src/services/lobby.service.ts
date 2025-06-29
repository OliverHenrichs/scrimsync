import { v4 as uuidv4 } from 'uuid';
import { 
  LobbyData, 
  LobbyStatus, 
  CreateLobbyRequest, 
  UpdateLobbyRequest, 
  ILobbyService 
} from '@/types';
import { logger } from '@/utils/logger';
import RedisService from './redis.service';

export class LobbyService implements ILobbyService {
  private redisService: RedisService;
  private readonly LOBBY_PREFIX = 'lobby:';
  private readonly GUILD_LOBBIES_PREFIX = 'guild_lobbies:';

  constructor(redisService: RedisService) {
    this.redisService = redisService;
  }

  private getLobbyKey(id: string): string {
    return `${this.LOBBY_PREFIX}${id}`;
  }

  private getGuildLobbiesKey(guildId: string): string {
    return `${this.GUILD_LOBBIES_PREFIX}${guildId}`;
  }

  public async createLobby(data: CreateLobbyRequest): Promise<LobbyData> {
    const lobbyId = uuidv4();
    const now = new Date();
    
    const lobby: LobbyData = {
      id: lobbyId,
      guildId: data.guildId,
      channelId: data.channelId,
      messageId: '', // Will be set when Discord message is created
      creatorId: data.creatorId,
      title: data.title,
      scheduledStartTime: data.scheduledStartTime,
      status: LobbyStatus.PENDING,
      participants: [data.creatorId], // Creator is automatically a participant
      maxParticipants: data.maxParticipants,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      // Store the lobby
      await client.set(
        this.getLobbyKey(lobbyId),
        JSON.stringify(lobby),
        { EX: 60 * 60 * 24 * 7 } // 7 days expiration
      );

      // Add to guild lobbies set
      await client.sAdd(this.getGuildLobbiesKey(data.guildId), lobbyId);

      logger.info(`Created lobby ${lobbyId} in guild ${data.guildId}`);
      return lobby;
    } catch (error) {
      logger.error(`Failed to create lobby:`, error);
      throw new Error('Failed to create lobby');
    }
  }

  public async getLobby(id: string): Promise<LobbyData | null> {
    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      const lobbyData = await client.get(this.getLobbyKey(id));
      if (!lobbyData) {
        return null;
      }

      const lobby: LobbyData = JSON.parse(lobbyData);
      return lobby;
    } catch (error) {
      logger.error(`Failed to get lobby ${id}:`, error);
      return null;
    }
  }

  public async getGuildLobbies(guildId: string): Promise<LobbyData[]> {
    try {
      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      const lobbyIds = await client.sMembers(this.getGuildLobbiesKey(guildId));
      const lobbies: LobbyData[] = [];

      for (const lobbyId of lobbyIds) {
        const lobby = await this.getLobby(lobbyId);
        if (lobby) {
          lobbies.push(lobby);
        }
      }

      // Sort by creation date (newest first)
      return lobbies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error(`Failed to get guild lobbies for ${guildId}:`, error);
      return [];
    }
  }

  public async updateLobby(id: string, data: UpdateLobbyRequest): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(id);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      // Update fields
      if (data.status !== undefined) lobby.status = data.status;
      if (data.participants !== undefined) lobby.participants = data.participants;
      if (data.title !== undefined) lobby.title = data.title;
      if (data.scheduledStartTime !== undefined) lobby.scheduledStartTime = data.scheduledStartTime;
      if (data.maxParticipants !== undefined) lobby.maxParticipants = data.maxParticipants;
      
      lobby.updatedAt = new Date();

      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      // Update the lobby
      await client.set(
        this.getLobbyKey(id),
        JSON.stringify(lobby),
        { EX: 60 * 60 * 24 * 7 } // 7 days expiration
      );

      logger.info(`Updated lobby ${id}`);
      return lobby;
    } catch (error) {
      logger.error(`Failed to update lobby ${id}:`, error);
      throw new Error('Failed to update lobby');
    }
  }

  public async deleteLobby(id: string): Promise<boolean> {
    try {
      const lobby = await this.getLobby(id);
      if (!lobby) {
        return false;
      }

      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      // Remove from Redis
      await client.del(this.getLobbyKey(id));
      await client.sRem(this.getGuildLobbiesKey(lobby.guildId), id);

      logger.info(`Deleted lobby ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete lobby ${id}:`, error);
      return false;
    }
  }

  public async addParticipant(lobbyId: string, userId: string): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(lobbyId);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      if (lobby.status !== LobbyStatus.PENDING) {
        throw new Error('Cannot add participants to a lobby that is not pending');
      }

      if (lobby.maxParticipants && lobby.participants.length >= lobby.maxParticipants) {
        throw new Error('Lobby is full');
      }

      if (lobby.participants.includes(userId)) {
        throw new Error('User is already a participant');
      }

      lobby.participants.push(userId);
      lobby.updatedAt = new Date();

      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      await client.set(
        this.getLobbyKey(lobbyId),
        JSON.stringify(lobby),
        { EX: 60 * 60 * 24 * 7 }
      );

      logger.info(`Added participant ${userId} to lobby ${lobbyId}`);
      return lobby;
    } catch (error) {
      logger.error(`Failed to add participant ${userId} to lobby ${lobbyId}:`, error);
      throw error;
    }
  }

  public async removeParticipant(lobbyId: string, userId: string): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(lobbyId);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      if (lobby.status !== LobbyStatus.PENDING) {
        throw new Error('Cannot remove participants from a lobby that is not pending');
      }

      if (lobby.creatorId === userId) {
        throw new Error('Cannot remove the creator from the lobby');
      }

      const participantIndex = lobby.participants.indexOf(userId);
      if (participantIndex === -1) {
        throw new Error('User is not a participant');
      }

      lobby.participants.splice(participantIndex, 1);
      lobby.updatedAt = new Date();

      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      await client.set(
        this.getLobbyKey(lobbyId),
        JSON.stringify(lobby),
        { EX: 60 * 60 * 24 * 7 }
      );

      logger.info(`Removed participant ${userId} from lobby ${lobbyId}`);
      return lobby;
    } catch (error) {
      logger.error(`Failed to remove participant ${userId} from lobby ${lobbyId}:`, error);
      throw error;
    }
  }

  public async startLobby(id: string): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(id);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      if (lobby.status !== LobbyStatus.PENDING) {
        throw new Error('Lobby is not in pending status');
      }

      if (lobby.scheduledStartTime && new Date() < lobby.scheduledStartTime) {
        throw new Error('Cannot start lobby before scheduled time');
      }

      return await this.updateLobby(id, { status: LobbyStatus.ACTIVE });
    } catch (error) {
      logger.error(`Failed to start lobby ${id}:`, error);
      throw error;
    }
  }

  public async cancelLobby(id: string): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(id);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      if (lobby.status === LobbyStatus.CANCELLED) {
        throw new Error('Lobby is already cancelled');
      }

      return await this.updateLobby(id, { status: LobbyStatus.CANCELLED });
    } catch (error) {
      logger.error(`Failed to cancel lobby ${id}:`, error);
      throw error;
    }
  }

  public async setMessageId(lobbyId: string, messageId: string): Promise<LobbyData> {
    try {
      const lobby = await this.getLobby(lobbyId);
      if (!lobby) {
        throw new Error('Lobby not found');
      }

      lobby.messageId = messageId;
      lobby.updatedAt = new Date();

      const client = this.redisService.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      await client.set(
        this.getLobbyKey(lobbyId),
        JSON.stringify(lobby),
        { EX: 60 * 60 * 24 * 7 }
      );

      logger.info(`Set message ID ${messageId} for lobby ${lobbyId}`);
      return lobby;
    } catch (error) {
      logger.error(`Failed to set message ID for lobby ${lobbyId}:`, error);
      throw error;
    }
  }
}

export default LobbyService; 