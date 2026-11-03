import { Player } from '../types/football';

export const INITIAL_PLAYERS: Player[] = [
  // ==========================================
  // --- 18 JOGADORES FIXOS (3 TIMES DE 6) ---
  // ==========================================

  // 1- Naldo - mei
  {
    id: 'p-1',
    name: 'Naldo',
    nickname: 'Naldo',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r1', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-emerald-500 to-teal-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 2 - Danilo - gol
  {
    id: 'p-2',
    name: 'Danilo',
    nickname: 'Danilo',
    primaryPosition: 'GOL',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r2', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Canhoto',
    avatarColor: 'from-amber-500 to-orange-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 3 - Nicolas - mei
  {
    id: 'p-3',
    name: 'Nicolas',
    nickname: 'Nicolas',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r3', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-emerald-600 to-teal-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 4 - Pedro Bild - mei
  {
    id: 'p-4',
    name: 'Pedro Bild',
    nickname: 'Pedro Bild',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r4', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-teal-500 to-emerald-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 5 - Guilherme S - mei
  {
    id: 'p-5',
    name: 'Guilherme S.',
    nickname: 'Guilherme S',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r5', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-green-600 to-teal-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 6 - Kaique - mei
  {
    id: 'p-6',
    name: 'Kaique',
    nickname: 'Kaique',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r6', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-cyan-600 to-teal-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 7 - Carlos E. - ata
  {
    id: 'p-7',
    name: 'Carlos E.',
    nickname: 'Carlos E.',
    primaryPosition: 'ATA',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r7', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-rose-500 to-red-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 8 - Thiago XGG - zag
  {
    id: 'p-8',
    name: 'Thiago XGG',
    nickname: 'Thiago XGG',
    primaryPosition: 'ZAG',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r8', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-blue-600 to-cyan-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 9 - Zé Neto - mei
  {
    id: 'p-9',
    name: 'Zé Neto',
    nickname: 'Zé Neto',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r9', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-emerald-500 to-green-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 10 - Paulinho - mei
  {
    id: 'p-10',
    name: 'Paulinho',
    nickname: 'Paulinho',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r10', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Canhoto',
    avatarColor: 'from-teal-600 to-emerald-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 11 - Thiaguinho - mei
  {
    id: 'p-11',
    name: 'Thiaguinho',
    nickname: 'Thiaguinho',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r11', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-green-500 to-teal-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 12 - Vitor - mei
  {
    id: 'p-12',
    name: 'Vitor',
    nickname: 'Vitor',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r12', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-emerald-700 to-teal-900',
    goals: 0,
    matchesPlayed: 0,
  },

  // 13 - Pedro Pérez - mei
  {
    id: 'p-13',
    name: 'Pedro Pérez',
    nickname: 'Pedro Pérez',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r13', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-blue-500 to-indigo-700',
    goals: 0,
    matchesPlayed: 0,
  },

  // 14- Leandro - ? (definido com secundária GOL para garantir rotação ou versatilidade)
  {
    id: 'p-14',
    name: 'Leandro',
    nickname: 'Leandro',
    primaryPosition: 'MEI',
    secondaryPosition: 'GOL',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r14', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-purple-600 to-indigo-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 15- Diego - zag
  {
    id: 'p-15',
    name: 'Diego',
    nickname: 'Diego',
    primaryPosition: 'ZAG',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r15', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-blue-600 to-cyan-900',
    goals: 0,
    matchesPlayed: 0,
  },

  // 16- Felipe - zag
  {
    id: 'p-16',
    name: 'Felipe',
    nickname: 'Felipe',
    primaryPosition: 'ZAG',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r16', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-sky-600 to-blue-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 17- Itamar - zag
  {
    id: 'p-17',
    name: 'Itamar',
    nickname: 'Itamar',
    primaryPosition: 'ZAG',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r17', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-slate-600 to-zinc-800',
    goals: 0,
    matchesPlayed: 0,
  },

  // 18- Guilherme M. - mei
  {
    id: 'p-18',
    name: 'Guilherme M.',
    nickname: 'Guilherme M.',
    primaryPosition: 'MEI',
    currentRating: 7.0,
    quarterRating: 7.0,
    ratings: [
      { id: 'r18', date: '2026-10-27', score: 7.0, quarter: '2026-T4', note: 'Nota inicial padrão' },
    ],
    quarterlyHistory: [
      { quarter: '2026-T4', label: '4º Tri (Out-Dez) / 2026', avgScore: 7.0, count: 1 },
    ],
    status: 'fixed',
    confirmed: true,
    preferredFoot: 'Destro',
    avatarColor: 'from-teal-600 to-cyan-800',
    goals: 0,
    matchesPlayed: 0,
  },

];

export const TEAM_COLORS_PRESETS = [
  { name: 'Colete Amarelo', hex: '#eab308', badgeBg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', textColor: 'text-yellow-400' },
  { name: 'Colete Azul', hex: '#3b82f6', badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400', textColor: 'text-blue-400' },
  { name: 'Colete Vermelho', hex: '#ef4444', badgeBg: 'bg-red-500/15 border-red-500/30 text-red-400', textColor: 'text-red-400' },
  { name: 'Colete Preto', hex: '#334155', badgeBg: 'bg-slate-700/40 border-slate-600 text-slate-300', textColor: 'text-slate-300' },
  { name: 'Colete Verde', hex: '#10b981', badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', textColor: 'text-emerald-400' },
  { name: 'Colete Laranja', hex: '#f97316', badgeBg: 'bg-orange-500/15 border-orange-500/30 text-orange-400', textColor: 'text-orange-400' },
];
