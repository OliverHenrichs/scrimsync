# ScrimSync Discord Bot

A Discord bot with a web interface for managing invites, built with TypeScript, Express, and Discord.js.

## Features

- 🤖 Discord bot integration with invite management
- 🌐 RESTful API for invite operations
- 🔐 Authentication and authorization middleware
- 📊 Health monitoring endpoints
- 🧪 Comprehensive testing setup
- 📝 Structured logging with Winston
- 🔒 Security middleware (Helmet, CORS, Rate limiting)
- 🎯 TypeScript with strict configuration

## Project Structure

```
src/
├── config/          # Configuration management
├── controllers/     # HTTP request handlers
├── middleware/      # Express middleware
├── routes/          # API route definitions
├── services/        # Business logic layer
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── test/            # Test files
├── app.ts           # Express application setup
└── index.ts         # Application entry point
```

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Discord Bot Token
- Discord Application ID
- Discord Guild (Server) ID

## Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo>
   cd ScrimSync
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your Discord credentials:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   DISCORD_CLIENT_ID=your_discord_client_id_here
   DISCORD_GUILD_ID=your_discord_guild_id_here
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   LOG_LEVEL=info
   ```

3. **Create a Discord Bot:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Go to the "Bot" section and create a bot
   - Copy the bot token and client ID
   - Enable required intents (Guilds, Guild Members, Guild Invites, Guild Messages)

4. **Invite the bot to your server:**
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Create Instant Invite`, `Manage Guild`
   - Use the generated URL to invite the bot

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## API Endpoints

### Health Check
- `GET /api/health/health` - Application health status
- `GET /api/health/ready` - Service readiness check

### Invites
- `POST /api/invites` - Create a new invite
- `GET /api/invites/:code` - Get invite details
- `GET /api/invites` - List all guild invites
- `DELETE /api/invites/:code` - Delete an invite

### Authentication
Currently uses a simple header-based auth. Replace with Discord OAuth in production:
```
Authorization: Bearer your-secret-token
```

## Example Usage

### Create an Invite
```bash
curl -X POST http://localhost:3000/api/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{
    "channelId": "123456789012345678",
    "maxUses": 10,
    "maxAge": 3600,
    "temporary": false,
    "reason": "Scrim invite"
  }'
```

### Get Invite Details
```bash
curl http://localhost:3000/api/invites/abc123
```

## Testing

The project includes a comprehensive testing setup with Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Production Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Set production environment variables:**
   ```env
   NODE_ENV=production
   PORT=3000
   DISCORD_TOKEN=your_production_token
   # ... other production configs
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub. 