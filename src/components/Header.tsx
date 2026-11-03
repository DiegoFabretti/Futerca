import React from 'react';
import { UserPlus, Award, LogOut, CheckCircle2 } from 'lucide-react';
import { AppUser, WeeklyVotingSession } from '../types/football';
import { LoggedPlayerInfo } from '../services/votingService';

interface HeaderProps {
  activeTab: 'draw' | 'players' | 'matches' | 'stats' | 'voting';
  setActiveTab: (tab: 'draw' | 'players' | 'matches' | 'stats' | 'voting') => void;
  onOpenNewPlayerModal: () => void;
  fixedCount: number;
  benchCount: number;
  currentUser: AppUser | null;
  loggedPlayer?: LoggedPlayerInfo | null;
  onLogout: () => void;
  session: WeeklyVotingSession | null;
  onToggleVotingSession?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewPlayerModal,
  fixedCount,
  benchCount,
  currentUser,
  loggedPlayer,
  onLogout,
  session,
  onToggleVotingSession,
}) => {
  const hasVoted = Boolean(
    session && loggedPlayer && (session.votedPlayerIds?.includes(loggedPlayer.playerId) || false)
  );

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-lg">
            ⚽
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
                Futebol de Terça
              </h1>
              {session && (
                <button
                  type="button"
                  onClick={onToggleVotingSession}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors hidden sm:inline-flex items-center gap-1 ${
                    session.isOpen
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Clique para alternar entre Votação Aberta ou Fechada"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${session.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  <span>{session.isOpen ? 'Votação Aberta' : 'Votação Pausada'}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 whitespace-nowrap hidden sm:block">
              {fixedCount}/18 Fixos · {benchCount} Suplentes
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop/Tablet) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('draw')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'draw'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sorteio Inteligente
          </button>
          <button
            onClick={() => setActiveTab('voting')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'voting'
                ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Notas da Rodada</span>
            {session && (session.votedPlayerIds?.length || 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-emerald-400 text-[10px] font-mono font-bold">
                {session.votedPlayerIds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pelada ao Vivo
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'players'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Jogadores
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-slate-800 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tabela & Artilharia
          </button>
        </nav>

        {/* Zone 3: Logged Player Profile (if authenticated) */}
        <div className="flex items-center gap-2 shrink-0">
          {loggedPlayer && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('voting')}
                className="flex items-center gap-2 cursor-pointer text-left"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                  {loggedPlayer.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden lg:block leading-tight">
                  <span className="font-bold text-white block max-w-[100px] truncate">
                    {loggedPlayer.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 block font-medium">
                    {hasVoted ? '✓ Votou' : '⏳ Votar agora'}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors cursor-pointer ml-1"
                title="Sair do jogador"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
