import React, { useState, useEffect } from 'react';
import { X, Trash2, Star, ShieldCheck, User } from 'lucide-react';
import { Player, Position, PlayerStatus } from '../types/football';
import { getCurrentQuarter, calculateWeightedRating } from '../utils/quarterCycle';
import { soundEffects } from '../utils/audio';

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlayer: (player: Player) => void;
  onDeletePlayer?: (playerId: string) => void;
  playerToEdit: Player | null;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  isOpen,
  onClose,
  onSavePlayer,
  onDeletePlayer,
  playerToEdit,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [primaryPosition, setPrimaryPosition] = useState<Position>('MEI');
  const [secondaryPosition, setSecondaryPosition] = useState<Position | ''>('');
  const [preferredFoot, setPreferredFoot] = useState<'Destro' | 'Canhoto' | 'Ambidestro'>('Destro');
  const [status, setStatus] = useState<PlayerStatus>('fixed');

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name);
      setNickname(playerToEdit.nickname || '');
      setPrimaryPosition(playerToEdit.primaryPosition);
      setSecondaryPosition(playerToEdit.secondaryPosition || '');
      setPreferredFoot(playerToEdit.preferredFoot || 'Destro');
      setStatus(playerToEdit.status || 'fixed');
    } else {
      setName('');
      setNickname('');
      setPrimaryPosition('MEI');
      setSecondaryPosition('');
      setPreferredFoot('Destro');
      setStatus('fixed');
    }
    setConfirmDelete(false);
  }, [playerToEdit, isOpen]);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!isOpen) return null;

  const currentQ = getCurrentQuarter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const colors = [
      'from-emerald-500 to-teal-700',
      'from-blue-600 to-cyan-800',
      'from-rose-500 to-red-700',
      'from-amber-500 to-orange-700',
      'from-purple-600 to-indigo-800',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    let updatedRatings = playerToEdit ? [...playerToEdit.ratings] : [];
    let currentRating = playerToEdit ? playerToEdit.currentRating : 7.0;
    let quarterRating = playerToEdit ? playerToEdit.quarterRating : 7.0;
    let quarterlyHistory = playerToEdit ? playerToEdit.quarterlyHistory : [];

    // If new player without ratings, seed with standard 7.0
    if (updatedRatings.length === 0) {
      updatedRatings.push({
        id: `r-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        score: 7.0,
        quarter: currentQ,
        note: 'Cadastro de novo atleta',
      });
      const calc = calculateWeightedRating(updatedRatings, currentQ);
      currentRating = calc.currentRating;
      quarterRating = calc.quarterRating;
      quarterlyHistory = calc.summaries;
    }

    const player: Player = {
      id: playerToEdit ? playerToEdit.id : `p-${Date.now()}`,
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      primaryPosition,
      secondaryPosition: secondaryPosition || undefined,
      preferredFoot,
      currentRating,
      quarterRating,
      ratings: updatedRatings,
      quarterlyHistory,
      status,
      confirmed: status === 'fixed',
      avatarColor: playerToEdit ? playerToEdit.avatarColor : randomColor,
      goals: playerToEdit ? playerToEdit.goals : 0,
      matchesPlayed: playerToEdit ? playerToEdit.matchesPlayed : 0,
    };

    onSavePlayer(player);
    soundEffects.playTap();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {playerToEdit ? 'Editar Dados do Jogador' : 'Cadastrar Novo Atleta'}
            </h2>
            <p className="text-xs text-slate-400">
              Informações do elenco · Notas são gerenciadas exclusivamente na aba Votação
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Status Selection (18 Fixos vs Suplentes) */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Status na Rodada *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('fixed')}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'fixed'
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⭐ 18 Fixos
              </button>

              <button
                type="button"
                onClick={() => setStatus('bench')}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'bench'
                    ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ⏳ Suplente
              </button>

              <button
                type="button"
                onClick={() => setStatus('absent')}
                className={`py-2 px-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  status === 'absent'
                    ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                ❌ Ausente
              </button>
            </div>
          </div>

          {/* Name & Nickname */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Apelido na Pelada
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Cadu, Muralha"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Positions & Foot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Posição Principal *
              </label>
              <select
                value={primaryPosition}
                onChange={(e) => setPrimaryPosition(e.target.value as Position)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              >
                <option value="GOL">Goleiro (GOL)</option>
                <option value="ZAG">Zagueiro (ZAG)</option>
                <option value="MEI">Meio-Campo (MEI)</option>
                <option value="ATA">Atacante (ATA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Posição Secundária
              </label>
              <select
                value={secondaryPosition}
                onChange={(e) => setSecondaryPosition(e.target.value as Position | '')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              >
                <option value="">Nenhuma</option>
                <option value="GOL">Goleiro</option>
                <option value="ZAG">Zagueiro</option>
                <option value="MEI">Meio-Campo</option>
                <option value="ATA">Atacante</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Pé Preferido
              </label>
              <select
                value={preferredFoot}
                onChange={(e) => setPreferredFoot(e.target.value as 'Destro' | 'Canhoto' | 'Ambidestro')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
              >
                <option value="Destro">Destro</option>
                <option value="Canhoto">Canhoto</option>
                <option value="Ambidestro">Ambidestro</option>
              </select>
            </div>
          </div>

          {/* Security & Official Voting Notice */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Nota Geral Atual:
                </span>
              </div>
              <span className="font-mono font-bold text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                ★ {playerToEdit ? playerToEdit.currentRating.toFixed(1) : '7.0 (Padrão inicial)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              🔒 <strong>Regra de Segurança:</strong> Para evitar fraudes, nenhuma nota pode ser digitada manualmente aqui. A notásó é atualizada pela média anônima oficial enviada pelos companheiros com senha na aba <strong>VOTAR</strong>.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            {playerToEdit && onDeletePlayer ? (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-rose-400 font-semibold">Confirmar?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePlayer(playerToEdit.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer"
                  >
                    Sim, excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Atleta</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all shadow-md shadow-emerald-400/20 active:scale-95 cursor-pointer"
              >
                Salvar Jogador
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
