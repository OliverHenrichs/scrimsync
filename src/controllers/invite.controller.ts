import { Request, Response } from 'express';
import { AuthenticatedRequest, ApiResponse, CreateInviteRequest } from '@/types';
import { AppError } from '@/types';
import InviteService from '@/services/invite.service';
import { config } from '@/config';

export class InviteController {
  private inviteService: InviteService;

  constructor(inviteService: InviteService) {
    this.inviteService = inviteService;
  }

  public createInvite = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { channelId, maxUses, maxAge, temporary, reason } = req.body as CreateInviteRequest;
    const { guildId } = req.params;

    if (!channelId) {
      throw new AppError('Channel ID is required', 400);
    }

    if (!guildId) {
      throw new AppError('Guild ID is required', 400);
    }

    // Validate permissions
    const hasPermission = await this.inviteService.validateInvitePermissions(
      guildId,
      req.user!.id,
      channelId
    );

    if (!hasPermission) {
      throw new AppError('Insufficient permissions to create invite', 403);
    }

    const inviteData = await this.inviteService.createInvite({
      channelId,
      maxUses,
      maxAge,
      temporary,
      reason,
    });

    res.status(201).json({
      success: true,
      data: inviteData,
      message: 'Invite created successfully',
    });
  };

  public getInvite = async (
    req: Request,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { code } = req.params;

    if (!code) {
      throw new AppError('Invite code is required', 400);
    }

    const inviteData = await this.inviteService.getInvite(code);

    if (!inviteData) {
      throw new AppError('Invite not found', 404);
    }

    res.json({
      success: true,
      data: inviteData,
    });
  };

  public getGuildInvites = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { guildId } = req.params;

    if (!guildId) {
      throw new AppError('Guild ID is required', 400);
    }

    const invites = await this.inviteService.getGuildInvites(guildId);

    res.json({
      success: true,
      data: invites,
    });
  };

  public deleteInvite = async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>
  ): Promise<void> => {
    const { code } = req.params;

    if (!code) {
      throw new AppError('Invite code is required', 400);
    }

    const success = await this.inviteService.deleteInvite(code);

    if (!success) {
      throw new AppError('Failed to delete invite', 500);
    }

    res.json({
      success: true,
      message: 'Invite deleted successfully',
    });
  };
}

export default InviteController; 