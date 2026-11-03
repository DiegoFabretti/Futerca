import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Search, 
  User, 
  LogOut, 
  Star, 
  KeyRound, 
  ShieldCheck, 
  RefreshCw, 
  Sparkles, 
  Award,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Player, WeeklyVotingSession, Position } from '../types/football';
import { votingService, LoggedPlayerInfo } from '../services/votingService';
import { getPositionBadge } from '../utils/balancer';
import { soundEffects } from '../utils/audio';
import confetti from 'canvas-confetti';

interface VotingSectionProps {
  players: Player[];
  session: WeeklyVotingSession | null;
  onSessionUpdated: (session: WeeklyVotingSession) => void;
  onStartNewRound: (managerPassword: string) => Promise<any>;
}

export const VotingSection: React.FC<VotingSectionProps> = ({
  players,
  session,
  onSessionUpdated,
  onStartNewRound,
}) => {
  // Authentication State
  const [loggedPlayer, setLoggedPlayer] = useState<LoggedPlayerInfo | null>(() =>
    votingService.getLoggedInPlayer()
  );
  const [selectedPlayerForAuth, setSelectedPlayerForAuth] = useState<Player | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Manager Master Password State (New Round Unlock)
  const [managerPasswordInput, setManagerPasswordInput] = useState('');
  const [showManagerPassword, setShowManagerPassword] = useState(false);
  const [managerAuthError, setManagerAuthError] = useState('');
  const [isSubmittingNewRound, setIsSubmittingNewRound] = useState(false);
  const [isChangingManagerPassword, setIsChangingManagerPassword] = useState(false);
  const [currentManagerPassInput, setCurrentManagerPassInput] = useState('');
  const [newManagerPassInput, setNewManagerPassInput] = useState('');
  const [managerPassSuccess, setManagerPassSuccess] = useState('');

  // Search & Filter in Auth Screen
  const [searchPlayer, setSearchPlayer] = useState('');

  // Ballot State: Map of playerId -> chosen score (0.0 to 10.0)
  const [ballotScores, setBallotScores] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isNewRoundModalOpen, setIsNewRoundModalOpen] = useState(false);
  const [newRoundSuccessToast, setNewRoundSuccessToast] = useState('');

  // Time remaining countdown ticker
  const [timeRemaining, setTimeRemaining] = useState(() =>
    session ? votingService.getTimeRemaining(session) : { days: 4, hours: 0, minutes: 0, totalMs: 0, isExpired: false }
  );

  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      setTimeRemaining(votingService.getTimeRemaining(session));
    }, 15000);
    setTimeRemaining(votingService.getTimeRemaining(session));
    return () => clearInterval(interval);
  }, [session]);

  // Pre-fill default scores when logged in
  useEffect(() => {
    if (!loggedPlayer) return;
    const initial: Record<string, number> = {};
    players.forEach((p) => {
      if (p.id !== loggedPlayer.playerId) {
        // Preset with their current rating or 7.0
        initial[p.id] = p.currentRating ? Math.round(p.currentRating * 10) / 10 : 7.0;
      }
    });
    setBallotScores(initial);
  }, [loggedPlayer, players]);

  // Filter players for selection
  const eligiblePlayers = players.filter((p) => p.status === 'fixed' || p.status === 'bench');
  const filteredCandidates = eligiblePlayers.filter((p) =>
    p.name.toLowerCase().includes(searchPlayer.toLowerCase()) ||
    (p.nickname && p.nickname.toLowerCase().includes(searchPlayer.toLowerCase()))
  );

  // Handle Player Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForAuth) return;
    setAuthError('');

    try {
      const logged = await votingService.loginPlayer(
        selectedPlayerForAuth.id,
        passwordInput,
        selectedPlayerForAuth.nickname || selectedPlayerForAuth.name
      );
      setLoggedPlayer(logged);
      setPasswordInput('');
      soundEffects.playTap();
    } catch (err: any) {
      setAuthError(err.message || 'Senha incorreta!');
    }
  };

  // Handle Change Password
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedPlayer) return;
    setAuthError('');
    setChangePasswordSuccess('');

    try {
      await votingService.setPlayerPassword(
        loggedPlayer.playerId,
        currentPasswordInput,
        newPasswordInput
      );
      setChangePasswordSuccess('Senha alterada com sucesso!');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setChangePasswordSuccess('');
      }, 2000);
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao alterar senha.');
    }
  };

  const handleLogout = () => {
    votingService.logoutPlayer();
    setLoggedPlayer(null);
    setSelectedPlayerForAuth(null);
    setPasswordInput('');
    setAuthError('');
  };

  // Set score for a candidate
  const handleSetScore = (targetId: string, score: number) => {
    const clamped = Math.max(1, Math.min(10, Math.round(score * 10) / 10));
    setBallotScores((prev) => ({
      ...prev,
      [targetId]: clamped,
    }));
  };

  // Check if current logged player has already voted
  const hasAlreadyVoted = Boolean(
    session && loggedPlayer && (session.votedPlayerIds?.includes(loggedPlayer.playerId) || false)
  );

  // Submit Ballot
  const handleConfirmSubmitBallot = async () => {
    if (!session || !loggedPlayer) return;
    setIsSubmitting(true);
    setSubmitError('');

    const ratingsPayload = Object.entries(ballotScores).map(([pId, score]) => ({
      playerId: pId,
      score,
    }));

    try {
      const res = await votingService.submitPlayerBallot(
        session.weekId,
        loggedPlayer.playerId,
        ratingsPayload
      );
      onSessionUpdated(res.session);
      setShowConfirmModal(false);
      soundEffects.playWhistle();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Erro ao processar votação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNewRound = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!managerPasswordInput.trim()) {
      setManagerAuthError('Por favor, digite ásenha do gestor.');
      return;
    }

    setIsSubmittingNewRound(true);
    setManagerAuthError('');

    try {
      await onStartNewRound(managerPasswordInput.trim());
      soundEffects.playWhistle();
      setIsNewRoundModalOpen(false);
      setManagerPasswordInput('');
      setNewRoundSuccessToast('Nova rodada liberada com sucesso! Todos os 18 atletas já podem votar pelos próximos 4 dias.');
      setTimeout(() => setNewRoundSuccessToast(''), 6000);
    } catch (err: any) {
      setManagerAuthError(err.message || 'Senha de gestor incorreta!');
    } finally {
      setIsSubmittingNewRound(false);
    }
  };

  const handleChangeManagerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setManagerAuthError('');
    setManagerPassSuccess('');

    try {
      await votingService.setManagerPassword(currentManagerPassInput, newManagerPassInput);
      setManagerPassSuccess('Senha do gestor alterada com sucesso!');
      setCurrentManagerPassInput('');
      setNewManagerPassInput('');
      setTimeout(() => {
        setIsChangingManagerPassword(false);
        setManagerPassSuccess('');
      }, 2500);
    } catch (err: any) {
      setManagerAuthError(err.message || 'Erro ao alterar senha do gestor.');
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-4xl mx-auto">
      {/* Toast Alert for New Round */}
      {newRoundSuccessToast && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-3 text-emerald-300 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{newRoundSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setNewRoundSuccessToast('')}
            className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Header Banner & 4-Day Deadline Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Votação Oficial da Rodada
                </h2>
                <p className="text-xs text-slate-400">
                  Avaliação anônima por nota única (0 a 10) · 1 voto por jogador
                </p>
              </div>
            </div>
          </div>

          {/* 4-Day Countdown Display */}
          <div className="shrink-0">
            {timeRemaining.isExpired ? (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2 rounded-xl text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <span className="block font-bold">Votação Encerrada</span>
                  <span className="text-[10px] text-rose-400/80">Prazo limite de 4 dias expirou</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2 rounded-xl text-xs">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <span className="block font-bold">
                    Prazo: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                  </span>
                  <span className="text-[10px] text-emerald-400/80">Limite de 4 dias após a partida</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Voting Rules Pill Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>100% Anônimo:</strong> Ninguém vê as notas individuais.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-400 shrink-0" />
            <span><strong>Protegido por Senha:</strong> Cada atleta vota apenas por si.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>1 Voto por Pessoa:</strong> Bloqueia após envio até o próximo jogo.</span>
          </div>
        </div>
      </div>

      {/* 2. Step: User Not Logged In -> Name Selection & Password Prompt */}
      {!loggedPlayer ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Identifique-se para Votar
            </h3>
            <p className="text-xs text-slate-400">
              Clique no seu nome abaixo ou busque para inserir suásenha pessoal e liberar a cédula de votação.
            </p>
          </div>

          {/* Search Athlete Box */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              placeholder="Digite seu nome ou apelido..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Athlete Quick Select Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
            {filteredCandidates.map((p) => {
              const posBadge = getPositionBadge(p.primaryPosition);
              const isSelected = selectedPlayerForAuth?.id === p.id;
              const hasVoted = session?.votedPlayerIds?.includes(p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedPlayerForAuth(p);
                    setPasswordInput('');
                    setAuthError('');
                    soundEffects.playTap();
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {p.nickname ? p.nickname.slice(0, 2).toUpperCase() : p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs truncate block text-white">
                        {p.nickname || p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${posBadge.badgeClass}`}>
                        {posBadge.label}
                      </span>
                      {hasVoted && (
                        <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                          ✓ Votou
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Password Prompt Form (when athlete selected) */}
          {selectedPlayerForAuth && (
            <div className="max-w-md mx-auto p-4 sm:p-5 bg-slate-950 border border-emerald-500/40 rounded-2xl shadow-xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-400 font-semibold block">Atleta Selecionado:</span>
                  <h4 className="font-bold text-white text-base">
                    {selectedPlayerForAuth.name} {selectedPlayerForAuth.nickname ? `(${selectedPlayerForAuth.nickname})` : ''}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForAuth(null)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Trocar atleta
                </button>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Digite suásenha de jogador:
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Senha pessoal (padrão inicial: 1234)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Todos os atletas iniciam com ásenha padrão <strong>1234</strong>. Você pode alterá-la parásuásenha pessoal a qualquer momento.
                  </p>
                </div>

                {authError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Acessar Cédula de Votação</span>
                </button>
              </form>
            </div>
          )}
        </div>
      ) : (
        /* 3. Step: User IS Logged In */
        <div className="space-y-6">
          {/* Active Logged Player Ribbon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {loggedPlayer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Conectado como:</span>
                  <span className="font-bold text-sm text-white">{loggedPlayer.name}</span>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">
                  {hasAlreadyVoted ? '✅ Voto já computado nesta rodada' : '⏳ Cédula liberada para votação'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alterar Minha Senha</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Change Password Panel */}
          {isChangingPassword && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg max-w-md mx-auto animate-fade-in space-y-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>Alterar Senha Pessoal de {loggedPlayer.name}</span>
              </h4>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Senha Atual:</label>
                  <input
                    type="password"
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Suásenha atual (ou 1234)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nova Senha:</label>
                  <input
                    type="password"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="Mínimo de 3 dígitos/caracteres"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {changePasswordSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold">{changePasswordSuccess}</p>
                )}
                {authError && (
                  <p className="text-xs text-rose-400 font-semibold">{authError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsChangingPassword(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Condition A: ALREADY VOTED -> Show Locked Ballot & Anonymous Leaderboard */}
          {hasAlreadyVoted ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="text-center max-w-lg mx-auto space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Seu Voto Foi Computado com Sucesso!
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Você já registrou sua avaliação para esta rodada. Para preservar a integridade das notas e evitar manipulações, <strong>cada jogador pode votar apenas 1 única vez por semana</strong>.
                </p>
                <div className="inline-block mt-1 px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-slate-400 text-xs font-mono">
                  🔒 Cédula travada até o próximo jogo
                </div>
              </div>

              {/* Anonymous Group Progress Bar */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">Participação da Galera:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {session?.votedPlayerIds?.length || 0} de {players.filter((p) => p.status === 'fixed').length} fixos votaram
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (((session?.votedPlayerIds?.length || 0) / Math.max(1, players.filter((p) => p.status === 'fixed').length)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Current Anonymous Averages Calculated for the Round */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Médias Gerais Consolidadas Desta Rodada:
                  </h4>
                  <span className="text-[11px] text-slate-500">Soma de votos / total de avaliadores</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {players.map((p) => {
                    const stats = session ? votingService.calculatePlayerRoundAverage(p.id, session) : { average: null, count: 0 };
                    const posBadge = getPositionBadge(p.primaryPosition);

                    return (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${posBadge.badgeClass}`}>
                            {posBadge.label}
                          </span>
                          <span className="text-xs font-semibold text-white truncate">
                            {p.nickname || p.name}
                          </span>
                        </div>

                        <div className="shrink-0 text-right">
                          {stats.average !== null ? (
                            <div className="flex items-center gap-1 font-mono font-bold text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Star className="w-3 h-3 fill-emerald-400" />
                              <span>{stats.average.toFixed(1)}</span>
                              <span className="text-[10px] text-slate-400 font-normal">({stats.count})</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Sem notas ainda</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Organizer Action within Already Voted Card */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-left bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block">Deseja liberar a votação para a próxima terça-feira?</span>
                  O gestor da pelada pode iniciar uma nova rodada a qualquer momento para resetar a trava de 1 voto.
                </div>
                <button
                  type="button"
                  onClick={() => setIsNewRoundModalOpen(true)}
                  className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold cursor-pointer shrink-0 flex items-center gap-2 transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Liberar Votação do Próximo Jogo</span>
                </button>
              </div>
            </div>
          ) : timeRemaining.isExpired ? (
            /* Condition B: 4-Day Deadline Expired */
            <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Prazo de 4 Dias Esgotado!
              </h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                O período de 4 dias para dar notas desta rodada expirou. O sistema bloqueou a entrada de novos votos para consolidar as médias. Inicie a rodada do próximo jogo da terça-feira para abrir uma nova cédula de 4 dias.
              </p>
              <button
                type="button"
                onClick={() => setIsNewRoundModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-400/20 transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Liberar Votação do Próximo Jogo Agora</span>
              </button>
            </div>
          ) : (
            /* Condition C: Ballot Active -> Official Voting Form */
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Avalie os Colegas da Pelada</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Selecione uma nota geral de 1.0 a 10.0 para cada companheiro. O envio é 100% anônimo.
                  </p>
                </div>

                <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                  Avaliando {Object.keys(ballotScores).length} atletas
                </div>
              </div>

              {/* Athletes Ballot List */}
              <div className="space-y-3">
                {players
                  .filter((p) => p.id !== loggedPlayer.playerId && (p.status === 'fixed' || p.status === 'bench'))
                  .map((player) => {
                    const chosenScore = ballotScores[player.id] ?? 7.0;
                    const posBadge = getPositionBadge(player.primaryPosition);

                    return (
                      <div
                        key={player.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3 hover:border-slate-700 transition-colors"
                      >
                        {/* Athlete Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${player.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
                              {player.nickname ? player.nickname.slice(0, 2).toUpperCase() : player.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-white">
                                  {player.nickname || player.name}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${posBadge.badgeClass}`}>
                                  {posBadge.label}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block">
                                {player.name} · {player.preferredFoot}
                              </span>
                            </div>
                          </div>

                          {/* Chosen Score Badge */}
                          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-xl font-mono font-bold text-lg tabular-nums">
                            <Star className="w-4 h-4 fill-emerald-400" />
                            <span>{chosenScore.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Fast Rating Buttons & Range Slider (Mobile First) */}
                        <div className="space-y-2 pt-1 border-t border-slate-800/80">
                          {/* Quick selection chips */}
                          <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
                            {[5.0, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0, 10.0].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => handleSetScore(player.id, val)}
                                className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                                  Math.abs(chosenScore - val) < 0.1
                                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                {val.toFixed(1)}
                              </button>
                            ))}
                          </div>

                          {/* Fine Range Slider */}
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSetScore(player.id, chosenScore - 0.5)}
                              className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center cursor-pointer text-xs"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min="2.0"
                              max="10.0"
                              step="0.5"
                              value={chosenScore}
                              onChange={(e) => handleSetScore(player.id, parseFloat(e.target.value))}
                              className="flex-1 accent-emerald-500 cursor-pointer"
                            />
                            <button
                              type="button"
                              onClick={() => handleSetScore(player.id, chosenScore + 0.5)}
                              className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold hover:bg-slate-800 flex items-center justify-center cursor-pointer text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {submitError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Bottom Sticky Submission Banner */}
              <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    Ao confirmar, seu voto anônimo será gravado e você não poderá votar novamente nesta rodada.
                  </span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isSubmitting ? 'Enviando Voto...' : 'Confirmar e Enviar Meu Voto'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Organizer Control Section (Start Next Round / Reabrir Votação) */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Controle do Gestor da Pelada
            </h4>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Próximo Jogo</span>
        </div>

        <p className="text-xs text-slate-400">
          Quando a próxima terça-feira chegar, inicie uma nova rodada para zerar o bloqueio de 1 voto por pessoa e abrir um novo prazo de 4 dias para as notas.
        </p>

        <button
          type="button"
          onClick={() => {
            soundEffects.playTap();
            setIsNewRoundModalOpen(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Liberar Votação do Próximo Jogo (Nova Rodada)</span>
        </button>
      </div>

      {/* Modal: Confirm New Round (Protected by Manager Password) */}
      {isNewRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Acesso do Gestor da Pelada</h3>
                <p className="text-xs text-slate-400">Liberar Votação do Próximo Jogo</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Área protegida por senha master</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Apenas os organizadores do futebol possuem ásenha para reiniciar a contagem de 4 dias e liberar novas notas para todos os 18 atletas.
              </p>
            </div>

            {/* Change Manager Password Sub-panel */}
            {isChangingManagerPassword ? (
              <form onSubmit={handleChangeManagerPassword} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 animate-fade-in">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Definir Nova Senha do Gestor</span>
                </h4>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Senha Atual de Gestor:</label>
                  <input
                    type="password"
                    required
                    value={currentManagerPassInput}
                    onChange={(e) => setCurrentManagerPassInput(e.target.value)}
                    placeholder="Senha atual (padrão: gestor123)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nova Senha de Gestor:</label>
                  <input
                    type="password"
                    required
                    value={newManagerPassInput}
                    onChange={(e) => setNewManagerPassInput(e.target.value)}
                    placeholder="Mínimo 3 dígitos/caracteres"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {managerPassSuccess && (
                  <p className="text-xs text-emerald-400 font-semibold">{managerPassSuccess}</p>
                )}
                {managerAuthError && (
                  <p className="text-xs text-rose-400 font-semibold">{managerAuthError}</p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingManagerPassword(false);
                      setManagerAuthError('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar Nova Senha
                  </button>
                </div>
              </form>
            ) : (
              /* Password Entry Form */
              <form onSubmit={handleConfirmNewRound} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Digite a Senha do Gestor:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsChangingManagerPassword(true);
                        setManagerAuthError('');
                      }}
                      className="text-[11px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Alterar Senha do Gestor
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showManagerPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      value={managerPasswordInput}
                      onChange={(e) => setManagerPasswordInput(e.target.value)}
                      placeholder="Senha de organizador (padrão: gestor123)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowManagerPassword(!showManagerPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showManagerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    * Senha padrão inicial: <strong className="text-emerald-400">gestor123</strong> (somente você e o outro gestor devem saber).
                  </p>
                </div>

                {managerAuthError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{managerAuthError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewRoundModalOpen(false);
                      setManagerPasswordInput('');
                      setManagerAuthError('');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewRound}
                    className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-400/30 cursor-pointer active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingNewRound ? 'animate-spin' : ''}`} />
                    <span>{isSubmittingNewRound ? 'Validando Senha...' : 'Confirmar e Liberar Votação'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Final Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Confirmar Envio?</h3>
                <p className="text-xs text-slate-400">Você está votando como {loggedPlayer?.name}.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-emerald-400">🔒 Suas notas serão 100% anônimas.</p>
              <p className="text-[11px] text-slate-400">
                Após confirmar, a céduláserá bloqueada para o seu perfil e não poderá ser alterada até o próximo jogo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Revisar Notas
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmitBallot}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all shadow-md shadow-emerald-400/30 cursor-pointer active:scale-95"
              >
                {isSubmitting ? 'Enviando...' : 'Sim, Enviar Voto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
