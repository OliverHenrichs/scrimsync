declare module 'passport-discord' {
  import { Strategy } from 'passport';
  
  export interface DiscordStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
  }
  
  export interface DiscordProfile {
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
  
  export class DiscordStrategy extends Strategy {
    constructor(
      options: DiscordStrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: DiscordProfile,
        done: (error: any, user?: any) => void
      ) => void
    );
  }
  
  export { DiscordStrategy as Strategy };
} 