import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Trophy, Bell, CheckCircle2, ChevronRight, Shield, Award, AlertTriangle, Flame, Clock } from 'lucide-react';
import { Team, Match, Player } from '../types/football';
import { soundEffects } from '../utils/audio';

interface MatchSectionProps {
  teams: Team[];
  matches: Match[];
  onFinishMatch: (match: Match) => void;
  onUpdateScorer: (playerId: string) => void;
  onGoToVoting?: () => void;
}

export const MatchSection: React.FC<MatchSectionProps> = ({
  teams,
  matches,
  onFinishMatch,
  onUpdateScorer,
  onGoToVoting,
}) => {
  // Active teams in current match
  const [teamAIndex, setTeamAIndex] = useState(0);
  const [teamBIndex, setTeamBIndex] = useState(1);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);

  // Consecutive matches played by each team: teamId -> count (0, 1, or 2)
  const [consecutiveGames, setConsecutiveGames] = useState<Record<string, number>>({});

  // Timer state
  const DEFAULT_DURATION = 10 * 60; // 10 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATION);
  const [isRunning, setIsRunning] = useState(false);

  // Scorer picker modal state
  const [isScorerPickerOpen, setIsScorerPickerOpen] = useState(false);
  const [pendingTeamForGoal, setPendingTeamForGoal] = useState<'A' | 'B'>('A');

  // Match goals list
  const [currentMatchGoals, setCurrentMatchGoals] = useState<Array<{
    id: string;
    playerId: string;
    playerName: string;
    teamId: string;
    minute: number;
  }>>([]);

  // Match Over Alert Modal
  const [matchEndInfo, setMatchEndInfo] = useState<{
    isOpen: boolean;
    reason: 'three_goals' | 'time_out' | 'manual';
    winnerName: string | null;
    finalScoreA: number;
    finalScoreB: number;
    rotationMessage: string;
    nextTeamAName: string;
    nextTeamBName: string;
  } | null>(null);

  const teamA = teams[teamAIndex] || teams[0];
  const teamB = teams[teamBIndex] || teams[1];

  // Consecutive games played so far (before this match ends)
  const teamAStreak = consecutiveGames[teamA?.id] || 0;
  const teamBStreak = consecutiveGames[teamB?.id] || 0;

  // Waiting team (if 3 or more teams)
  const waitingTeams = teams.filter((_, idx) => idx !== teamAIndex && idx !== teamBIndex);

  // Timer tick & 10-minute auto-termination
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundEffects.playWhistle();
      // Auto end match due to 10 minutes timeout
      handleEndMatchByRule('time_out', scoreA, scoreB, currentMatchGoals);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, scoreA, scoreB, currentMatchGoals]);

  if (teams.length < 2) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto my-8">
        <Trophy className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">Nenhum time sorteado ainda</h3>
        <p className="text-xs text-slate-400">
          Acesse a aba <strong>Sorteio</strong> e clique em <em>Realizar Sorteio Inteligente</em> para gerar as equipes da pelada de terça!
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleTimer = () => {
    if (!isRunning) {
      soundEffects.playWhistle();
    }
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(DEFAULT_DURATION);
  };

  const handleAddMinute = () => {
    setTimeLeft((prev) => prev + 60);
    soundEffects.playTap();
  };

  const handleOpenGoalPicker = (teamSide: 'A' | 'B') => {
    setPendingTeamForGoal(teamSide);
    setIsScorerPickerOpen(true);
  };

  // Rule execution when 3 goals are hit, 10 min expires, or manual end
  const handleEndMatchByRule = (
    reason: 'three_goals' | 'time_out' | 'manual',
    finalScoreA: number,
    finalScoreB: number,
    goalsList: typeof currentMatchGoals
  ) => {
    setIsRunning(false);
    soundEffects.playWhistle();

    const finishedMatch: Match = {
      id: `match-${Date.now()}`,
      matchNumber: matches.length + 1,
      teamAId: teamA.id,
      teamBId: teamB.id,
      scoreA: finalScoreA,
      scoreB: finalScoreB,
      goals: goalsList,
      completed: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 10,
    };

    onFinishMatch(finishedMatch);

    // Calculate next rotation using the strict 2-consecutive-match rule:
    // "o time que jogou duas partidas seguintes sai, mesmo que tenha ganhado as duas"
    const gamesPlayedA = teamAStreak + 1;
    const gamesPlayedB = teamBStreak + 1;

    let nextAIdx = teamAIndex;
    let nextBIdx = teamBIndex;
    let rotationMsg = '';
    let winnerName: string | null = null;
    const nextStreakMap: Record<string, number> = { ...consecutiveGames };

    if (teams.length >= 3) {
      const waitingIdx = teams.findIndex((_, idx) => idx !== teamAIndex && idx !== teamBIndex);

      if (finalScoreA > finalScoreB) {
        winnerName = teamA.name;
        if (gamesPlayedA >= 2) {
          // Team A won, BUT completed 2 consecutive matches -> MUST LEAVE!
          nextAIdx = teamBIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamA.id] = 0; // Goes to bench
          nextStreakMap[teamB.id] = 1; // Team B plays next
          nextStreakMap[teams[waitingIdx].id] = 0;
          rotationMsg = `${teamA.name} venceu, mas completou 2 partidas seguidas e sai pelo rodízio! O time que estava na fila entra para jogar contra ${teamB.name}.`;
        } else {
          // Team A stays (now has played 1 consecutive)
          nextAIdx = teamAIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamA.id] = 1;
          nextStreakMap[teamB.id] = 0; // Loser leaves
          nextStreakMap[teams[waitingIdx].id] = 0;
          rotationMsg = `${teamA.name} venceu e continua na quadra (1ª vitóriáseguida). Entra ${teams[waitingIdx].name}!`;
        }
      } else if (finalScoreB > finalScoreA) {
        winnerName = teamB.name;
        if (gamesPlayedB >= 2) {
          // Team B won, BUT completed 2 consecutive matches -> MUST LEAVE!
          nextAIdx = teamAIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamB.id] = 0; // Goes to bench
          nextStreakMap[teamA.id] = 1; // Team A plays next
          nextStreakMap[teams[waitingIdx].id] = 0;
          rotationMsg = `${teamB.name} venceu, mas completou 2 partidas seguidas e sai pelo rodízio! O time da fila entra para jogar contra ${teamA.name}.`;
        } else {
          // Team B stays
          nextAIdx = teamBIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamB.id] = 1;
          nextStreakMap[teamA.id] = 0; // Loser leaves
          nextStreakMap[teams[waitingIdx].id] = 0;
          rotationMsg = `${teamB.name} venceu e continua na quadra (1ª vitóriáseguida). Entra ${teams[waitingIdx].name}!`;
        }
      } else {
        // Draw (Empate)
        winnerName = null;
        if (gamesPlayedA >= 2) {
          // Team A must leave
          nextAIdx = teamBIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamA.id] = 0;
          nextStreakMap[teamB.id] = 1;
          rotationMsg = `Empate! ${teamA.name} completou 2 partidas seguidas e cede a vez pelo rodízio. Entra ${teams[waitingIdx].name}!`;
        } else if (gamesPlayedB >= 2) {
          // Team B must leave
          nextAIdx = teamAIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamB.id] = 0;
          nextStreakMap[teamA.id] = 1;
          rotationMsg = `Empate! ${teamB.name} completou 2 partidas seguidas e cede a vez pelo rodízio. Entra ${teams[waitingIdx].name}!`;
        } else {
          // Neither reached 2: challenger/defender stays
          nextAIdx = teamAIndex;
          nextBIdx = waitingIdx;
          nextStreakMap[teamA.id] = 1;
          nextStreakMap[teamB.id] = 0;
          rotationMsg = `Empate! Pelo critério da pelada, ${teamA.name} permanece e ${teams[waitingIdx].name} entra na partida.`;
        }
      }
    }

    setConsecutiveGames(nextStreakMap);

    // Show Match End Modal
    setMatchEndInfo({
      isOpen: true,
      reason,
      winnerName,
      finalScoreA,
      finalScoreB,
      rotationMessage: rotationMsg,
      nextTeamAName: teams[nextAIdx]?.name || 'Time A',
      nextTeamBName: teams[nextBIdx]?.name || 'Time B',
    });

    // Store pending next indices to apply when user clicks "Iniciar Próxima Partida"
    setPendingNextIndices({ a: nextAIdx, b: nextBIdx });
  };

  const [pendingNextIndices, setPendingNextIndices] = useState<{ a: number; b: number } | null>(null);

  const handleAdvanceToNextMatch = () => {
    if (pendingNextIndices) {
      setTeamAIndex(pendingNextIndices.a);
      setTeamBIndex(pendingNextIndices.b);
      setPendingNextIndices(null);
    }
    setScoreA(0);
    setScoreB(0);
    setCurrentMatchGoals([]);
    setTimeLeft(DEFAULT_DURATION);
    setIsRunning(false);
    setMatchEndInfo(null);
    soundEffects.playTap();
  };

  const handleRegisterGoal = (player: Player) => {
    soundEffects.playGoal();
    const minute = Math.ceil((DEFAULT_DURATION - timeLeft) / 60) || 1;
    const targetTeam = pendingTeamForGoal === 'A' ? teamA : teamB;

    const newScoreA = pendingTeamForGoal === 'A' ? scoreA + 1 : scoreA;
    const newScoreB = pendingTeamForGoal === 'B' ? scoreB + 1 : scoreB;

    const updatedGoals = [
      ...currentMatchGoals,
      {
        id: `goal-${Date.now()}`,
        playerId: player.id,
        playerName: player.nickname || player.name,
        teamId: targetTeam.id,
        minute,
      },
    ];

    setScoreA(newScoreA);
    setScoreB(newScoreB);
    setCurrentMatchGoals(updatedGoals);
    onUpdateScorer(player.id);
    setIsScorerPickerOpen(false);

    // CHECK STRICT 3-GOAL CAP: "ao um time fazer 3 gols, o jogo já se encerre"
    if (newScoreA >= 3 || newScoreB >= 3) {
      handleEndMatchByRule('three_goals', newScoreA, newScoreB, updatedGoals);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Rules Indicator Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/20 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-300">
          <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Regras da Pelada de Terça:</strong> ⏱️ 10 minutos OU ⚽ 3 gols encerram a partida.
          </span>
        </div>
        <div className="text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>Máximo de 2 jogos seguidos: quem jogar 2 sai obrigatoriamente, mesmo se vencer!</span>
        </div>
      </div>

      {/* 1. Digital Stadium Clock & Match Center */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Pitch line styling */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-800/40 pointer-events-none" />

        {/* Top: Round counter & Timer */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
            Partida #{matches.length + 1} · Tempo Regulamentar (10 Min)
          </span>

          <div className="font-mono text-5xl sm:text-6xl font-black tracking-tight text-white tabular-nums drop-shadow-md">
            {formatTime(timeLeft)}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleToggleTimer}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
                isRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isRunning ? 'Pausar' : 'Apitar Início'}</span>
            </button>

            <button
              onClick={handleAddMinute}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              +1 Min
            </button>

            <button
              onClick={handleResetTimer}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Placar ao Vivo (Team A vs Team B) com Indicador de Partidas Consecutivas */}
        <div className="grid grid-cols-5 items-center gap-2 sm:gap-4 max-w-xl mx-auto py-2">
          {/* Team A */}
          <div className="col-span-2 text-center space-y-2">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamA.colorHex }} />
                <h4 className="font-bold text-sm sm:text-base text-white truncate">{teamA.name}</h4>
              </div>

              {/* Consecutive Match Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  teamAStreak >= 1
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                {teamAStreak >= 1 ? '⚠️ 2ª partidáseguida (sai após)' : '1ª partida'}
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black font-mono text-white tabular-nums">
              {scoreA}
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setScoreA((prev) => Math.max(0, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 flex items-center justify-center text-sm cursor-pointer"
              >
                -
              </button>
              <button
                onClick={() => handleOpenGoalPicker('A')}
                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Gol!</span>
              </button>
            </div>
          </div>

          {/* VS Divider with 3-goal cap reminder */}
          <div className="col-span-1 text-center space-y-1">
            <div className="font-bold text-slate-500 text-sm font-mono">X</div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 block">
              3 Gols = Fim
            </span>
          </div>

          {/* Team B */}
          <div className="col-span-2 text-center space-y-2">
            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: teamB.colorHex }} />
                <h4 className="font-bold text-sm sm:text-base text-white truncate">{teamB.name}</h4>
              </div>

              {/* Consecutive Match Badge */}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  teamBStreak >= 1
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}
              >
                {teamBStreak >= 1 ? '⚠️ 2ª partidáseguida (sai após)' : '1ª partida'}
              </span>
            </div>

            <div className="text-4xl sm:text-5xl font-black font-mono text-white tabular-nums">
              {scoreB}
            </div>

            <div className="flex items-center justify-center gap-1">
              <button
                onClick={() => setScoreB((prev) => Math.max(0, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 flex items-center justify-center text-sm cursor-pointer"
              >
                -
              </button>
              <button
                onClick={() => handleOpenGoalPicker('B')}
                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 stroke-[3]" />
                <span>Gol!</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Goals Timeline */}
        {currentMatchGoals.length > 0 && (
          <div className="mt-5 pt-3 border-t border-slate-800/80 max-w-md mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-center">
              Gols da Partida
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {currentMatchGoals.map((g) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                >
                  <span>⚽ {g.playerName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({g.minute}')</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Manual End Match CTA */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-center">
          <button
            onClick={() => handleEndMatchByRule('manual', scoreA, scoreB, currentMatchGoals)}
            className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Encerrar Partida Manualmente</span>
          </button>
        </div>
      </section>

      {/* 3. Rodízio: Próximo time na fila */}
      {waitingTeams.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
              FILA
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                Próximo Time a Entrar na Quadra
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: waitingTeams[0].colorHex }} />
                <span className="text-sm font-bold text-white">{waitingTeams[0].name}</span>
                <span className="text-xs text-slate-400 font-mono">
                  (Média {waitingTeams[0].stats.avgOverall.toFixed(1)})
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            {waitingTeams.length} time(s) aguardando
          </div>
        </section>
      )}

      {/* 4. Histórico de Partidas Realizadas */}
      {matches.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Súmula de Partidas da Terça ({matches.length})</span>
          </h3>

          <div className="space-y-2">
            {matches.map((m) => {
              const tA = teams.find((t) => t.id === m.teamAId);
              const tB = teams.find((t) => t.id === m.teamBId);
              return (
                <div
                  key={m.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 font-bold">#{m.matchNumber}</span>
                    <span className="text-slate-400 text-[11px]">{m.timestamp}</span>
                  </div>

                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-slate-200">{tA?.name || 'Time A'}</span>
                    <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 bg-slate-900 rounded">
                      {m.scoreA} x {m.scoreB}
                    </span>
                    <span className="text-slate-200">{tB?.name || 'Time B'}</span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    {m.scoreA >= 3 || m.scoreB >= 3 ? '⚽ 3 Gols' : '⏱️ 10 Min'}
                  </div>
                </div>
              );
            })}
          </div>

          {onGoToVoting && (
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <div className="text-xs text-slate-300">
                <span className="font-bold text-white block">Partidas da Terça Concluídas?</span>
                Abra a cédula das notas da rodada para que cada jogador confirme seus votos com senha.
              </div>
              <button
                type="button"
                onClick={onGoToVoting}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-2 shrink-0"
              >
                <Award className="w-4 h-4" />
                <span>Ir para Notas da Rodada</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* Scorer Picker Modal */}
      {isScorerPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h4 className="font-bold text-white text-sm">
              Quem marcou o gol para o {pendingTeamForGoal === 'A' ? teamA.name : teamB.name}?
            </h4>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {(pendingTeamForGoal === 'A' ? teamA : teamB).players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleRegisterGoal(p)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left text-xs text-white transition-colors cursor-pointer"
                >
                  <p className="font-semibold truncate">{p.nickname || p.name}</p>
                  <p className="text-[10px] text-slate-400">{p.primaryPosition}</p>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsScorerPickerOpen(false)}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Match Over / Rotation Enforcement Modal */}
      {matchEndInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              {matchEndInfo.reason === 'three_goals' ? (
                <Trophy className="w-8 h-8 text-amber-400" />
              ) : (
                <Clock className="w-8 h-8 text-emerald-400" />
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                {matchEndInfo.reason === 'three_goals'
                  ? '⚽ FIM DE JOGO: REGRA DOS 3 GOLS!'
                  : matchEndInfo.reason === 'time_out'
                  ? '⏱️ FIM DE JOGO: 10 MINUTOS ESGOTADOS!'
                  : 'FIM DE JOGO!'}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                {teamA.name} {matchEndInfo.finalScoreA} x {matchEndInfo.finalScoreB} {teamB.name}
              </h3>
            </div>

            {/* Rotation Rule Explanation */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Aplicação do Rodízio da Pelada:</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {matchEndInfo.rotationMessage}
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Próximo Jogo:</span>
                <span className="font-bold text-emerald-400">
                  {matchEndInfo.nextTeamAName} vs {matchEndInfo.nextTeamBName}
                </span>
              </div>
            </div>

            <button
              onClick={handleAdvanceToNextMatch}
              className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-400/20 active:scale-95 cursor-pointer"
            >
              Iniciar Próxima Partida
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
