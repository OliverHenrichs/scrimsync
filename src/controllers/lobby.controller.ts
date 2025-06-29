import { Request, Response } from 'express';
import { ILobbyService, CreateLobbyRequest, UpdateLobbyRequest, LobbyStatus } from '@/types';
import { logger } from '@/utils/logger';

export default class LobbyController {
  private lobbyService: ILobbyService;

  constructor(lobbyService: ILobbyService) {
    this.lobbyService = lobbyService;
  }

  public async createLobby(req: Request, res: Response): Promise<void> {
    try {
      const { guildId, channelId, title, scheduledStartTime, maxParticipants } = req.body;
      
      if (!req.user) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Type assertion for user object
      const user = req.user as { id: string; username: string; discriminator: string; avatar?: string };
      const creatorId = user.id;

      if (!guildId || !channelId || !title) {
        res.status(400).json({ error: 'Missing required fields: guildId, channelId, title' });
        return;
      }

      const createRequest: CreateLobbyRequest = {
        guildId,
        channelId,
        creatorId,
        title,
        scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : undefined,
        maxParticipants: maxParticipants || undefined,
      };

      const lobby = await this.lobbyService.createLobby(createRequest);
      res.status(201).json(lobby);
    } catch (error) {
      logger.error('Error creating lobby:', error);
      res.status(500).json({ error: 'Failed to create lobby' });
    }
  }

  public async getLobby(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      const lobby = await this.lobbyService.getLobby(id);

      if (!lobby) {
        res.status(404).json({ error: 'Lobby not found' });
        return;
      }

      res.json(lobby);
    } catch (error) {
      logger.error(`Error getting lobby ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get lobby' });
    }
  }

  public async getGuildLobbies(req: Request, res: Response): Promise<void> {
    try {
      const { guildId } = req.params;
      
      if (!guildId) {
        res.status(400).json({ error: 'Missing guild ID' });
        return;
      }

      const lobbies = await this.lobbyService.getGuildLobbies(guildId);
      res.json(lobbies);
    } catch (error) {
      logger.error(`Error getting guild lobbies for ${req.params.guildId}:`, error);
      res.status(500).json({ error: 'Failed to get guild lobbies' });
    }
  }

  public async updateLobby(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      const updateData: UpdateLobbyRequest = req.body;
      const lobby = await this.lobbyService.updateLobby(id, updateData);
      res.json(lobby);
    } catch (error) {
      logger.error(`Error updating lobby ${req.params.id}:`, error);
      if (error instanceof Error && error.message === 'Lobby not found') {
        res.status(404).json({ error: 'Lobby not found' });
      } else {
        res.status(500).json({ error: 'Failed to update lobby' });
      }
    }
  }

  public async deleteLobby(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      const deleted = await this.lobbyService.deleteLobby(id);

      if (!deleted) {
        res.status(404).json({ error: 'Lobby not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting lobby ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete lobby' });
    }
  }

  public async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: 'Missing userId' });
        return;
      }

      const lobby = await this.lobbyService.addParticipant(id, userId);
      res.json(lobby);
    } catch (error) {
      logger.error(`Error adding participant to lobby ${req.params.id}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Lobby not found') {
          res.status(404).json({ error: 'Lobby not found' });
        } else if (error.message.includes('Cannot add participants') || 
                   error.message.includes('Lobby is full') ||
                   error.message.includes('already a participant')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to add participant' });
        }
      } else {
        res.status(500).json({ error: 'Failed to add participant' });
      }
    }
  }

  public async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      if (!userId) {
        res.status(400).json({ error: 'Missing userId' });
        return;
      }

      const lobby = await this.lobbyService.removeParticipant(id, userId);
      res.json(lobby);
    } catch (error) {
      logger.error(`Error removing participant from lobby ${req.params.id}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Lobby not found') {
          res.status(404).json({ error: 'Lobby not found' });
        } else if (error.message.includes('Cannot remove participants') ||
                   error.message.includes('not a participant')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to remove participant' });
        }
      } else {
        res.status(500).json({ error: 'Failed to remove participant' });
      }
    }
  }

  public async startLobby(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      const lobby = await this.lobbyService.startLobby(id);
      res.json(lobby);
    } catch (error) {
      logger.error(`Error starting lobby ${req.params.id}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Lobby not found') {
          res.status(404).json({ error: 'Lobby not found' });
        } else if (error.message.includes('Cannot start lobby')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to start lobby' });
        }
      } else {
        res.status(500).json({ error: 'Failed to start lobby' });
      }
    }
  }

  public async cancelLobby(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({ error: 'Missing lobby ID' });
        return;
      }

      const lobby = await this.lobbyService.cancelLobby(id);
      res.json(lobby);
    } catch (error) {
      logger.error(`Error canceling lobby ${req.params.id}:`, error);
      if (error instanceof Error) {
        if (error.message === 'Lobby not found') {
          res.status(404).json({ error: 'Lobby not found' });
        } else if (error.message.includes('Cannot cancel lobby')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Failed to cancel lobby' });
        }
      } else {
        res.status(500).json({ error: 'Failed to cancel lobby' });
      }
    }
  }
} 