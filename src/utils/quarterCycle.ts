import { Player, SingleRating, QuarterSummary } from '../types/football';

/**
 * Returns current quarter key, e.g. "2026-T4"
 */
export function getCurrentQuarter(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 to 11
  const q = Math.floor(month / 3) + 1;
  return `${year}-T${q}`;
}

export function getQuarterLabel(quarterKey: string): string {
  const parts = quarterKey.split('-');
  if (parts.length < 2) return quarterKey;
  const year = parts[0];
  const q = parts[1]; // T1, T2, T3, T4
  const map: Record<string, string> = {
    T1: '1º Trimestre (Jan - Mar)',
    T2: '2º Trimestre (Abr - Jun)',
    T3: '3º Trimestre (Jul - Set)',
    T4: '4º Trimestre (Out - Dez)',
  };
  return `${map[q] || q} / ${year}`;
}

export function getPreviousQuarter(quarterKey: string): string {
  const [yearStr, qStr] = quarterKey.split('-');
  const year = parseInt(yearStr, 10);
  const qNum = parseInt(qStr.replace('T', ''), 10);

  if (qNum === 1) {
    return `${year - 1}-T4`;
  }
  return `${year}-T${qNum - 1}`;
}

/**
 * Dynamic Quarterly Weighted Rating:
 * To prevent ratings from staying "frozen forever", ratings give heavy weight (70%)
 * to the current quarter's matches, with 30% carryover from the previous quarter.
 * Older games (> 6 months) naturally retire, rewarding current form!
 */
export function calculateWeightedRating(
  ratings: SingleRating[],
  activeQuarter: string = getCurrentQuarter()
): { currentRating: number; quarterRating: number; summaries: QuarterSummary[] } {
  if (ratings.length === 0) {
    return { currentRating: 7.0, quarterRating: 7.0, summaries: [] };
  }

  const prevQuarter = getPreviousQuarter(activeQuarter);

  // Group ratings by quarter
  const quarterGroups: Record<string, number[]> = {};
  for (const r of ratings) {
    const q = r.quarter || getCurrentQuarter(new Date(r.date));
    if (!quarterGroups[q]) quarterGroups[q] = [];
    quarterGroups[q].push(r.score);
  }

  const currentScores = quarterGroups[activeQuarter] || [];
  const prevScores = quarterGroups[prevQuarter] || [];

  const currentAvg =
    currentScores.length > 0
      ? currentScores.reduce((a, b) => a + b, 0) / currentScores.length
      : null;

  const prevAvg =
    prevScores.length > 0
      ? prevScores.reduce((a, b) => a + b, 0) / prevScores.length
      : null;

  let weighted = 7.0;

  if (currentAvg !== null && prevAvg !== null) {
    // 70% current quarter form + 30% previous quarter carryover
    weighted = currentAvg * 0.7 + prevAvg * 0.3;
  } else if (currentAvg !== null) {
    weighted = currentAvg;
  } else if (prevAvg !== null) {
    weighted = prevAvg;
  } else {
    // Fallback to average of all ratings
    weighted = ratings.reduce((a, b) => a + b.score, 0) / ratings.length;
  }

  // Build quarterly history list
  const summaries: QuarterSummary[] = Object.keys(quarterGroups)
    .sort()
    .reverse()
    .map((qKey) => {
      const arr = quarterGroups[qKey];
      return {
        quarter: qKey,
        label: getQuarterLabel(qKey),
        avgScore: Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)),
        count: arr.length,
      };
    });

  return {
    currentRating: Number(weighted.toFixed(1)),
    quarterRating: Number((currentAvg ?? weighted).toFixed(1)),
    summaries,
  };
}
