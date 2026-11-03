export type Position = 'GOL' | 'ZAG' | 'MEI' | 'ATA';

export type PlayerStatus = 'fixed' | 'bench' | 'absent';

export interface SingleRating {
  id: string;
  date: string;
  score: number; // 0.0 - 10.0 (nota geral única)
  quarter: string; // Ex: '2026-T4'
  note?: string;
}

export interface QuarterSummary {
  quarter: string; // Ex: '2026-T4'
  label: string;   // Ex: '4º Tri / 2026'
  avgScore: number;
  count: number;
}

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  primaryPosition: Position;
  secondaryPosition?: Position;
  currentRating: number; // 0.0 to 10.0 (Nota ativa ponderada pelo ciclo trimestral)
  quarterRating: number; // Média do trimestre atual
  ratings: SingleRating[]; // Histórico de notas gerais únicas
  quarterlyHistory: QuarterSummary[]; // Histórico consolidado por trimestre
  status: PlayerStatus; // 'fixed' (um dos 18 titulares), 'bench' (suplente na espera), 'absent'
  benchOrder?: number; // Posição na lista de espera (1º da fila, 2º, etc.)
  confirmed: boolean;
  preferredFoot: 'Destro' | 'Canhoto' | 'Ambidestro';
  avatarColor: string;
  goals: number;
  matchesPlayed: number;
}

export interface TeamStats {
  avgOverall: number;
  playerCount: number;
  positionCounts: Record<Position, number>;
}

export interface Team {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  badgeBg: string;
  textColor: string;
  players: Player[];
  stats: TeamStats;
}

export interface MatchGoal {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  minute: number;
}

export interface Match {
  id: string;
  matchNumber: number;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  goals: MatchGoal[];
  completed: boolean;
  timestamp: string;
  durationMinutes: number;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  colorHex: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
}

export interface BalanceResult {
  teams: Team[];
  attemptNumber: number; // Número da tentativa (para re-sorteios livres)
  fairnessScore: number; // 0 - 100%
  maxDelta: number; // diferença máxima entre o melhor e o pior time
  variance: number;
  distributionSummary: {
    gksPerTeam: number;
    defPerTeam: number;
    midPerTeam: number;
    atkPerTeam: number;
  };
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  playerId?: string; // Jogador correspondente no elenco
  role: 'admin' | 'player';
  createdAt: string;
}

export interface WeeklyVotingSession {
  id: string;
  weekId: string; // Ex: "2026-W45" ou data "2026-11-03"
  date: string; // "2026-11-03"
  createdAt: string; // ISO string do início da rodada (inicia o prazo de 4 dias)
  title: string;
  isOpen: boolean; // Aberta ou Fechada
  votedPlayerIds: string[]; // Lista de IDs de jogadores que já votaram (impede voto duplo)
  votedUserEmails: string[]; // Compatibilidade
  anonymousRatings: Record<string, number[]>; // playerId -> notas recebidas anônimas [8.0, 8.5, ...]
  updatedAt: string;
}


