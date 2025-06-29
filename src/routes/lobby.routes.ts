import { Router } from 'express';
import { authenticateUser } from '@/middleware/auth.middleware';
import LobbyController from '@/controllers/lobby.controller';

export function createLobbyRoutes(lobbyController: LobbyController): Router {
  const router = Router();

  // Apply authentication middleware to all lobby routes
  router.use(authenticateUser);

  // Create a new lobby
  router.post('/', lobbyController.createLobby.bind(lobbyController));

  // Get a specific lobby
  router.get('/:id', lobbyController.getLobby.bind(lobbyController));

  // Get all lobbies for a guild
  router.get('/guild/:guildId', lobbyController.getGuildLobbies.bind(lobbyController));

  // Update a lobby
  router.put('/:id', lobbyController.updateLobby.bind(lobbyController));

  // Delete a lobby
  router.delete('/:id', lobbyController.deleteLobby.bind(lobbyController));

  // Add participant to lobby
  router.post('/:id/participants', lobbyController.addParticipant.bind(lobbyController));

  // Remove participant from lobby
  router.delete('/:id/participants', lobbyController.removeParticipant.bind(lobbyController));

  // Start a lobby
  router.post('/:id/start', lobbyController.startLobby.bind(lobbyController));

  // Cancel a lobby
  router.post('/:id/cancel', lobbyController.cancelLobby.bind(lobbyController));

  return router;
} 