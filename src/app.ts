import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import DiscordService from '@/services/discord.service';
import InviteService from '@/services/invite.service';
import InviteController from '@/controllers/invite.controller';
import HealthController from '@/controllers/health.controller';
import { createInviteRoutes } from '@/routes/invite.routes';
import { createHealthRoutes } from '@/routes/health.routes';

export class App {
  private app: express.Application;
  private discordService: DiscordService;
  private inviteService: InviteService;

  constructor() {
    this.app = express();
    this.discordService = new DiscordService();
    this.inviteService = new InviteService(this.discordService);
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: config.server.nodeEnv === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.',
      },
    });
    this.app.use('/api/', limiter);

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health routes
    const healthController = new HealthController(this.discordService);
    this.app.use('/api/health', createHealthRoutes(healthController));

    // Invite routes
    const inviteController = new InviteController(this.inviteService);
    this.app.use('/api/invites', createInviteRoutes(inviteController));

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'ScrimSync Discord Bot API',
        version: '1.0.0',
        documentation: '/api/docs',
      });
    });
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Initialize Discord service
      await this.discordService.initialize();
      
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async shutdown(): Promise<void> {
    try {
      await this.discordService.shutdown();
      logger.info('Application shutdown successfully');
    } catch (error) {
      logger.error('Error during application shutdown:', error);
    }
  }
}

export default App; 