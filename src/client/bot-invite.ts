interface BotInviteResponse {
  success: boolean;
  data?: {
    inviteUrl: string;
  };
  message?: string;
}

class BotInvite {
  private inviteButton!: HTMLAnchorElement;
  private loadingElement!: HTMLElement;
  private errorElement!: HTMLElement;

  constructor() {
    this.initializeElements();
    this.setupEventListeners();
    this.checkAuth();
  }

  private initializeElements(): void {
    this.inviteButton = document.getElementById('inviteButton') as HTMLAnchorElement;
    this.loadingElement = document.getElementById('loading') as HTMLElement;
    this.errorElement = document.getElementById('error') as HTMLElement;
  }

  private setupEventListeners(): void {
    this.inviteButton.addEventListener('click', (e) => {
      e.preventDefault();
      this.generateInvite();
    });
  }

  private async checkAuth(): Promise<void> {
    try {
      const response = await fetch('/auth/user', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        window.location.href = '/auth/login';
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/auth/login';
    }
  }

  private async generateInvite(): Promise<void> {
    // Show loading state
    this.inviteButton.style.display = 'none';
    this.loadingElement.style.display = 'block';
    this.errorElement.style.display = 'none';

    try {
      const response = await fetch('/api/invites/bot/invite', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      const data: BotInviteResponse = await response.json();
      console.log('Response data:', data);

      if (data.success && data.data) {
        // Log the URL for debugging
        console.log('Generated invite URL:', data.data.inviteUrl);
        
        // Try to redirect
        try {
          window.location.href = data.data.inviteUrl;
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError);
          // Fallback: open in new tab
          window.open(data.data.inviteUrl, '_blank');
        }
      } else {
        throw new Error(data.message || 'Failed to generate invite');
      }
    } catch (err) {
      console.error('Error generating invite:', err);
      this.errorElement.textContent = err instanceof Error ? err.message : 'Failed to generate invite link. Please try again.';
      this.errorElement.style.display = 'block';
      this.inviteButton.style.display = 'inline-block';
    } finally {
      this.loadingElement.style.display = 'none';
    }
  }
}

// Initialize bot invite when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new BotInvite();
}); 