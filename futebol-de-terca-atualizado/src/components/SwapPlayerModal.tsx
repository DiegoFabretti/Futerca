import React, { useState } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { Team, Player } from '../types/football';
import { getPositionBadge } from '../utils/balancer';
import { soundEffects } from '../utils/audio';

interface SwapPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  initialPlayerA?: Player | null;
  onSwap: (playerAId: string, playerBId: string) => void;
}

export const SwapPlayerModal: React.FC<SwapPlayerModalProps> = ({
  isOpen,
  onClose,
  teams,
  initialPlayerA,
  onSwap,
}) => {
  const [selectedPlayerAId, setSelectedPlayerAId] = useState<string>(
    initialPlayerA?.id || (teams[0]?.players[0]?.id ?? '')
  );
  const [selectedPlayerBId, setSelectedPlayerBId] = useState<string>('');

  if (!isOpen) return null;

  // Find which team player A is in
  let teamA: Team | undefined;
  let playerA: Player | undefined;

  for (const t of teams) {
    const p = t.players.find((item) => item.id === selectedPlayerAId);
    if (p) {
      teamA = t;
      playerA = p;
      break;
    }
  }

  // Eligible targets for player B: all players in other teams
  const otherTeams = teams.filter((t) => t.id !== teamA?.id);
  const allEligibleTargets = otherTeams.flatMap((t) =>
    t.players.map((p) => ({ ...p, teamName: t.name, teamColor: t.colorHex }))
  );

  // Set default player B if not yet selected
  const activePlayerBId = selectedPlayerBId || allEligibleTargets[0]?.id;
  const playerB = allEligibleTargets.find((p) => p.id === activePlayerBId);

  const handleExecuteSwap = () => {
    if (!selectedPlayerAId || !activePlayerBId) return;
    onSwap(selectedPlayerAId, activePlayerBId);
    soundEffects.playTap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Troca Direta de Jogadores</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Selecione dois jogadores de times diferentes para fazer uma permuta manual com recálculo automático das médias.
        </p>

        <div className="space-y-4">
          {/* Player A Selection */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-400 block">
              Jogador 1 (Time Atual: {teamA?.name || 'Selecione'})
            </label>
            <select
              value={selectedPlayerAId}
              onChange={(e) => {
                setSelectedPlayerAId(e.target.value);
                setSelectedPlayerBId('');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
            >
              {teams.map((t) => (
                <optgroup key={t.id} label={t.name}>
                  {t.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname || p.name} ({p.primaryPosition} - Nota ★{p.currentRating.toFixed(1)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-emerald-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
          </div>

          {/* Player B Selection */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="text-xs font-semibold text-slate-400 block">
              Jogador 2 (Trocar com outro time)
            </label>
            <select
              value={activePlayerBId}
              onChange={(e) => setSelectedPlayerBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs sm:text-sm text-white"
            >
              {otherTeams.map((t) => (
                <optgroup key={t.id} label={t.name}>
                  {t.players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname || p.name} ({p.primaryPosition} - Nota ★{p.currentRating.toFixed(1)})
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Swap Preview summary */}
          {playerA && playerB && (
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-white">{playerA.nickname || playerA.name}</span>
                <span className="text-slate-400"> ({playerA.primaryPosition} · ★{playerA.currentRating.toFixed(1)})</span>
              </div>
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0 mx-2" />
              <div>
                <span className="font-semibold text-white">{playerB.nickname || playerB.name}</span>
                <span className="text-slate-400"> ({playerB.primaryPosition} · ★{playerB.currentRating.toFixed(1)})</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={!playerA || !playerB}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-all shadow-md shadow-emerald-400/20 active:scale-95"
          >
            Confirmar Troca
          </button>
        </div>
      </div>
    </div>
  );
};
