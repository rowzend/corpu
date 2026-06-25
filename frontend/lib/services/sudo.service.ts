const SUDO_KEY = 'sudo_session';
const SUDO_TTL = 2 * 60 * 60 * 1000;

export interface SudoSession {
  activated_at: number;
  expires_at: number;
  username: string;
}

export const sudoService = {
  activate(username: string) {
    const now = Date.now();
    const session: SudoSession = {
      activated_at: now,
      expires_at: now + SUDO_TTL,
      username,
    };
    localStorage.setItem(SUDO_KEY, JSON.stringify(session));
    document.cookie = `sudo_session=${btoa(JSON.stringify(session))}; path=/; max-age=${SUDO_TTL / 1000}`;
  },

  deactivate() {
    localStorage.removeItem(SUDO_KEY);
    document.cookie = 'sudo_session=; path=/; max-age=0';
  },

  getSession(): SudoSession | null {
    try {
      const raw = localStorage.getItem(SUDO_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as SudoSession;
      if (Date.now() >= session.expires_at) {
        this.deactivate();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  isActive(): boolean {
    return this.getSession() !== null;
  },

  getRemainingMinutes(): number {
    const session = this.getSession();
    if (!session) return 0;
    return Math.round((session.expires_at - Date.now()) / 60000);
  },
};
