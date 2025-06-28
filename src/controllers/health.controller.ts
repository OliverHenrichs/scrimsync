import { Request, Response } from 'express';
import { ApiResponse } from '@/types';
import DiscordService from '@/services/discord.service';

export class HealthController {
  private discordService: DiscordService;

  constructor(discordService: DiscordService) {
    this.discordService = discordService;
  }

  public healthCheck = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const discordStatus = this.discordService.isClientReady();

    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        discord: discordStatus ? 'connected' : 'disconnected',
      },
    };

    const statusCode = discordStatus ? 200 : 503;

    res.status(statusCode).json({
      success: discordStatus,
      data: healthData,
    });
  };

  public readyCheck = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const discordStatus = this.discordService.isClientReady();

    if (!discordStatus) {
      res.status(503).json({
        success: false,
        error: 'Discord service not ready',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Service is ready',
    });
  };
}

export default HealthController; 