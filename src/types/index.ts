import { Request } from 'express';
import { GuildMember, Guild } from 'discord.js';

// User types
export interface User {
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

// Lobby/Scrim types
export interface LobbyData {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  creatorId: string;
  title: string;
  scheduledStartTime?: Date | undefined;
  status: LobbyStatus;
  participants: string[]; // Array of user IDs
  maxParticipants?: number | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export enum LobbyStatus {
  PENDING = 'pending',    // Created but not started
  ACTIVE = 'active',      // Started and running
  CANCELLED = 'cancelled', // Cancelled by creator
  COMPLETED = 'completed' // Finished naturally
}

export interface CreateLobbyRequest {
  guildId: string;
  channelId: string;
  creatorId: string;
  title: string;
  scheduledStartTime?: Date | undefined;
  maxParticipants?: number | undefined;
}

export interface UpdateLobbyRequest {
  status?: LobbyStatus;
  participants?: string[];
  title?: string;
  scheduledStartTime?: Date | undefined;
  maxParticipants?: number | undefined;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
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

export interface ILobbyService {
  createLobby(data: CreateLobbyRequest): Promise<LobbyData>;
  getLobby(id: string): Promise<LobbyData | null>;
  getGuildLobbies(guildId: string): Promise<LobbyData[]>;
  updateLobby(id: string, data: UpdateLobbyRequest): Promise<LobbyData>;
  deleteLobby(id: string): Promise<boolean>;
  addParticipant(lobbyId: string, userId: string): Promise<LobbyData>;
  removeParticipant(lobbyId: string, userId: string): Promise<LobbyData>;
  startLobby(id: string): Promise<LobbyData>;
  cancelLobby(id: string): Promise<LobbyData>;
}

export interface IDiscordService {
  getGuild(guildId: string): Promise<DiscordGuild | null>;
  getMember(guildId: string, userId: string): Promise<DiscordMember | null>;
  hasPermission(guildId: string, userId: string, permission: string): Promise<boolean>;
  createInvite(channelId: string, options?: any): Promise<any>;
  deleteInvite(code: string): Promise<boolean>;
  getGuildInvites(guildId: string): Promise<any[]>;
  getClient(): any;
  isClientReady(): boolean;
  shutdown(): Promise<void>;
  isBotInGuild(guildId: string): Promise<boolean>;
} 