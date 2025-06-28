import { Request, Response } from 'express';
import { HealthController } from '../controllers/health.controller';
import { DiscordService } from '../services/discord.service';

// Mock DiscordService
jest.mock('../services/discord.service');

describe('HealthController', () => {
  let healthController: HealthController;
  let mockDiscordService: jest.Mocked<DiscordService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockDiscordService = {
      isClientReady: jest.fn(),
    } as any;

    healthController = new HealthController(mockDiscordService);

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('healthCheck', () => {
    it('should return healthy status when Discord is connected', async () => {
      mockDiscordService.isClientReady.mockReturnValue(true);

      await healthController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          status: 'ok',
          timestamp: expect.any(String),
          services: {
            discord: 'connected',
          },
        },
      });
    });

    it('should return unhealthy status when Discord is disconnected', async () => {
      mockDiscordService.isClientReady.mockReturnValue(false);

      await healthController.healthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        data: {
          status: 'ok',
          timestamp: expect.any(String),
          services: {
            discord: 'disconnected',
          },
        },
      });
    });
  });

  describe('readyCheck', () => {
    it('should return ready status when Discord is connected', async () => {
      mockDiscordService.isClientReady.mockReturnValue(true);

      await healthController.readyCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Service is ready',
      });
    });

    it('should return not ready status when Discord is disconnected', async () => {
      mockDiscordService.isClientReady.mockReturnValue(false);

      await healthController.readyCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Discord service not ready',
      });
    });
  });
}); 