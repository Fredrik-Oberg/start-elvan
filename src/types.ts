export interface Player {
  id: string;
  name: string;
  traits: string[]; // trait IDs
  avatarUrl?: string;
  createdAt: number;
  version: number;
}

export interface Trait {
  id: string;
  label: string;
  color: string;
}

export interface Match {
  id: string;
  opponent: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  createdAt: number;
  version: number;
}

export interface LineupPlayer {
  playerId: string;
  x: number; // 0-100 percentage on pitch
  y: number; // 0-100 percentage on pitch
}

export interface Lineup {
  id: string;
  matchId: string;
  name?: string;
  players: LineupPlayer[];
  playerIds?: string[]; // denormalized player IDs on pitch for cross-lineup conflict detection
  bench: string[]; // player IDs on bench
  shared: boolean;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export type UnavailabilityReason = 'injured' | 'sick' | 'personal' | 'other';

export interface Unavailability {
  id: string;
  playerId: string;
  reason: UnavailabilityReason;
  note?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string; // ISO date string (YYYY-MM-DD)
  startTime?: string; // HH:mm — if omitted, whole day
  endTime?: string; // HH:mm — if omitted, whole day
  createdAt: number;
}

export interface Team {
  id: string;
  name: string;
  createdAt: number;
}
