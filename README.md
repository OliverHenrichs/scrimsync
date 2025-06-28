# ScrimSync Discord Bot

A Discord bot with a web dashboard for managing invites, built with TypeScript, Express, and Discord.js.

## Features

- 🤖 Discord bot for invite management
- 🌐 Web dashboard with OAuth authentication
- 🔐 Secure session management with Redis
- 📊 Multi-server support
- 🧪 Comprehensive testing setup
- 🔒 Security best practices (CSP, rate limiting, etc.)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token
- Redis (for persistent sessions)

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

   # Redis Configuration (for session storage)
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
   - Select permissions: `Manage Server`, `Create Invite`
   - Use the generated URL to invite the bot

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

- `GET /` - API information
- `GET /api/health/health` - Health check
- `GET /auth/login` - Discord OAuth login
- `GET /auth/logout` - Logout
- `GET /auth/user` - Get current user
- `GET /dashboard` - Dashboard (requires authentication)
- `POST /api/invites` - Create invite (requires authentication)

## Session Management

The application uses Redis for persistent session storage, which means:
- Sessions survive server restarts
- Multiple server instances can share sessions
- Sessions are automatically cleaned up after 24 hours
- If Redis is unavailable, the app falls back to memory sessions

## Security Features

- **Content Security Policy (CSP)** - Prevents XSS attacks
- **Rate Limiting** - Prevents abuse
- **Secure Cookies** - HttpOnly, Secure, SameSite
- **OAuth2 Authentication** - Secure Discord authentication
- **Session Management** - Redis-based persistent sessions
- **Input Validation** - Joi/Zod schema validation
- **Error Handling** - Comprehensive error handling and logging

## Architecture

```
src/
├── config/          # Configuration management
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── routes/          # Route definitions
├── services/        # Business logic
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