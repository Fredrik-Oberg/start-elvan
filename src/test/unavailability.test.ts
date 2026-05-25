import { describe, it, expect } from 'vitest';
import { getUnavailablePlayerIds } from '../hooks/useUnavailability';
import type { Unavailability } from '../types';

describe('getUnavailablePlayerIds', () => {
  const baseUnavailability: Omit<Unavailability, 'id' | 'playerId' | 'startDate' | 'endDate' | 'startTime' | 'endTime'> = {
    reason: 'injured',
    createdAt: 0,
  };

  it('returns player ID for whole-day unavailability on match date', () => {
    const unavailabilities: Unavailability[] = [
      { id: 'u1', playerId: 'p1', startDate: '2024-05-01', endDate: '2024-05-03', ...baseUnavailability },
    ];
    const result = getUnavailablePlayerIds('2024-05-02', '10:00', '11:00', unavailabilities);
    expect(result).toContain('p1');
  });

  it('does not return player ID when match is outside unavailability dates', () => {
    const unavailabilities: Unavailability[] = [
      { id: 'u1', playerId: 'p1', startDate: '2024-05-01', endDate: '2024-05-02', ...baseUnavailability },
    ];
    const result = getUnavailablePlayerIds('2024-05-03', '10:00', '11:00', unavailabilities);
    expect(result.size).toBe(0);
  });

  it('returns player ID when time-specific unavailability overlaps match', () => {
    const unavailabilities: Unavailability[] = [
      { id: 'u1', playerId: 'p1', startDate: '2024-05-01', endDate: '2024-05-01', startTime: '10:30', endTime: '12:00', ...baseUnavailability },
    ];
    const result = getUnavailablePlayerIds('2024-05-01', '10:00', '11:00', unavailabilities);
    expect(result).toContain('p1');
  });

  it('does not return player ID when time-specific unavailability does not overlap', () => {
    const unavailabilities: Unavailability[] = [
      { id: 'u1', playerId: 'p1', startDate: '2024-05-01', endDate: '2024-05-01', startTime: '14:00', endTime: '16:00', ...baseUnavailability },
    ];
    const result = getUnavailablePlayerIds('2024-05-01', '10:00', '11:00', unavailabilities);
    expect(result.size).toBe(0);
  });

  it('handles multiple unavailabilities for different players', () => {
    const unavailabilities: Unavailability[] = [
      { id: 'u1', playerId: 'p1', startDate: '2024-05-01', endDate: '2024-05-05', ...baseUnavailability },
      { id: 'u2', playerId: 'p2', startDate: '2024-05-10', endDate: '2024-05-12', ...baseUnavailability },
      { id: 'u3', playerId: 'p3', startDate: '2024-05-01', endDate: '2024-05-01', startTime: '09:00', endTime: '10:30', ...baseUnavailability },
    ];
    const result = getUnavailablePlayerIds('2024-05-01', '10:00', '11:00', unavailabilities);
    expect(result).toContain('p1');
    expect(result).not.toContain('p2');
    expect(result).toContain('p3');
  });
});
