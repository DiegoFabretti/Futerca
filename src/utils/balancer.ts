import { Player, Position, Team, TeamStats, BalanceResult } from '../types/football';
import { TEAM_COLORS_PRESETS } from '../data/defaultPlayers';

/**
 * Calculates real-time team stats:
 * - avgOverall: Average skill rating of the squad (using currentRating from quarterly cycle)
 * - positionCounts: Breakdown of GOL, ZAG, MEI, ATA
 */
export function calculateTeamStats(players: Player[]): TeamStats {
  const counts: Record<Position, number> = {
    GOL: 0,
    ZAG: 0,
    MEI: 0,
    ATA: 0,
  };

  if (players.length === 0) {
    return {
      avgOverall: 0,
      playerCount: 0,
      positionCounts: counts,
    };
  }

  let totalOverall = 0;

  for (const p of players) {
    counts[p.primaryPosition] = (counts[p.primaryPosition] || 0) + 1;
    totalOverall += p.currentRating;
  }

  const n = players.length;
  return {
    avgOverall: Number((totalOverall / n).toFixed(2)),
    playerCount: n,
    positionCounts: counts,
  };
}

/**
 * Sorteio Inteligente dos 18 Fixos em 3 Times de 6:
 * 
 * 1. POOTING POSICIONAL: Separa os 18 atletas em potes táticos (GOL, ZAG, MEI, ATA) ordenados pela nota geral única (currentRating).
 * 2. GOLEIROS PRIMEIRO: 1 Goleiro titular em cada um dos 3 times.
 * 3. DRAFT GULOSO POSICIONAL: Aloca Zagueiros, Meias e Atacantes equilibrando carência posicional e média técnica.
 * 4. RE-SORTEIO LIVRE: Quando o usuário re-sorteia (attemptNumber > 1), pequenas permutações estocásticas
 *    entre atletas da mesma posição com notas próximas geram novas opções táticas sem quebrar o equilíbrio.
 * 5. OTIMIZAÇÃO POR TROCAS 2-OPT: Executa até 120 iterações de teste de trocas 1-a-1 na mesma posição para
 *    minimizar a variância das médias entre os 3 times.
 */
export function balanceTeams(
  confirmedPlayers: Player[],
  numTeams: number = 3,
  attemptNumber: number = 1
): BalanceResult {
  if (confirmedPlayers.length === 0) {
    return {
      teams: [],
      attemptNumber,
      fairnessScore: 100,
      maxDelta: 0,
      variance: 0,
      distributionSummary: { gksPerTeam: 0, defPerTeam: 0, midPerTeam: 0, atkPerTeam: 0 },
    };
  }

  const actualNumTeams = Math.min(numTeams, confirmedPlayers.length);

  // Initialize the 3 team structures
  const teams: Team[] = Array.from({ length: actualNumTeams }, (_, idx) => {
    const preset = TEAM_COLORS_PRESETS[idx % TEAM_COLORS_PRESETS.length];
    return {
      id: `team-${idx + 1}`,
      name: `Time ${idx + 1} (${preset.name.replace('Colete ', '')})`,
      colorName: preset.name,
      colorHex: preset.hex,
      badgeBg: preset.badgeBg,
      textColor: preset.textColor,
      players: [],
      stats: {
        avgOverall: 0,
        playerCount: 0,
        positionCounts: { GOL: 0, ZAG: 0, MEI: 0, ATA: 0 },
      },
    };
  });

  // Strict capacity: 18 players / 3 teams = 6 players per team
  const targetPerTeam = Math.ceil(confirmedPlayers.length / actualNumTeams);

  // Sorting helper: on re-attempts (> 1), allow light tie-break shuffling among close players
  const sortGroup = (arr: Player[]) => {
    return [...arr].sort((a, b) => {
      const scoreA = a.currentRating;
      const scoreB = b.currentRating;
      if (attemptNumber > 1 && Math.abs(scoreA - scoreB) <= 0.35) {
        return Math.random() - 0.5;
      }
      return scoreB - scoreA;
    });
  };

  // 1. Positional Pots
  const gks = sortGroup(confirmedPlayers.filter((p) => p.primaryPosition === 'GOL'));
  const defs = sortGroup(confirmedPlayers.filter((p) => p.primaryPosition === 'ZAG'));
  const mids = sortGroup(confirmedPlayers.filter((p) => p.primaryPosition === 'MEI'));
  const atks = sortGroup(confirmedPlayers.filter((p) => p.primaryPosition === 'ATA'));

  // 2. Distribute Goalkeepers (1 per team)
  const startTeam = attemptNumber > 1 ? Math.floor(Math.random() * actualNumTeams) : 0;
  let teamPointer = startTeam;
  let direction = 1;

  for (const gk of gks) {
    teams[teamPointer].players.push(gk);
    teamPointer += direction;
    if (teamPointer >= actualNumTeams) {
      teamPointer = actualNumTeams - 1;
      direction = -1;
    } else if (teamPointer < 0) {
      teamPointer = 0;
      direction = 1;
    }
  }

  // 3. Assign positional groups
  const assignGroup = (group: Player[], pos: Position) => {
    for (const player of group) {
      let eligibleTeams = teams.filter((t) => t.players.length < targetPerTeam);
      if (eligibleTeams.length === 0) eligibleTeams = teams;

      // Min count for this position
      let minPosCount = Infinity;
      for (const t of eligibleTeams) {
        const count = t.players.filter((p) => p.primaryPosition === pos).length;
        if (count < minPosCount) minPosCount = count;
      }

      const candidateTeams = eligibleTeams.filter((t) => {
        const count = t.players.filter((p) => p.primaryPosition === pos).length;
        return count === minPosCount;
      });

      // Tiebreaker: lowest running average
      candidateTeams.sort((a, b) => {
        const avgA = a.players.length > 0
          ? a.players.reduce((sum, p) => sum + p.currentRating, 0) / a.players.length
          : 0;
        const avgB = b.players.length > 0
          ? b.players.reduce((sum, p) => sum + p.currentRating, 0) / b.players.length
          : 0;
        return avgA - avgB;
      });

      candidateTeams[0].players.push(player);
    }
  };

  assignGroup(defs, 'ZAG');
  assignGroup(atks, 'ATA');
  assignGroup(mids, 'MEI');

  // 4. Local Search Optimization (2-Opt Swaps)
  const evaluateVariance = (candidateTeams: Team[]) => {
    const avgs = candidateTeams.map((t) =>
      t.players.length > 0
        ? t.players.reduce((sum, p) => sum + p.currentRating, 0) / t.players.length
        : 0
    );
    const mean = avgs.reduce((a, b) => a + b, 0) / avgs.length;
    return avgs.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  };

  let bestVariance = evaluateVariance(teams);

  for (let iter = 0; iter < 120; iter++) {
    let improved = false;

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const teamA = teams[i];
        const teamB = teams[j];

        for (let pAIndex = 0; pAIndex < teamA.players.length; pAIndex++) {
          for (let pBIndex = 0; pBIndex < teamB.players.length; pBIndex++) {
            const pA = teamA.players[pAIndex];
            const pB = teamB.players[pBIndex];

            // Only swapósame primary position
            if (pA.primaryPosition === pB.primaryPosition && pA.id !== pB.id) {
              teamA.players[pAIndex] = pB;
              teamB.players[pBIndex] = pA;

              const testVariance = evaluateVariance(teams);

              if (testVariance < bestVariance - 0.0001) {
                bestVariance = testVariance;
                improved = true;
              } else {
                teamA.players[pAIndex] = pA;
                teamB.players[pBIndex] = pB;
              }
            }
          }
        }
      }
    }

    if (!improved) break;
  }

  // 5. Finalize stats
  for (const t of teams) {
    t.stats = calculateTeamStats(t.players);
  }

  const teamAvgs = teams.map((t) => t.stats.avgOverall);
  const minAvg = Math.min(...teamAvgs);
  const maxAvg = Math.max(...teamAvgs);
  const maxDelta = Number((maxAvg - minAvg).toFixed(2));
  const fairnessScore = Math.max(0, Math.min(100, Math.round(100 - maxDelta * 20)));

  return {
    teams,
    attemptNumber,
    fairnessScore,
    maxDelta,
    variance: Number(bestVariance.toFixed(4)),
    distributionSummary: {
      gksPerTeam: Number((gks.length / actualNumTeams).toFixed(1)),
      defPerTeam: Number((defs.length / actualNumTeams).toFixed(1)),
      midPerTeam: Number((mids.length / actualNumTeams).toFixed(1)),
      atkPerTeam: Number((atks.length / actualNumTeams).toFixed(1)),
    },
  };
}

/**
 * Manually swap two players between teams and re-calculate stats
 */
export function manualSwapPlayers(
  currentTeams: Team[],
  playerAId: string,
  playerBId: string
): Team[] {
  let foundA: { teamIdx: number; playerIdx: number; player: Player } | null = null;
  let foundB: { teamIdx: number; playerIdx: number; player: Player } | null = null;

  for (let tIdx = 0; tIdx < currentTeams.length; tIdx++) {
    const t = currentTeams[tIdx];
    for (let pIdx = 0; pIdx < t.players.length; pIdx++) {
      if (t.players[pIdx].id === playerAId) {
        foundA = { teamIdx: tIdx, playerIdx: pIdx, player: t.players[pIdx] };
      }
      if (t.players[pIdx].id === playerBId) {
        foundB = { teamIdx: tIdx, playerIdx: pIdx, player: t.players[pIdx] };
      }
    }
  }

  if (!foundA || !foundB) return currentTeams;

  const newTeams = currentTeams.map((t) => ({
    ...t,
    players: [...t.players],
  }));

  newTeams[foundA.teamIdx].players[foundA.playerIdx] = foundB.player;
  newTeams[foundB.teamIdx].players[foundB.playerIdx] = foundA.player;

  newTeams[foundA.teamIdx].stats = calculateTeamStats(newTeams[foundA.teamIdx].players);
  newTeams[foundB.teamIdx].stats = calculateTeamStats(newTeams[foundB.teamIdx].players);

  return newTeams;
}

export function getPositionBadge(position: Position): {
  label: string;
  fullName: string;
  badgeClass: string;
  dotColor: string;
} {
  switch (position) {
    case 'GOL':
      return {
        label: 'GOL',
        fullName: 'Goleiro',
        badgeClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
        dotColor: 'bg-amber-400',
      };
    case 'ZAG':
      return {
        label: 'ZAG',
        fullName: 'Zagueiro',
        badgeClass: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
        dotColor: 'bg-blue-400',
      };
    case 'MEI':
      return {
        label: 'MEI',
        fullName: 'Meio-campo',
        badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
        dotColor: 'bg-emerald-400',
      };
    case 'ATA':
      return {
        label: 'ATA',
        fullName: 'Atacante',
        badgeClass: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
        dotColor: 'bg-rose-400',
      };
  }
}
