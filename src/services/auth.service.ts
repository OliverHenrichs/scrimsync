import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  guilds?: Array<{
    id: string;
    name: string;
    icon?: string;
    owner: boolean;
    permissions: string;
  }>;
}

export class AuthService {
  constructor() {
    this.setupPassport();
  }

  private setupPassport(): void {
    // Check if required Discord OAuth config is available
    if (!config.discord.clientSecret || !config.discord.callbackUrl) {
      logger.warn('Discord OAuth not configured - clientSecret and callbackUrl are required');
      return;
    }

    // Discord OAuth Strategy
    passport.use(
      new DiscordStrategy(
        {
          clientID: config.discord.clientId,
          clientSecret: config.discord.clientSecret,
          callbackURL: config.discord.callbackUrl,
          scope: ['identify', 'guilds'],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            const user: DiscordUser = {
              id: profile.id,
              username: profile.username,
              discriminator: profile.discriminator,
              avatar: profile.avatar,
              guilds: profile.guilds,
            };

            logger.info(`User authenticated: ${user.username}#${user.discriminator} (${user.id})`);
            return done(null, user);
          } catch (error) {
            logger.error('Error in Discord OAuth callback:', error);
            return done(error, null);
          }
        }
      )
    );

    // Serialize user for session
    passport.serializeUser((user: any, done: any) => {
      done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done: any) => {
      try {
        // In a real app, you might fetch user from database here
        // For now, we'll return the user from session
        done(null, { id } as DiscordUser);
      } catch (error) {
        logger.error('Error deserializing user:', error);
        done(error, null);
      }
    });
  }

  public getPassport(): typeof passport {
    return passport;
  }

  public async getUserGuilds(userId: string): Promise<Array<{ id: string; name: string; icon?: string; owner: boolean; permissions: string }>> {
    // This would typically fetch from Discord API or cache
    // For now, return empty array - implement based on your needs
    return [];
  }

  public async hasGuildPermission(userId: string, guildId: string, permission: string): Promise<boolean> {
    try {
      // This would check if user has permission in the specific guild
      // For now, return true for development
      if (config.server.nodeEnv === 'development') {
        return true;
      }

      // In production, implement proper permission checking
      // You'd need to fetch user's guilds and check permissions
      return false;
    } catch (error) {
      logger.error(`Error checking guild permission for user ${userId}:`, error);
      return false;
    }
  }
}

export default AuthService; 