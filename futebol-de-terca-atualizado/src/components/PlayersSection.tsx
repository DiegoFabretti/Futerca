import React, { useState } from 'react';
import { Search, Plus, Star, Award, SlidersHorizontal, Calendar, Trash2 } from 'lucide-react';
import { Player, Position, PlayerStatus, WeeklyVotingSession } from '../types/football';
import { getPositionBadge } from '../utils/balancer';
import { getCurrentQuarter, getQuarterLabel } from '../utils/quarterCycle';
import { soundEffects } from '../utils/audio';
import { votingService } from '../services/votingService';

interface PlayersSectionProps {
  players: Player[];
  onOpenEditPlayer: (player: Player) => void;
  onOpenNewPlayerModal: () => void;
  onTogglePlayerStatus: (playerId: string, newStatus: PlayerStatus) => void;
  onNavigateToVoting: () => void;
  onDeletePlayer: (playerId: string) => void;
  session?: WeeklyVotingSession | null;
}

export const PlayersSection: React.FC<PlayersSectionProps> = ({
  players,
  onOpenEditPlayer,
  onOpenNewPlayerModal,
  onTogglePlayerStatus,
  onNavigateToVoting,
  onDeletePlayer,
  session,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | Position>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PlayerStatus>('ALL');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'goals' | 'matches'>('rating');
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);

  const currentQ = getCurrentQuarter();

  // Filter logic
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nickname && p.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPosition = positionFilter === 'ALL' || p.primaryPosition === positionFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Sort logic
  filteredPlayers.sort((a, b) => {
    if (sortBy === 'rating') return b.currentRating - a.currentRating;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'goals') return b.goals - a.goals;
    if (sortBy === 'matches') return b.matchesPlayed - a.matchesPlayed;
    return 0;
  });

  const fixedCount = players.filter((p) => p.status === 'fixed').length;
  const benchCount = players.filter((p) => p.status === 'bench').length;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Banner do Ciclo Trimestral & Ações */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Elenco & Avaliações · {getQuarterLabel(currentQ)}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <strong>Ciclo Trimestral Ativo:</strong> 70% peso do trimestre atual + 30% do anterior. As notas são atribuídas exclusivamente na aba oficial de Votação com senha individual!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={onOpenNewPlayerModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-400/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cadastrar Novo Atleta</span>
            </button>

            <button
              onClick={onNavigateToVoting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700 cursor-pointer"
            >
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Notas da Rodada</span>
              {session && (session.votedPlayerIds?.length || 0) > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 font-mono text-[10px] font-bold">
                  {session.votedPlayerIds.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-slate-800">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome ou apelido..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Position Tabs */}
          <div className="sm:col-span-3 flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            {(['ALL', 'GOL', 'ZAG', 'MEI', 'ATA'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => {
                  setPositionFilter(pos);
                  soundEffects.playTap();
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  positionFilter === pos
                    ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {pos === 'ALL' ? 'Todos' : pos}
              </button>
            ))}
          </div>

          {/* Status Tabs */}
          <div className="sm:col-span-3 flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Geral ({players.length})
            </button>
            <button
              onClick={() => setStatusFilter('fixed')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'fixed' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              18 Fixos ({fixedCount})
            </button>
            <button
              onClick={() => setStatusFilter('bench')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === 'bench' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Suplentes ({benchCount})
            </button>
          </div>

          {/* Sorter */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'goals' | 'matches')}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="rating">Nota Geral</option>
              <option value="goals">Mais Gols</option>
              <option value="matches">Mais Jogos</option>
              <option value="name">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Cards Grid (Clean Mobile-First with Single Overall Score) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlayers.map((player) => {
          const posBadge = getPositionBadge(player.primaryPosition);

          return (
            <div
              key={player.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header card: avatar, name, status, rating */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${player.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}
                    >
                      {player.nickname ? player.nickname.slice(0, 2).toUpperCase() : player.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-sm text-white truncate">
                          {player.nickname || player.name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {player.name} · {player.preferredFoot}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-mono font-bold text-xs">
                      <Star className="w-3 h-3 fill-emerald-400" />
                      <span>{player.currentRating.toFixed(1)}</span>
                    </div>
                    <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${posBadge.badgeClass}`}>
                      {posBadge.label}
                      {player.secondaryPosition ? ` / ${player.secondaryPosition}` : ''}
                    </span>
                  </div>
                </div>

                {/* Status chip & Trimestral breakdown */}
                <div className="mt-3 flex items-center justify-between text-[11px]">
                  <span
                    className={`px-2 py-0.5 rounded-full font-semibold ${
                      player.status === 'fixed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : player.status === 'bench'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    }`}
                  >
                    {player.status === 'fixed'
                      ? '⭐ Titular Fixo'
                      : player.status === 'bench'
                      ? `⏳ Suplente #${player.benchOrder || '—'}`
                      : '❌ Ausente'}
                  </span>

                  <span className="text-slate-400 font-mono text-[11px]">
                    Tri Atual: ★{player.quarterRating.toFixed(1)}
                  </span>
                </div>

                {/* Round Anonymous Average Badge */}
                {session && (
                  <div className="mt-2.5 p-2 bg-slate-950/80 border border-emerald-500/20 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-emerald-300 font-medium">Média da Rodada:</span>
                    {(() => {
                      const stats = votingService.calculatePlayerRoundAverage(player.id, session);
                      return stats.average !== null ? (
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          ★ {stats.average.toFixed(1)} ({stats.count} {stats.count === 1 ? 'voto' : 'votos'})
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">Aguardando notas</span>
                      );
                    })()}
                  </div>
                )}

                {/* Quarterly history tags */}
                <div className="my-3 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Evolução Trimestral:</span>
                    <span className="font-mono text-emerald-400">{player.ratings?.length || 0} avaliações</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {player.quarterlyHistory && player.quarterlyHistory.length > 0 ? (
                      player.quarterlyHistory.slice(0, 3).map((q) => (
                        <span
                          key={q.quarter}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          {q.quarter}: ★{q.avgScore.toFixed(1)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Novo cadastro</span>
                    )}
                  </div>
                </div>

                {/* Goals & matches */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>⚽ {player.goals} gols</span>
                  <span>🏟️ {player.matchesPlayed} partidas</span>
                </div>
              </div>

              {/* Action Buttons: Status switcher & Edit modal */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <select
                  value={player.status}
                  onChange={(e) => {
                    onTogglePlayerStatus(player.id, e.target.value as PlayerStatus);
                    soundEffects.playTap();
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                >
                  <option value="fixed">Fixo (18)</option>
                  <option value="bench">Suplente (Espera)</option>
                  <option value="absent">Ausente</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPlayerToDelete(player);
                      soundEffects.playTap();
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title={`Remover ${player.name} do elenco`}
                    aria-label={`Remover ${player.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onOpenEditPlayer(player)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Editar informações do atleta (nome, posições, pé)"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Editar Cadastro</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal for Player Deletion */}
      {playerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Remover Jogador?</h3>
                <p className="text-xs text-slate-400">Esta ação removerá o atleta do elenco.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <p className="font-semibold text-white">
                {playerToDelete.name} {playerToDelete.nickname ? `(${playerToDelete.nickname})` : ''}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Posição: {playerToDelete.primaryPosition} · Nota: ★{playerToDelete.currentRating.toFixed(1)} · Status: {playerToDelete.status === 'fixed' ? 'Titular Fixo' : playerToDelete.status === 'bench' ? 'Suplente' : 'Ausente'}
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              O jogador será excluído de todas as listas e não aparecerá nos sorteios.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeletePlayer(playerToDelete.id);
                  setPlayerToDelete(null);
                  soundEffects.playTap();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
