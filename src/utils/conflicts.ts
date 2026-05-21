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
      // Use denormalized playerIds if available, otherwise fall back to players array
      const pitchIds = lineup.playerIds ?? (lineup.players || []).map((p) => p.playerId);
      for (const id of pitchIds) {
        conflicting.add(id);
      }
      for (const benchId of (lineup.bench || [])) {
        conflicting.add(benchId);
      }
    }
  }

  return conflicting;
}
