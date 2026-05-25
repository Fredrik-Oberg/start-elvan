import { describe, it, expect } from 'vitest';
import { matchesOverlap, getConflictingPlayerIds } from '../utils/conflicts';
import type { Match, Lineup } from '../types';

describe('matchesOverlap', () => {
  it('returns false for matches on different days', () => {
    const a: Match = { id: '1', opponent: 'A', date: '2024-05-01', startTime: '10:00', endTime: '11:00', createdAt: 0, version: 1 };
    const b: Match = { id: '2', opponent: 'B', date: '2024-05-02', startTime: '10:00', endTime: '11:00', createdAt: 0, version: 1 };
    expect(matchesOverlap(a, b)).toBe(false);
  });

  it('returns true for matches on the same day with overlapping times', () => {
    const a: Match = { id: '1', opponent: 'A', date: '2024-05-01', startTime: '10:00', endTime: '11:30', createdAt: 0, version: 1 };
    const b: Match = { id: '2', opponent: 'B', date: '2024-05-01', startTime: '11:00', endTime: '12:00', createdAt: 0, version: 1 };
    expect(matchesOverlap(a, b)).toBe(true);
  });

  it('returns false for matches on the same day with non-overlapping times', () => {
    const a: Match = { id: '1', opponent: 'A', date: '2024-05-01', startTime: '10:00', endTime: '11:00', createdAt: 0, version: 1 };
    const b: Match = { id: '2', opponent: 'B', date: '2024-05-01', startTime: '11:00', endTime: '12:00', createdAt: 0, version: 1 };
    expect(matchesOverlap(a, b)).toBe(false);
  });

  it('returns true for fully contained match', () => {
    const a: Match = { id: '1', opponent: 'A', date: '2024-05-01', startTime: '09:00', endTime: '13:00', createdAt: 0, version: 1 };
    const b: Match = { id: '2', opponent: 'B', date: '2024-05-01', startTime: '10:00', endTime: '11:00', createdAt: 0, version: 1 };
    expect(matchesOverlap(a, b)).toBe(true);
  });
});

describe('getConflictingPlayerIds', () => {
  const currentMatch: Match = { id: 'm1', opponent: 'A', date: '2024-05-01', startTime: '10:00', endTime: '11:30', createdAt: 0, version: 1 };
  const overlappingMatch: Match = { id: 'm2', opponent: 'B', date: '2024-05-01', startTime: '11:00', endTime: '12:00', createdAt: 0, version: 1 };
  const nonOverlappingMatch: Match = { id: 'm3', opponent: 'C', date: '2024-05-02', startTime: '10:00', endTime: '11:00', createdAt: 0, version: 1 };

  it('returns player IDs from lineups of overlapping matches', () => {
    const allMatches = [currentMatch, overlappingMatch, nonOverlappingMatch];
    const allLineups: Lineup[] = [
      { id: 'l1', matchId: 'm2', players: [], playerIds: ['p1', 'p2'], bench: ['p3'], shared: false, createdAt: 0, updatedAt: 0, version: 1 },
      { id: 'l2', matchId: 'm3', players: [], playerIds: ['p4'], bench: [], shared: false, createdAt: 0, updatedAt: 0, version: 1 },
    ];
    const result = getConflictingPlayerIds(currentMatch, allMatches, allLineups);
    expect(result).toContain('p1');
    expect(result).toContain('p2');
    expect(result).toContain('p3');
    expect(result).not.toContain('p4');
  });

  it('returns empty set when no overlapping matches exist', () => {
    const allMatches = [currentMatch, nonOverlappingMatch];
    const allLineups: Lineup[] = [
      { id: 'l1', matchId: 'm3', players: [], playerIds: ['p1'], bench: ['p2'], shared: false, createdAt: 0, updatedAt: 0, version: 1 },
    ];
    const result = getConflictingPlayerIds(currentMatch, allMatches, allLineups);
    expect(result.size).toBe(0);
  });
});
