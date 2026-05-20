import type { Match, Lineup } from '../types';

/**
 * Checks if two matches overlap in time (same day, overlapping time ranges).
 */
export function matchesOverlap(a: Match, b: Match): boolean {
  if (a.date !== b.date) return false;
  // Time comparison as strings works for HH:mm format
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

/**
 * Returns player IDs that are already assigned to lineups of overlapping matches.
 */
export function getConflictingPlayerIds(
  currentMatch: Match,
  allMatches: Match[],
  allLineups: Lineup[]
): Set<string> {
  const conflicting = new Set<string>();

  const overlappingMatchIds = allMatches
    .filter((m) => m.id !== currentMatch.id && matchesOverlap(m, currentMatch))
    .map((m) => m.id);

  for (const lineup of allLineups) {
    if (overlappingMatchIds.includes(lineup.matchId)) {
      for (const lp of lineup.players) {
        conflicting.add(lp.playerId);
      }
      for (const benchId of lineup.bench) {
        conflicting.add(benchId);
      }
    }
  }

  return conflicting;
}
