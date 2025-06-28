# Redis Setup Guide for Windows

This guide will help you set up Redis for persistent session storage in ScrimSync.

## Option 1: Using WSL2 (Recommended)

If you have WSL2 installed, this is the easiest method:

1. **Open WSL2 Ubuntu terminal**
2. **Install Redis**:
   ```bash
   sudo apt update
   sudo apt install redis-server
   ```

3. **Start Redis service**:
   ```bash
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

4. **Test Redis**:
   ```bash
   redis-cli ping
   ```
   Should return `PONG`

5. **Configure your .env file**:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   ```

## Option 2: Using Docker Desktop

If you have Docker Desktop installed:

1. **Start Docker Desktop**
2. **Run Redis container**:
   ```bash
   docker run -d --name redis-scrimsync -p 6379:6379 redis:alpine
   ```

3. **Test Redis**:
   ```bash
   docker exec -it redis-scrimsync redis-cli ping
   ```

4. **Configure your .env file** (same as above)

## Option 3: Windows Native Redis

1. **Download Redis for Windows**:
   - Go to [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
   - Download the latest release (e.g., `Redis-x64-3.0.504.msi`)

2. **Install Redis**:
   - Run the installer
   - Follow the installation wizard
   - Make sure to check "Add Redis to PATH"

3. **Start Redis service**:
   ```cmd
   redis-server
   ```

4. **Test Redis** (in a new terminal):
   ```cmd
   redis-cli ping
   ```

## Option 4: Using Chocolatey

If you have Chocolatey installed:

```cmd
choco install redis-64
redis-server
```

## Verifying Redis Connection

Once Redis is running, restart your ScrimSync application:

```bash
npm run dev
```

You should see in the logs:
```
Redis connected successfully
Using Redis session store
Redis connected: true
```

## Benefits of Redis Sessions

With Redis enabled, your sessions will:
- ✅ Survive server restarts
- ✅ Work across multiple server instances
- ✅ Automatically expire after 24 hours
- ✅ Be more secure than file-based storage

## Troubleshooting

### Connection Refused
If you see `ECONNREFUSED` errors:
1. Make sure Redis is running
2. Check that port 6379 is not blocked
3. Verify your .env configuration

### Permission Denied (WSL2)
If you get permission errors in WSL2:
```bash
sudo chown -R redis:redis /var/lib/redis
sudo systemctl restart redis-server
```

### Docker Issues
If Docker Redis isn't working:
```bash
# Remove and recreate container
docker stop redis-scrimsync
docker rm redis-scrimsync
docker run -d --name redis-scrimsync -p 6379:6379 redis:alpine
```

## Fallback Behavior

If Redis is not available, ScrimSync will automatically fall back to memory-based sessions. This means:
- Sessions will work normally
- Sessions will be lost on server restart
- You'll see "Redis not available, using memory session store" in logs

This ensures your application always works, even without Redis. 