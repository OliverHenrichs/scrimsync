interface User {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
}

interface UserResponse {
  success: boolean;
  data: User;
  error?: string;
}

interface BotStatusResponse {
  success: boolean;
  data?: {
    botInGuild: boolean;
    guildName?: string;
    guildId: string;
    memberCount?: number;
    icon?: string;
    message?: string;
  };
  message?: string;
}

class Dashboard {
  private userInfoElement!: HTMLElement;
  private userAvatarElement!: HTMLImageElement;
  private guildIdInput!: HTMLInputElement;
  private checkBotStatusButton!: HTMLButtonElement;
  private botStatusElement!: HTMLElement;
  private resultElement!: HTMLElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.loadUserInfo();
  }

  private initializeElements(): void {
    this.userInfoElement = document.getElementById('userInfo') as HTMLElement;
    this.userAvatarElement = document.getElementById('userAvatar') as HTMLImageElement;
    this.guildIdInput = document.getElementById('guildId') as HTMLInputElement;
    this.checkBotStatusButton = document.getElementById('checkBotStatus') as HTMLButtonElement;
    this.botStatusElement = document.getElementById('botStatus') as HTMLElement;
    this.resultElement = document.getElementById('result') as HTMLElement;
  }

  private setupEventListeners(): void {
    this.checkBotStatusButton.addEventListener('click', () => this.checkBotStatus());
  }

  private async loadUserInfo(): Promise<void> {
    try {
      const response = await fetch('/auth/user', {
        credentials: 'include'
      });

      if (!response.ok) {
        window.location.href = '/auth/login';
        return;
      }

      const userResponse: UserResponse = await response.json();
      
      if (userResponse.success && userResponse.data) {
        this.displayUserInfo(userResponse.data);
      } else {
        throw new Error(userResponse.error || 'Failed to load user data');
      }
    } catch (error) {
      console.error('Error loading user info:', error);
      this.userInfoElement.textContent = 'Error loading user information';
    }
  }

  private displayUserInfo(user: User): void {
    this.userInfoElement.innerHTML = `
      <strong>User ID:</strong> ${user.id}<br>
      <strong>Username:</strong> ${user.username}#${user.discriminator}
    `;

    if (user.avatar) {
      const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
      this.userAvatarElement.src = avatarUrl;
      this.userAvatarElement.style.display = 'block';
    }
  }

  private async checkBotStatus(): Promise<void> {
    const guildId = this.guildIdInput.value.trim();
    
    if (!guildId) {
      this.showResult('Please enter a server ID', 'error');
      return;
    }

    this.checkBotStatusButton.disabled = true;
    this.botStatusElement.textContent = 'Checking...';
    this.botStatusElement.style.background = '#ffc107';
    this.botStatusElement.style.color = '#000';

    try {
      const response = await fetch(`/api/invites/${guildId}/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data: BotStatusResponse = await response.json();

      if (data.success && data.data) {
        if (data.data.botInGuild) {
          this.botStatusElement.textContent = '✅ Bot is in server';
          this.botStatusElement.style.background = '#28a745';
          this.botStatusElement.style.color = '#fff';
          
          this.showResult(`
            <h3>Bot Status: Active</h3>
            <p><strong>Server:</strong> ${data.data.guildName || 'Unknown'}</p>
            <p><strong>Members:</strong> ${data.data.memberCount || 'Unknown'}</p>
            <p>The bot is successfully connected to this server and ready to use!</p>
          `, 'success');
        } else {
          this.botStatusElement.textContent = '❌ Bot not in server';
          this.botStatusElement.style.background = '#dc3545';
          this.botStatusElement.style.color = '#fff';
          
          this.showResult(`
            <h3>Bot Status: Not Found</h3>
            <p>The bot is not currently in this server.</p>
            <p><a href="/api/invites/bot-invite">Click here to invite the bot</a></p>
          `, 'error');
        }
      } else {
        throw new Error(data.message || 'Failed to check bot status');
      }
    } catch (error) {
      console.error('Error checking bot status:', error);
      this.botStatusElement.textContent = '❌ Error';
      this.botStatusElement.style.background = '#dc3545';
      this.botStatusElement.style.color = '#fff';
      
      this.showResult(`
        <h3>Error</h3>
        <p>Failed to check bot status: ${error instanceof Error ? error.message : 'Unknown error'}</p>
      `, 'error');
    } finally {
      this.checkBotStatusButton.disabled = false;
    }
  }

  private showResult(content: string, type: 'success' | 'error'): void {
    this.resultElement.innerHTML = content;
    this.resultElement.className = `result ${type}`;
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
}); 