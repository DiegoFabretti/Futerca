import React, { useState, useEffect } from 'react';
import { Player, Team, Match, BalanceResult, PlayerStatus, AppUser, WeeklyVotingSession, SingleRating } from './types/football';
import { INITIAL_PLAYERS } from './data/defaultPlayers';
import { balanceTeams, manualSwapPlayers } from './utils/balancer';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DrawSection } from './components/DrawSection';
import { PlayersSection } from './components/PlayersSection';
import { MatchSection } from './components/MatchSection';
import { StatsSection } from './components/StatsSection';
import { VotingSection } from './components/VotingSection';
import { PlayerModal } from './components/PlayerModal';
import { SwapPlayerModal } from './components/SwapPlayerModal';
import { AlgorithmExplainerModal } from './components/AlgorithmExplainerModal';
import { getCurrentQuarter, getQuarterLabel, calculateWeightedRating } from './utils/quarterCycle';
import { votingService, LoggedPlayerInfo } from './services/votingService';
import { Position } from './types/football';

const STORAGE_KEY_PLAYERS = 'futebol_terca_players_v6';
const STORAGE_KEY_TEAMS = 'futebol_terca_teams_v6';
const STORAGE_KEY_MATCHES = 'futebol_terca_matches_v6';
const STORAGE_KEY_BALANCE = 'futebol_terca_balance_v6';

export default function App() {
  const [activeTab, setActiveTab] = useState<'draw' | 'players' | 'matches' | 'stats' | 'voting'>('draw');
  const [loggedPlayer, setLoggedPlayer] = useState<LoggedPlayerInfo | null>(() => votingService.getLoggedInPlayer());

  // Core State with LocalStorage Lazy Initialization
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PLAYERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return INITIAL_PLAYERS;
  });

  const [attemptCount, setAttemptCount] = useState<number>(1);

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    const fixed = INITIAL_PLAYERS.filter((p) => p.status === 'fixed');
    const initialDraw = balanceTeams(fixed, 3, 1);
    return initialDraw.teams;
  });

  const [balanceResult, setBalanceResult] = useState<BalanceResult | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BALANCE);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    const fixed = INITIAL_PLAYERS.filter((p) => p.status === 'fixed');
    return balanceTeams(fixed, 3, 1);
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MATCHES);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Modals state
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [swapInitialPlayer, setSwapInitialPlayer] = useState<Player | null>(null);

  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isPostMatchRatingOpen, setIsPostMatchRatingOpen] = useState(false);

  // Auth & Weekly Voting State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => votingService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [votingSession, setVotingSession] = useState<WeeklyVotingSession | null>(null);
  const [systemToast, setSystemToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'info') => {
    setSystemToast({ message, type });
    setTimeout(() => setSystemToast(null), 4500);
  };

  useEffect(() => {
    votingService.getCurrentSession().then(setVotingSession).catch(console.error);
  }, []);

  const handleToggleVotingSession = async () => {
    if (!votingSession) return;
    const updated = await votingService.toggleSessionOpen(votingSession.weekId, !votingSession.isOpen);
    setVotingSession(updated);
  };

  const handleStartNewRound = async (managerPassword: string): Promise<WeeklyVotingSession> => {
    const newSession = await votingService.startNewRound(managerPassword);
    setVotingSession(newSession);
    return newSession;
  };

  const handleLogout = () => {
    votingService.logout();
    setCurrentUser(null);
    setLoggedPlayer(null);
  };

  const handleApplyAnonymousSessionAverages = (updatedSession: WeeklyVotingSession) => {
    const currentQ = getCurrentQuarter();
    const today = updatedSession.date || new Date().toISOString().split('T')[0];

    setPlayers((prev) => {
      const updated = prev.map((p) => {
        const stats = votingService.calculatePlayerRoundAverage(p.id, updatedSession);
        if (stats.average !== null) {
          const existingRatings = p.ratings || [];
          const filtered = existingRatings.filter((r) => r.date !== today);
          const newRatingItem: SingleRating = {
            id: `r-anon-${today}-${p.id}`,
            date: today,
            score: stats.average,
            quarter: currentQ,
            note: `Média anônima (${stats.count} votos)`,
          };
          const newRatingsList = [newRatingItem, ...filtered];
          const { currentRating, quarterRating, summaries } = calculateWeightedRating(newRatingsList, currentQ);
          return {
            ...p,
            currentRating,
            quarterRating,
            ratings: newRatingsList,
            quarterlyHistory: summaries,
          };
        }
        return p;
      });

      const fixed = updated.filter((p) => p.status === 'fixed');
      if (fixed.length === 18) {
        const res = balanceTeams(fixed, 3, attemptCount);
        setTeams(res.teams);
        setBalanceResult(res);
      }
      return updated;
    });
  };

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.error(e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error(e);
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BALANCE, JSON.stringify(balanceResult));
    } catch (e) {
      console.error(e);
    }
  }, [balanceResult]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MATCHES, JSON.stringify(matches));
    } catch (e) {
      console.error(e);
    }
  }, [matches]);

  // Quotas & Counts
  const fixedPlayers = players.filter((p) => p.status === 'fixed');
  const benchPlayers = players.filter((p) => p.status === 'bench');

  // Change player status with strict 18 fixed limit enforcement
  const handleTogglePlayerStatus = (playerId: string, newStatus: PlayerStatus) => {
    if (newStatus === 'fixed' && fixedPlayers.length >= 18) {
      const target = players.find((p) => p.id === playerId);
      if (target?.status !== 'fixed') {
        showToast('Limite atingido! O elenco já possui exatamente 18 jogadores fixos para a rodada. Substitua um desfalque existente para liberar a vaga.', 'error');
        return;
      }
    }

    setPlayers((prev) => {
      const currentBench = prev.filter((p) => p.status === 'bench' && p.id !== playerId);
      return prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            status: newStatus,
            confirmed: newStatus === 'fixed',
            benchOrder: newStatus === 'bench' ? currentBench.length + 1 : undefined,
          };
        }
        return p;
      });
    });
  };

  // Promote a bench player into the 18 fixed starters (optionally replacing a desfalque)
  const handlePromoteBenchToFixed = (benchPlayerId: string, replacePlayerId?: string) => {
    setPlayers((prev) => {
      const updated = prev.map((p) => {
        if (p.id === benchPlayerId) {
          return { ...p, status: 'fixed' as const, confirmed: true, benchOrder: undefined };
        }
        if (replacePlayerId && p.id === replacePlayerId) {
          return { ...p, status: 'absent' as const, confirmed: false };
        }
        return p;
      });

      // Automatically re-draw 3 teams of 6 with the updated 18 fixed players
      const newFixed = updated.filter((p) => p.status === 'fixed');
      if (newFixed.length === 18) {
        const nextAttempt = attemptCount + 1;
        setAttemptCount(nextAttempt);
        const res = balanceTeams(newFixed, 3, nextAttempt);
        setTeams(res.teams);
        setBalanceResult(res);
      }

      return updated;
    });
  };

  // Add an existing registered player to the waitlist (bench)
  const handleAddToBench = (playerId: string) => {
    setPlayers((prev) => {
      const currentBench = prev.filter((p) => p.status === 'bench' && p.id !== playerId);
      return prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            status: 'bench' as const,
            confirmed: false,
            benchOrder: currentBench.length + 1,
          };
        }
        return p;
      });
    });
  };

  // Remove a player from the waitlist (bench) and re-index remaining (1, 2, 3...)
  const handleRemoveFromBench = (playerId: string) => {
    setPlayers((prev) => {
      const remainingBench = prev
        .filter((p) => p.status === 'bench' && p.id !== playerId)
        .sort((a, b) => (a.benchOrder || 99) - (b.benchOrder || 99));

      const newBenchOrderMap = new Map<string, number>();
      remainingBench.forEach((p, idx) => {
        newBenchOrderMap.set(p.id, idx + 1);
      });

      return prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            status: 'absent' as const,
            confirmed: false,
            benchOrder: undefined,
          };
        }
        if (p.status === 'bench') {
          return {
            ...p,
            benchOrder: newBenchOrderMap.get(p.id) || 1,
          };
        }
        return p;
      });
    });
  };

  // Move a fixed player to the waitlist
  const handleMoveFixedToBench = (playerId: string) => {
    setPlayers((prev) => {
      const currentBench = prev.filter((p) => p.status === 'bench');
      return prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            status: 'bench' as const,
            confirmed: false,
            benchOrder: currentBench.length + 1,
          };
        }
        return p;
      });
    });
  };

  // Quick create a new guest/player directly into the waitlist
  const handleQuickCreateBenchPlayer = (name: string, primaryPosition: Position, rating: number) => {
    const currentQ = getCurrentQuarter();
    const currentBench = players.filter((p) => p.status === 'bench');

    const colors = [
      'from-emerald-500 to-teal-700',
      'from-blue-600 to-cyan-800',
      'from-rose-500 to-red-700',
      'from-amber-500 to-orange-700',
      'from-purple-600 to-indigo-800',
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPlayer: Player = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      primaryPosition,
      currentRating: rating,
      quarterRating: rating,
      ratings: [
        {
          id: `r-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          score: rating,
          quarter: currentQ,
          note: 'Cadastro rápido como Suplente',
        },
      ],
      quarterlyHistory: [
        {
          quarter: currentQ,
          label: getQuarterLabel(currentQ),
          avgScore: rating,
          count: 1,
        },
      ],
      status: 'bench',
      benchOrder: currentBench.length + 1,
      confirmed: false,
      preferredFoot: 'Destro',
      avatarColor: randomColor,
      goals: 0,
      matchesPlayed: 0,
    };

    setPlayers((prev) => [newPlayer, ...prev]);
  };

  // Perform Draw or Re-draw (Free / unlimited attempts)
  const handlePerformDraw = (isReDraw: boolean = false) => {
    const fixed = players.filter((p) => p.status === 'fixed');
    if (fixed.length !== 18) {
      showToast(`O sorteio requer exatamente 18 jogadores fixos para formar 3 times de 6 (atualmente há ${fixed.length}).`, 'error');
      return;
    }

    const nextAttempt = isReDraw ? attemptCount + 1 : 1;
    setAttemptCount(nextAttempt);

    const res = balanceTeams(fixed, 3, nextAttempt);
    setTeams(res.teams);
    setBalanceResult(res);
  };

  // Batch Post-Match Ratings (Single overall rating per player)
  const handleSaveBatchRatings = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);

    // Recalculate drawn teams with new scores
    const fixed = updatedPlayers.filter((p) => p.status === 'fixed');
    if (fixed.length === 18) {
      const res = balanceTeams(fixed, 3, attemptCount);
      setTeams(res.teams);
      setBalanceResult(res);
    }
  };

  // Player CRUD
  const handleSavePlayer = (player: Player) => {
    setPlayers((prev) => {
      const exists = prev.some((p) => p.id === player.id);
      if (exists) {
        return prev.map((p) => (p.id === player.id ? player : p));
      }
      return [player, ...prev];
    });

    setTeams((prevTeams) =>
      prevTeams.map((t) => ({
        ...t,
        players: t.players.map((p) => (p.id === player.id ? player : p)),
      }))
    );
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setTeams((prevTeams) =>
      prevTeams.map((t) => ({
        ...t,
        players: t.players.filter((p) => p.id !== playerId),
      }))
    );
  };

  // Swap Players Handlers
  const handleOpenSwapModal = (player?: Player) => {
    setSwapInitialPlayer(player || null);
    setIsSwapModalOpen(true);
  };

  const handleExecuteSwap = (playerAId: string, playerBId: string) => {
    const updated = manualSwapPlayers(teams, playerAId, playerBId);
    setTeams(updated);
  };

  // Match and Scorer Handlers
  const handleFinishMatch = (newMatch: Match) => {
    setMatches((prev) => [newMatch, ...prev]);

    const teamA = teams.find((t) => t.id === newMatch.teamAId);
    const teamB = teams.find((t) => t.id === newMatch.teamBId);
    const participantIds = new Set([
      ...(teamA?.players.map((p) => p.id) || []),
      ...(teamB?.players.map((p) => p.id) || []),
    ]);

    setPlayers((prev) =>
      prev.map((p) =>
        participantIds.has(p.id) ? { ...p, matchesPlayed: p.matchesPlayed + 1 } : p
      )
    );
  };

  const handleUpdateScorer = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, goals: p.goals + 1 } : p))
    );
  };

  // Reset & Import
  const handleResetToDefaults = () => {
    setPlayers(INITIAL_PLAYERS);
    const fixed = INITIAL_PLAYERS.filter((p) => p.status === 'fixed');
    const initialDraw = balanceTeams(fixed, 3, 1);
    setTeams(initialDraw.teams);
    setBalanceResult(initialDraw);
    setMatches([]);
    setAttemptCount(1);
  };

  const handleImportData = (data: { players: Player[]; matches: Match[]; teams: Team[] }) => {
    if (data.players) setPlayers(data.players);
    if (data.teams) setTeams(data.teams);
    if (data.matches) setMatches(data.matches);
  };

  return (
    <div className="min-h-screen bg-[#0b131b] text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Navigation Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewPlayerModal={() => {
          setPlayerToEdit(null);
          setIsPlayerModalOpen(true);
        }}
        fixedCount={fixedPlayers.length}
        benchCount={benchPlayers.length}
        currentUser={currentUser}
        loggedPlayer={loggedPlayer}
        onLogout={handleLogout}
        session={votingSession}
        onToggleVotingSession={handleToggleVotingSession}
      />

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        {systemToast && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in ${
              systemToast.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
            }`}
          >
            <span>{systemToast.message}</span>
            <button
              type="button"
              onClick={() => setSystemToast(null)}
              className="text-slate-400 hover:text-white px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === 'draw' && (
          <DrawSection
            players={players}
            teams={teams}
            balanceResult={balanceResult}
            onTogglePlayerStatus={handleTogglePlayerStatus}
            onPromoteBenchToFixed={handlePromoteBenchToFixed}
            onAddToBench={handleAddToBench}
            onRemoveFromBench={handleRemoveFromBench}
            onMoveFixedToBench={handleMoveFixedToBench}
            onQuickCreateBenchPlayer={handleQuickCreateBenchPlayer}
            onPerformDraw={handlePerformDraw}
            onOpenExplainer={() => setIsExplainerOpen(true)}
            onOpenSwapModal={handleOpenSwapModal}
            onStartMatchesWithTeams={() => setActiveTab('matches')}
            onOpenEditPlayer={(p) => {
              setPlayerToEdit(p);
              setIsPlayerModalOpen(true);
            }}
            onOpenPostMatchRating={() => setActiveTab('voting')}
          />
        )}

        {activeTab === 'voting' && (
          <VotingSection
            players={players}
            session={votingSession}
            onSessionUpdated={(updatedSession) => {
              setVotingSession(updatedSession);
              handleApplyAnonymousSessionAverages(updatedSession);
            }}
            onStartNewRound={handleStartNewRound}
          />
        )}

        {activeTab === 'players' && (
          <PlayersSection
            players={players}
            onOpenEditPlayer={(p) => {
              setPlayerToEdit(p);
              setIsPlayerModalOpen(true);
            }}
            onOpenNewPlayerModal={() => {
              setPlayerToEdit(null);
              setIsPlayerModalOpen(true);
            }}
            onTogglePlayerStatus={handleTogglePlayerStatus}
            onNavigateToVoting={() => setActiveTab('voting')}
            onDeletePlayer={handleDeletePlayer}
            session={votingSession}
          />
        )}

        {activeTab === 'matches' && (
          <MatchSection
            teams={teams}
            matches={matches}
            onFinishMatch={handleFinishMatch}
            onUpdateScorer={handleUpdateScorer}
            onGoToVoting={() => setActiveTab('voting')}
          />
        )}

        {activeTab === 'stats' && (
          <StatsSection
            teams={teams}
            matches={matches}
            players={players}
            onResetToDefaults={handleResetToDefaults}
            onImportData={handleImportData}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        onSavePlayer={handleSavePlayer}
        onDeletePlayer={handleDeletePlayer}
        playerToEdit={playerToEdit}
      />

      <SwapPlayerModal
        isOpen={isSwapModalOpen}
        onClose={() => setIsSwapModalOpen(false)}
        teams={teams}
        initialPlayerA={swapInitialPlayer}
        onSwap={handleExecuteSwap}
      />

      <AlgorithmExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
      />
    </div>
  );
}
