# ScrimSync Discord Bot

A Discord bot with a web dashboard for managing invites and scrim lobbies, built with TypeScript, Express, and Discord.js.

## Features

- 🤖 Discord bot for invite management and scrim coordination
- 🎮 Slash commands for creating and managing scrim lobbies
- 🌐 Web dashboard with OAuth authentication
- 🔐 Secure session management with Redis
- 📊 Multi-server support
- 🧪 Comprehensive testing setup
- 🔒 Security best practices (CSP, rate limiting, etc.)
- ⏰ Scheduled scrim support with time-based restrictions
- 👥 Participant management with join/leave functionality

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token
- Redis (for persistent sessions and lobby data)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ScrimSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Redis**
   
   **Windows:**
   - Download Redis from [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
   - Or use WSL2 with Ubuntu and install Redis
   - Or use Docker: `docker run -d -p 6379:6379 redis:alpine`

   **macOS:**
   ```bash
   brew install redis
   brew services start redis
   ```

   **Linux (Ubuntu/Debian):**
   ```bash
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

4. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   DISCORD_GUILD_ID=your_discord_guild_id_here

   # Discord OAuth Configuration
   DISCORD_CLIENT_SECRET=your_discord_client_secret_here
   DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

   # Web Server Configuration
   PORT=3000
   NODE_ENV=development

   # Security
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here

   # Redis Configuration (for session storage and lobby data)
   REDIS_URL=redis://localhost:6379
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

## Discord Bot Setup

1. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the bot token

2. **Set up OAuth2**
   - Go to the "OAuth2" section
   - Add redirect URL: `http://localhost:3000/auth/discord/callback`
   - Copy the Client ID and Client Secret

3. **Invite the bot to your server**
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Manage Server`, `Create Invite`, `Send Messages`, `Add Reactions`, `Use Slash Commands`
   - Use the generated URL to invite the bot

## Usage

### Discord Slash Commands

The bot provides a `/scrim` slash command with the following options:

- **title** (required): The name of the scrim/lobby
- **time** (optional): When the scrim should start (format: YYYY-MM-DD HH:MM)
- **max_players** (optional): Maximum number of players (2-50)

Example:
```
/scrim title:"5v5 Ranked" time:2024-01-15 20:00 max_players:10
```

### Lobby Management

Once a lobby is created, users can:
- **Join/Leave**: Click the ✅/❌ buttons to join or leave the lobby
- **Start**: The creator can start the lobby using the ▶️ button (only available after scheduled time if set)
- **Cancel**: The creator can cancel the lobby using the ⏹️ button

### Web Dashboard

Access the web dashboard at `http://localhost:3000/dashboard` to:
- Create lobbies with a user-friendly interface
- View and manage existing lobbies
- Monitor participant counts and lobby status

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /api/health/health` - Health check
- `GET /auth/login` - Discord OAuth login
- `GET /auth/logout` - Logout
- `GET /auth/user` - Get current user
- `GET /dashboard` - Dashboard (requires authentication)
- `GET /dashboard/lobbies` - Lobby management dashboard (requires authentication)

### Invite Management
- `POST /api/invites` - Create invite (requires authentication)
- `GET /api/invites` - Get guild invites (requires authentication)
- `DELETE /api/invites/:code` - Delete invite (requires authentication)

### Lobby Management
- `POST /api/lobbies` - Create lobby (requires authentication)
- `GET /api/lobbies/:id` - Get specific lobby
- `GET /api/lobbies/guild/:guildId` - Get all lobbies for a guild
- `PUT /api/lobbies/:id` - Update lobby
- `DELETE /api/lobbies/:id` - Delete lobby
- `POST /api/lobbies/:id/participants` - Add participant to lobby
- `DELETE /api/lobbies/:id/participants` - Remove participant from lobby
- `POST /api/lobbies/:id/start` - Start lobby
- `POST /api/lobbies/:id/cancel` - Cancel lobby

## Data Persistence

The application uses Redis for:
- **Session Storage**: Persistent user sessions across server restarts
- **Lobby Data**: All lobby information is stored in Redis with 7-day expiration
- **Guild Mappings**: Efficient lookup of lobbies by guild ID

## Security Features

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **Rate Limiting** - Prevents abuse
- **Secure Cookies** - HttpOnly, Secure, SameSite
- **OAuth2 Authentication** - Secure Discord authentication
- **Session Management** - Redis-based persistent sessions
- **Input Validation** - Comprehensive validation for all inputs
- **Error Handling** - Comprehensive error handling and logging

## Architecture

```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic
│   ├── discord.service.ts    # Discord bot and slash commands
│   ├── lobby.service.ts      # Lobby management logic
│   ├── redis.service.ts      # Redis connection and operations
│   └── ...
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── app.ts          # Main application setup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 