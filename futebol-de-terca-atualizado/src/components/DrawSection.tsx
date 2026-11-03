import React, { useState } from 'react';
import { 
  Shuffle, 
  HelpCircle, 
  ArrowRightLeft, 
  Play, 
  Check, 
  Copy, 
  Clock, 
  UserMinus, 
  UserPlus, 
  Dices,
  Star,
  Award,
  AlertCircle,
  Plus,
  Trash2,
  X,
  UserCheck
} from 'lucide-react';
import { Player, Team, BalanceResult, Position } from '../types/football';
import { getPositionBadge } from '../utils/balancer';
import { formatTeamsForWhatsApp } from '../utils/whatsapp';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DrawSectionProps {
  players: Player[];
  teams: Team[];
  balanceResult: BalanceResult | null;
  onTogglePlayerStatus: (playerId: string, newStatus: 'fixed' | 'bench' | 'absent') => void;
  onPromoteBenchToFixed: (benchPlayerId: string, replacePlayerId?: string) => void;
  onAddToBench: (playerId: string) => void;
  onRemoveFromBench: (playerId: string) => void;
  onMoveFixedToBench: (playerId: string) => void;
  onQuickCreateBenchPlayer: (name: string, position: Position, rating: number) => void;
  onPerformDraw: (isReDraw?: boolean) => void;
  onOpenExplainer: () => void;
  onOpenSwapModal: (player?: Player) => void;
  onStartMatchesWithTeams: () => void;
  onOpenEditPlayer: (player: Player) => void;
  onOpenPostMatchRating: () => void;
}

export const DrawSection: React.FC<DrawSectionProps> = ({
  players,
  teams,
  balanceResult,
  onTogglePlayerStatus,
  onPromoteBenchToFixed,
  onAddToBench,
  onRemoveFromBench,
  onMoveFixedToBench,
  onQuickCreateBenchPlayer,
  onPerformDraw,
  onOpenExplainer,
  onOpenSwapModal,
  onStartMatchesWithTeams,
  onOpenEditPlayer,
  onOpenPostMatchRating,
}) => {
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [selectedDesfalquePlayer, setSelectedDesfalquePlayer] = useState<Player | null>(null);

  // Add Suplente Modal State
  const [isAddSuplenteOpen, setIsAddSuplenteOpen] = useState(false);
  const [newSuplenteTab, setNewSuplenteTab] = useState<'registered' | 'guest'>('registered');
  const [selectedAbsentId, setSelectedAbsentId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPosition, setGuestPosition] = useState<Position>('MEI');
  const [guestRating, setGuestRating] = useState(7.0);
  const [benchNotice, setBenchNotice] = useState<string>('');

  // 18 Fixed Starters vs Suplentes (Waitlist)
  const fixedPlayers = players.filter((p) => p.status === 'fixed');
  const benchPlayers = players
    .filter((p) => p.status === 'bench')
    .sort((a, b) => (a.benchOrder || 99) - (b.benchOrder || 99));
  const absentPlayers = players.filter((p) => p.status === 'absent');

  const gkCount = fixedPlayers.filter((p) => p.primaryPosition === 'GOL').length;
  const defCount = fixedPlayers.filter((p) => p.primaryPosition === 'ZAG').length;
  const midCount = fixedPlayers.filter((p) => p.primaryPosition === 'MEI').length;
  const atkCount = fixedPlayers.filter((p) => p.primaryPosition === 'ATA').length;

  const currentAttempt = balanceResult?.attemptNumber || 1;

  const handleDrawClick = (isReDraw: boolean = false) => {
    soundEffects.playWhistle();
    onPerformDraw(isReDraw);
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#3b82f6', '#eab308', '#ef4444'],
    });
  };

  const handleCopyWhatsApp = () => {
    if (teams.length === 0) return;
    const text = formatTeamsForWhatsApp(teams, balanceResult, benchPlayers);
    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    soundEffects.playTap();
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  const handleDesfalqueClick = (fixedPlayer: Player) => {
    if (benchPlayers.length > 0) {
      setSelectedDesfalquePlayer(fixedPlayer);
    } else {
      onTogglePlayerStatus(fixedPlayer.id, 'absent');
    }
  };

  const handleConfirmReplacement = (benchPlayer: Player) => {
    if (!selectedDesfalquePlayer) return;
    onPromoteBenchToFixed(benchPlayer.id, selectedDesfalquePlayer.id);
    setSelectedDesfalquePlayer(null);
    soundEffects.playTap();
  };

  const handleQuickSubstituteFirst = (fixedPlayer: Player) => {
    if (benchPlayers.length === 0) return;
    const firstBench = benchPlayers[0];
    onPromoteBenchToFixed(firstBench.id, fixedPlayer.id);
    soundEffects.playTap();
  };

  // Add Suplente submit
  const handleAddSuplenteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSuplenteTab === 'registered') {
      if (!selectedAbsentId) return;
      onAddToBench(selectedAbsentId);
      setSelectedAbsentId('');
    } else {
      if (!guestName.trim()) return;
      onQuickCreateBenchPlayer(guestName.trim(), guestPosition, guestRating);
      setGuestName('');
      setGuestRating(7.0);
    }
    soundEffects.playTap();
    setIsAddSuplenteOpen(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. Limite Estrito de 18 Fixos */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Elenco Confirmado para a Rodada
              </h2>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  fixedPlayers.length === 18
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                    : fixedPlayers.length > 18
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                {fixedPlayers.length} / 18 Fixos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Capacidade travada: <strong>exatamente 18 fixos</strong> para formar os <strong>3 times de 6</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-mono">
              🧤 {gkCount} GOL · 🛡️ {defCount} ZAG · 🎯 {midCount} MEI · ⚡ {atkCount} ATA
            </span>
          </div>
        </div>

        {/* Status Quota Notifications */}
        {fixedPlayers.length < 18 && (
          <div className="mt-3.5 p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2.5 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Faltam <strong>{18 - fixedPlayers.length} atletas</strong> para atingir os 18 fixos.
                {benchPlayers.length > 0 && ' Promovásuplentes da lista de espera abaixo!'}
              </span>
            </div>
          </div>
        )}

        {fixedPlayers.length > 18 && (
          <div className="mt-3.5 p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Limite excedido! Há <strong>{fixedPlayers.length} atletas</strong> fixos. Mova os excedentes para a espera.
            </span>
          </div>
        )}

        {/* Lista dos 18 Fixos com Troca Rápida e Mover para Suplente */}
        <div className="mt-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            18 Atletas Titulares da Terça:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
            {fixedPlayers.map((p) => {
              const posBadge = getPositionBadge(p.primaryPosition);

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${posBadge.badgeClass}`}>
                      {posBadge.label}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-white truncate block">
                        {p.nickname || p.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Nota Geral: ★{p.currentRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {benchPlayers.length > 0 ? (
                      <button
                        onClick={() => handleQuickSubstituteFirst(p)}
                        title={`Trocar imediatamente pelo 1º suplente (${benchPlayers[0].nickname || benchPlayers[0].name})`}
                        className="px-2 py-1 text-[11px] font-semibold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/30 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Substituir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDesfalqueClick(p)}
                        className="px-2 py-1 text-[11px] font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span>Desfalcou</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onMoveFixedToBench(p.id);
                        soundEffects.playTap();
                      }}
                      title="Mover para a Lista de Suplentes"
                      className="p-1 text-slate-500 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Seção de Suplentes: Adicionar, Promover e Remover */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Lista de Suplentes (Fila de Espera)</span>
              <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {benchPlayers.length} na espera
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ordem de prioridade para entrar caso algum dos 18 titulares desfalque
            </p>
          </div>

          <button
            onClick={() => setIsAddSuplenteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Adicionar Suplente</span>
          </button>
        </div>

        {benchNotice && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-xs text-amber-300 font-semibold flex items-center justify-between">
            <span>{benchNotice}</span>
            <button type="button" onClick={() => setBenchNotice('')} className="text-slate-400 hover:text-white px-2">✕</button>
          </div>
        )}

        {benchPlayers.length === 0 ? (
          <div className="py-4 text-center space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/80 p-4">
            <p className="text-xs text-slate-400">
              Nenhum suplente na fila de espera no momento.
            </p>
            <button
              onClick={() => setIsAddSuplenteOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Clique aqui para adicionar um suplente</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {benchPlayers.map((p, idx) => {
              const posBadge = getPositionBadge(p.primaryPosition);

              return (
                <div
                  key={p.id}
                  className="p-2.5 rounded-xl bg-slate-950/90 border border-amber-500/20 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}º
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate">
                          {p.nickname || p.name}
                        </span>
                        <span className={`text-[9px] font-bold px-1 rounded ${posBadge.badgeClass}`}>
                          {posBadge.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Nota Geral: ★{p.currentRating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (fixedPlayers.length >= 18) {
                          setBenchNotice('O elenco já está completo com 18 titulares! Use o botão "Substituir" em um jogador que desfalcou.');
                          setTimeout(() => setBenchNotice(''), 4500);
                        } else {
                          onPromoteBenchToFixed(p.id);
                        }
                      }}
                      title="Promover para os 18 Fixos"
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3 stroke-[2.5]" />
                      <span>Promover</span>
                    </button>

                    <button
                      onClick={() => {
                        onRemoveFromBench(p.id);
                        soundEffects.playTap();
                      }}
                      title="Remover da Lista de Suplentes"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Sorteio dos 3 Times de 6 & Re-Sorteio Livre (Ilimitado) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Shuffle className="w-4 h-4 text-emerald-400" />
              <span>Sorteio dos 3 Times de 6 Jogadores</span>
            </h3>
            <p className="text-xs text-slate-400">
              Distribui 18 jogadores fixos em 3 times equilibrados por nota e posição (1 goleiro por time)
            </p>
          </div>

          <button
            onClick={onOpenExplainer}
            title="Como o algoritmo balanceia as notas e posições"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Como funciona o algoritmo?</span>
          </button>
        </div>

        {/* Action Buttons: Sortear vs Re-sortear Livre */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => handleDrawClick(false)}
            disabled={fixedPlayers.length !== 18}
            className="py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Shuffle className="w-4 h-4 stroke-[2.5]" />
            <span>Sortear 3 Times de 6</span>
          </button>

          <button
            onClick={() => handleDrawClick(true)}
            disabled={teams.length === 0 || fixedPlayers.length !== 18}
            className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500/40 text-emerald-400 font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Re-sortear (Nova Opção #{currentAttempt + 1})</span>
          </button>
        </div>
      </section>

      {/* 4. Escalações dos 3 Times de 6 Jogadores */}
      {teams.length === 3 && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Escalação Oficial da Terça</span>
                {balanceResult && (
                  <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Tentativa #{balanceResult.attemptNumber} · ⚖️ {balanceResult.fairnessScore}% Equilibrado (Δ máx: {balanceResult.maxDelta})
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Gostou dessa formação? Se quiser testar outra distribuição, clique em <strong>Re-sortear</strong> livremente!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenPostMatchRating}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md shadow-emerald-400/20 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Avaliação Pós-Jogo</span>
              </button>

              <button
                onClick={() => onOpenSwapModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trocar Jogadores</span>
              </button>

              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWhatsapp ? 'Copiado!' : 'Zap da Pelada'}</span>
              </button>

              <button
                onClick={onStartMatchesWithTeams}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-md shadow-amber-400/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Pelada</span>
              </button>
            </div>
          </div>

          {/* 3 Times de 6 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: team.colorHex }}
                />

                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: team.colorHex }}
                        />
                        <h4 className="font-bold text-base text-white">
                          {team.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-semibold text-white">6 atletas</span>
                        <span>·</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          Média {team.stats.avgOverall.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 6 Players List */}
                  <div className="space-y-1.5">
                    {team.players.map((p) => {
                      const posBadge = getPositionBadge(p.primaryPosition);

                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${posBadge.badgeClass}`}
                            >
                              {posBadge.label}
                            </span>
                            <div className="truncate">
                              <span className="text-xs font-semibold text-slate-200 block truncate">
                                {p.nickname || p.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {p.name} · {p.preferredFoot}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                              ★{p.currentRating.toFixed(1)}
                            </span>
                            <button
                              onClick={() => handleDesfalqueClick(p)}
                              title="Substituir por suplente"
                              className="p-1 text-slate-500 hover:text-amber-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Positional balance footer */}
                <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Formação:</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-amber-400">{team.stats.positionCounts.GOL} GOL</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-blue-400">{team.stats.positionCounts.ZAG} ZAG</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-emerald-400">{team.stats.positionCounts.MEI} MEI</span>
                    <span className="text-slate-600">/</span>
                    <span className="text-rose-400">{team.stats.positionCounts.ATA} ATA</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instant Desfalque Replacement Modal */}
      {selectedDesfalquePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <h4 className="text-sm font-bold text-white mb-1">Substituir Desfalque</h4>
            <p className="text-xs text-slate-400 mb-4">
              <strong>{selectedDesfalquePlayer.nickname || selectedDesfalquePlayer.name}</strong> desfalcou. Escolha qual suplente da fila de espera entrará na vaga:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {benchPlayers.map((bench, idx) => {
                const posBadge = getPositionBadge(bench.primaryPosition);

                return (
                  <button
                    key={bench.id}
                    onClick={() => handleConfirmReplacement(bench)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold flex items-center justify-center">
                        {idx + 1}º
                      </span>
                      <div>
                        <span className="text-xs font-semibold text-white block">
                          {bench.nickname || bench.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {bench.primaryPosition} · Nota ★{bench.currentRating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">Assumir Vaga &rarr;</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between">
              <button
                onClick={() => {
                  onTogglePlayerStatus(selectedDesfalquePlayer.id, 'absent');
                  setSelectedDesfalquePlayer(null);
                }}
                className="px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              >
                Apenas remover dos 18
              </button>

              <button
                onClick={() => setSelectedDesfalquePlayer(null)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adicionar Suplente Modal */}
      {isAddSuplenteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Adicionar à Lista de Suplentes</h4>
              </div>
              <button
                onClick={() => setIsAddSuplenteOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs: Atleta Cadastrado vs Convidado Rápido */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => setNewSuplenteTab('registered')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  newSuplenteTab === 'registered'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Atleta Cadastrado
              </button>
              <button
                type="button"
                onClick={() => setNewSuplenteTab('guest')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  newSuplenteTab === 'guest'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Novo Convidado
              </button>
            </div>

            <form onSubmit={handleAddSuplenteSubmit} className="space-y-4">
              {newSuplenteTab === 'registered' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 block">
                    Selecione um atleta que está ausente/fora dos 18:
                  </label>
                  {absentPlayers.length === 0 ? (
                    <p className="text-xs text-slate-500 py-3 text-center bg-slate-950 rounded-xl">
                      Todos os atletas cadastrados já estão nos 18 ou na espera. Use a aba <strong>Novo Convidado</strong> para cadastrar outro!
                    </p>
                  ) : (
                    <select
                      value={selectedAbsentId}
                      onChange={(e) => setSelectedAbsentId(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">Selecione o jogador...</option>
                      {absentPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nickname || p.name} ({p.primaryPosition} - Nota ★{p.currentRating.toFixed(1)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Nome / Apelido do Convidado *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Ex: Fabinho Convidado"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Posição
                      </label>
                      <select
                        value={guestPosition}
                        onChange={(e) => setGuestPosition(e.target.value as Position)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                      >
                        <option value="GOL">Goleiro (GOL)</option>
                        <option value="ZAG">Zagueiro (ZAG)</option>
                        <option value="MEI">Meio-campo (MEI)</option>
                        <option value="ATA">Atacante (ATA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Nota Geral (0 a 10)
                      </label>
                      <input
                        type="number"
                        min="1.0"
                        max="10.0"
                        step="0.1"
                        value={guestRating}
                        onChange={(e) => setGuestRating(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddSuplenteOpen(false)}
                  className="px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={newSuplenteTab === 'registered' && !selectedAbsentId}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Confirmar Suplente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
