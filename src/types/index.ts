import { Request } from 'express';
import { GuildMember, Guild } from 'discord.js';

// Discord types
export interface DiscordGuild extends Guild {
  // Extended guild properties if needed
}

export interface DiscordMember extends GuildMember {
  // Extended member properties if needed
}

// Invite types
export interface InviteData {
  id: string;
  code: string;
  guildId: string;
  channelId: string;
  creatorId: string;
  createdAt: Date;
  expiresAt?: Date | undefined;
  maxUses?: number | undefined;
  uses: number;
  temporary: boolean;
}

export interface CreateInviteRequest {
  channelId: string;
  maxUses?: number | undefined;
  maxAge?: number | undefined; // in seconds
  temporary?: boolean | undefined;
  reason?: string | undefined;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request types with passport session support
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  logout?: (callback: (err: any) => void) => void;
  isAuthenticated?: () => boolean;
}

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Service interfaces
export interface IInviteService {
  createInvite(data: CreateInviteRequest): Promise<InviteData>;
  getInvite(code: string): Promise<InviteData | null>;
  getGuildInvites(guildId: string): Promise<InviteData[]>;
  deleteInvite(code: string): Promise<boolean>;
}

export interface IDiscordService {
  getGuild(guildId: string): Promise<DiscordGuild | null>;
  getMember(guildId: string, userId: string): Promise<DiscordMember | null>;
  hasPermission(guildId: string, userId: string, permission: string): Promise<boolean>;
} 