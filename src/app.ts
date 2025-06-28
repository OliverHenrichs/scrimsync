import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from 'passport';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import DiscordService from '@/services/discord.service';
import InviteService from '@/services/invite.service';
import AuthService from '@/services/auth.service';
import RedisService from '@/services/redis.service';
import { RedisSessionStore } from '@/services/redis-session.store';
import InviteController from '@/controllers/invite.controller';
import HealthController from '@/controllers/health.controller';
import { createInviteRoutes } from '@/routes/invite.routes';
import { createHealthRoutes } from '@/routes/health.routes';
import { createAuthRoutes } from '@/routes/auth.routes';
import { createDashboardRoutes } from '@/routes/dashboard.routes';

export class App {
  private app: express.Application;
  private discordService: DiscordService;
  private inviteService: InviteService;
  private authService: AuthService;
  private redisService: RedisService;
  private initialized = false;

  constructor() {
    this.app = express();
    this.discordService = new DiscordService();
    this.inviteService = new InviteService(this.discordService);
    this.authService = new AuthService();
    this.redisService = new RedisService();
  }

  private async setupMiddleware(): Promise<void> {
    // Connect to Redis
    try {
      await this.redisService.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Redis, falling back to memory sessions:', error);
    }

    // Security middleware with strict CSP configuration
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
    }));
    
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

    // Session management with Redis store
    let sessionStore: session.Store | undefined;
    
    if (this.redisService.isClientConnected()) {
      try {
        sessionStore = new RedisSessionStore(this.redisService);
        logger.info('Using Redis session store');
      } catch (error) {
        logger.error('Failed to create Redis session store, falling back to memory:', error);
      }
    } else {
      logger.info('Redis not available, using memory session store');
    }

    const sessionConfig: session.SessionOptions = {
      store: sessionStore,
      secret: config.security.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: config.server.nodeEnv === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' as const,
      },
      name: 'scrimsync.sid',
    };

    this.app.use(session(sessionConfig));

    // Passport middleware
    this.app.use(passport.initialize());
    this.app.use(passport.session());

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

    // Auth routes
    this.app.use('/auth', createAuthRoutes());

    // Invite routes
    const inviteController = new InviteController(this.inviteService);
    this.app.use('/api/invites', createInviteRoutes(inviteController));

    // Dashboard routes
    this.app.use('/dashboard', createDashboardRoutes());

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'ScrimSync Discord Bot API',
        version: '1.0.0',
        documentation: '/api/docs',
        auth: {
          login: '/auth/login',
          logout: '/auth/logout',
          user: '/auth/user',
        },
        dashboard: '/dashboard',
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
    if (this.initialized) {
      return;
    }

    try {
      // Setup middleware (including Redis connection)
      await this.setupMiddleware();
      
      // Setup routes and error handling
      this.setupRoutes();
      this.setupErrorHandling();
      
      // Initialize Discord service
      await this.discordService.initialize();
      
      this.initialized = true;
      logger.info('Application initialized successfully');
      logger.info(`Redis connected: ${this.redisService.isClientConnected()}`);
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
      await this.redisService.disconnect();
      logger.info('Application shutdown successfully');
    } catch (error) {
      logger.error('Error during application shutdown:', error);
    }
  }
}

export default App; 