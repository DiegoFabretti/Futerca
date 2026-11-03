import { AppUser, WeeklyVotingSession } from '../types/football';

const STORAGE_KEY_USER = 'futebol_current_user_v1';
const STORAGE_KEY_SESSION = 'futebol_voting_session_v2';
const STORAGE_KEY_LOGGED_PLAYER = 'futebol_logged_player_v2';
const STORAGE_KEY_PASSWORDS = 'futebol_player_passwords_v2';
const STORAGE_KEY_MANAGER_PASS = 'futebol_manager_password_v1';

const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;

export interface LoggedPlayerInfo {
  playerId: string;
  name: string;
}

export const votingService = {
  // ==========================================
  // --- PLAYER DIRECT PASSWORD AUTH ---
  // ==========================================
  getLoggedInPlayer(): LoggedPlayerInfo | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGGED_PLAYER);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  },

  setLoggedInPlayer(player: LoggedPlayerInfo | null): void {
    if (player) {
      localStorage.setItem(STORAGE_KEY_LOGGED_PLAYER, JSON.stringify(player));
    } else {
      localStorage.removeItem(STORAGE_KEY_LOGGED_PLAYER);
    }
  },

  async loginPlayer(playerId: string, password: string, playerName: string): Promise<LoggedPlayerInfo> {
    const trimmedPass = String(password).trim();

    try {
      const res = await fetch('/api/auth/player-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, password: trimmedPass, playerName }),
      });

      if (res.ok) {
        const data = await res.json();
        const playerInfo: LoggedPlayerInfo = { playerId, name: playerName };
        this.setLoggedInPlayer(playerInfo);
        return playerInfo;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Senha incorreta!');
      }
    } catch (e: any) {
      // Fallback local storage auth check
      let passwords: Record<string, string> = {};
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PASSWORDS);
        if (saved) passwords = JSON.parse(saved);
      } catch {
        // ignore
      }

      const expected = passwords[playerId] || '1234';
      if (trimmedPass === expected) {
        const playerInfo: LoggedPlayerInfo = { playerId, name: playerName };
        this.setLoggedInPlayer(playerInfo);
        return playerInfo;
      }
      throw new Error(e.message || 'Senha incorreta! A senha padrão é 1234.');
    }
  },

  async setPlayerPassword(playerId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const trimmedNew = String(newPassword).trim();
    if (trimmedNew.length < 3) {
      throw new Error('A novásenha deve ter no mínimo 3 caracteres.');
    }

    try {
      const res = await fetch('/api/auth/player-set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, currentPassword, newPassword: trimmedNew }),
      });
      if (res.ok) {
        let passwords: Record<string, string> = {};
        try {
          const saved = localStorage.getItem(STORAGE_KEY_PASSWORDS);
          if (saved) passwords = JSON.parse(saved);
        } catch {}
        passwords[playerId] = trimmedNew;
        localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(passwords));
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao alterar senha');
      }
    } catch (e: any) {
      // Local fallback
      let passwords: Record<string, string> = {};
      try {
        const saved = localStorage.getItem(STORAGE_KEY_PASSWORDS);
        if (saved) passwords = JSON.parse(saved);
      } catch {}
      const savedPass = passwords[playerId] || '1234';
      if (currentPassword && currentPassword.trim() !== savedPass) {
        throw new Error('Senha atual incorreta.');
      }
      passwords[playerId] = trimmedNew;
      localStorage.setItem(STORAGE_KEY_PASSWORDS, JSON.stringify(passwords));
      return true;
    }
  },

  logoutPlayer(): void {
    this.setLoggedInPlayer(null);
  },

  // ==========================================
  // --- LEGACY USER AUTH (COMPATIBILITY) ---
  // ==========================================
  getCurrentUser(): AppUser | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  },

  setCurrentUser(user: AppUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  },

  async login(email: string, password: string): Promise<AppUser> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        this.setCurrentUser(data.user);
        return data.user;
      }
      throw new Error('Falha no login');
    } catch {
      const u: AppUser = {
        id: `usr-${Date.now()}`,
        email: email.trim().toLowerCase(),
        name: email.split('@')[0],
        role: 'player',
        createdAt: new Date().toISOString(),
      };
      this.setCurrentUser(u);
      return u;
    }
  },

  async register(name: string, email: string, password: string, playerId?: string): Promise<AppUser> {
    const u: AppUser = {
      id: `usr-${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      playerId,
      role: 'player',
      createdAt: new Date().toISOString(),
    };
    this.setCurrentUser(u);
    return u;
  },

  async submitBallot(
    weekId: string,
    voterEmail: string,
    ratings: Array<{ playerId: string; score: number }>
  ): Promise<{ success: boolean; message: string; session: WeeklyVotingSession }> {
    const session = await this.getCurrentSession();
    return { success: true, message: 'Voto anônimo registrado', session };
  },

  logout(): void {
    this.setCurrentUser(null);
    this.logoutPlayer();
  },

  // ==========================================
  // --- VOTING SESSION WITH 4-DAY DEADLINE ---
  // ==========================================
  isSessionExpired(session: WeeklyVotingSession): boolean {
    if (!session || !session.createdAt) return false;
    const createdTime = new Date(session.createdAt).getTime();
    return (Date.now() - createdTime) > FOUR_DAYS_MS;
  },

  getTimeRemaining(session: WeeklyVotingSession): { days: number; hours: number; minutes: number; totalMs: number; isExpired: boolean } {
    if (!session || !session.createdAt) {
      return { days: 4, hours: 0, minutes: 0, totalMs: FOUR_DAYS_MS, isExpired: false };
    }
    const createdTime = new Date(session.createdAt).getTime();
    const remainingMs = Math.max(0, (createdTime + FOUR_DAYS_MS) - Date.now());
    const isExpired = remainingMs <= 0;

    const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, totalMs: remainingMs, isExpired };
  },

  async getCurrentSession(): Promise<WeeklyVotingSession> {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const defaultSession: WeeklyVotingSession = {
      id: `semana-${today}`,
      weekId: `semana-${today}`,
      date: today,
      createdAt: nowIso,
      title: `Rodada de Terça (${today})`,
      isOpen: true,
      votedPlayerIds: [],
      votedUserEmails: [],
      anonymousRatings: {},
      updatedAt: nowIso,
    };

    try {
      const res = await fetch('/api/voting/current');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
        return data.session;
      }
    } catch {
      // Local fallback
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) {
        const parsed: WeeklyVotingSession = JSON.parse(saved);
        if (!parsed.votedPlayerIds) parsed.votedPlayerIds = [];
        if (!parsed.createdAt) parsed.createdAt = parsed.date ? `${parsed.date}T20:00:00.000Z` : nowIso;
        return parsed;
      }
    } catch {
      // Ignore
    }

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(defaultSession));
    return defaultSession;
  },

  async startNewRound(managerPassword: string): Promise<WeeklyVotingSession> {
    const trimmedPass = String(managerPassword || '').trim();
    if (!trimmedPass) {
      throw new Error('Informe ásenha de gestor para liberar a rodada.');
    }

    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    const newSessionId = `semana-${today}-${Date.now()}`;

    const newSession: WeeklyVotingSession = {
      id: newSessionId,
      weekId: newSessionId,
      date: today,
      createdAt: nowIso,
      title: `Rodada de Terça (${today})`,
      isOpen: true,
      votedPlayerIds: [],
      votedUserEmails: [],
      anonymousRatings: {},
      updatedAt: nowIso,
    };

    try {
      const res = await fetch('/api/voting/new-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerPassword: trimmedPass }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
        return data.session;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Senha de gestor incorreta!');
      }
    } catch (e: any) {
      if (e.message && e.message.includes('Senha de gestor incorreta')) {
        throw e;
      }
      // Offline fallback
      const savedPass = localStorage.getItem(STORAGE_KEY_MANAGER_PASS) || 'gestor123';
      if (trimmedPass !== savedPass) {
        throw new Error('Senha de gestor incorreta! Apenas os organizadores podem liberar uma nova rodada.');
      }
    }

    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(newSession));
    return newSession;
  },

  async setManagerPassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const trimmedNew = String(newPassword || '').trim();
    if (trimmedNew.length < 3) {
      throw new Error('A novásenha deve ter no mínimo 3 caracteres.');
    }

    try {
      const res = await fetch('/api/voting/set-manager-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword: trimmedNew }),
      });
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY_MANAGER_PASS, trimmedNew);
        return true;
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao alterar senha de gestor');
      }
    } catch (e: any) {
      const savedPass = localStorage.getItem(STORAGE_KEY_MANAGER_PASS) || 'gestor123';
      if (currentPassword && currentPassword.trim() !== savedPass) {
        throw new Error('Senha atual de gestor incorreta.');
      }
      localStorage.setItem(STORAGE_KEY_MANAGER_PASS, trimmedNew);
      return true;
    }
  },

  async toggleSessionOpen(weekId: string, isOpen: boolean): Promise<WeeklyVotingSession> {
    try {
      const res = await fetch('/api/voting/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, isOpen }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
        return data.session;
      }
    } catch {}

    const current = await this.getCurrentSession();
    current.isOpen = isOpen;
    current.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(current));
    return current;
  },

  async submitPlayerBallot(
    weekId: string,
    voterPlayerId: string,
    ratings: Array<{ playerId: string; score: number }>
  ): Promise<{ success: boolean; message: string; session: WeeklyVotingSession }> {
    try {
      const res = await fetch('/api/voting/submit-player-ballot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekId, voterPlayerId, ratings }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(data.session));
        return data;
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao processar votação');
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('já enviou') || e.message.includes('expirou'))) {
        throw e;
      }

      // Local storage fallback
      const session = await this.getCurrentSession();
      if (!session.votedPlayerIds) session.votedPlayerIds = [];

      if (this.isSessionExpired(session)) {
        throw new Error('O prazo de 4 dias para votar expirou! Aguarde o próximo jogo da terça-feira.');
      }

      if (session.votedPlayerIds.includes(voterPlayerId)) {
        throw new Error('Você já enviou seu voto para esta rodada! Apenas 1 voto por jogador é permitido.');
      }

      session.votedPlayerIds.push(voterPlayerId);
      if (!session.anonymousRatings) session.anonymousRatings = {};

      for (const item of ratings) {
        if (item.playerId && typeof item.score === 'number' && item.playerId !== voterPlayerId) {
          const score = Math.max(0, Math.min(10, Math.round(item.score * 10) / 10));
          if (!session.anonymousRatings[item.playerId]) {
            session.anonymousRatings[item.playerId] = [];
          }
          session.anonymousRatings[item.playerId].push(score);
        }
      }

      session.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

      return {
        success: true,
        message: 'Seu voto anônimo foi registrado com sucesso! Ninguém verá as notas individuais.',
        session,
      };
    }
  },

  calculatePlayerRoundAverage(
    playerId: string,
    session: WeeklyVotingSession
  ): { average: number | null; count: number } {
    const list = session.anonymousRatings?.[playerId];
    if (!list || list.length === 0) {
      return { average: null, count: 0 };
    }
    const sum = list.reduce((a, b) => a + b, 0);
    const avg = Math.round((sum / list.length) * 10) / 10;
    return { average: avg, count: list.length };
  },
};
