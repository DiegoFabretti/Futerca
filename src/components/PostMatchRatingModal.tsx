import React, { useState } from 'react';
import { X, Check, Star, Award, Sparkles } from 'lucide-react';
import { Player, SingleRating } from '../types/football';
import { getCurrentQuarter, calculateWeightedRating } from '../utils/quarterCycle';
import { soundEffects } from '../utils/audio';

interface PostMatchRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSaveBatchRatings: (updatedPlayers: Player[]) => void;
}

export const PostMatchRatingModal: React.FC<PostMatchRatingModalProps> = ({
  isOpen,
  onClose,
  players,
  onSaveBatchRatings,
}) => {
  // Only players who are in the 18 starters (fixed)
  const fixedPlayers = players.filter((p) => p.status === 'fixed');

  // Local state mapping playerId -> single score (0 to 10)
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const p of fixedPlayers) {
      init[p.id] = p.currentRating || 7.5;
    }
    return init;
  });

  const [notes, setNotes] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const currentQ = getCurrentQuarter();
  const today = new Date().toISOString().split('T')[0];

  const handleScoreChange = (playerId: string, val: number) => {
    setScores((prev) => ({ ...prev, [playerId]: val }));
    soundEffects.playTap();
  };

  const handleSaveAll = () => {
    soundEffects.playWhistle();

    const updatedPlayers = players.map((player) => {
      const score = scores[player.id];
      if (score === undefined || player.status !== 'fixed') {
        return player;
      }

      const newRatingItem: SingleRating = {
        id: `r-${Date.now()}-${player.id}`,
        date: today,
        score,
        quarter: currentQ,
        note: notes[player.id]?.trim() || 'Avaliação da Rodada de Terça',
      };

      const updatedRatings = [newRatingItem, ...(player.ratings || [])];
      const { currentRating, quarterRating, summaries } = calculateWeightedRating(
        updatedRatings,
        currentQ
      );

      return {
        ...player,
        currentRating,
        quarterRating,
        ratings: updatedRatings,
        quarterlyHistory: summaries,
      };
    });

    onSaveBatchRatings(updatedPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white">
                Avaliação Pós-Jogo da Rodada
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Atribua uma <strong>nota geral única (0 a 10)</strong> para cada um dos 18 titulares
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list of players optimized for touch */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5">
          {fixedPlayers.map((p) => {
            const currentScore = scores[p.id] ?? p.currentRating;

            return (
              <div
                key={p.id}
                className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              >
                {/* Player Name and Position */}
                <div className="flex items-center justify-between sm:justify-start gap-2.5">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {p.primaryPosition}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {p.nickname || p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Média Atual: ★{p.currentRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="sm:hidden font-mono font-black text-sm text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                    ★{currentScore.toFixed(1)}
                  </span>
                </div>

                {/* Mobile-Friendly Quick Score Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {[6.0, 7.0, 7.5, 8.0, 8.5, 9.0, 9.5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleScoreChange(p.id, val)}
                      className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                        currentScore === val
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {val.toFixed(1)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Salvar Notas da Rodada ({currentQ})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
