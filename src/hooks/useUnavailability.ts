import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Unavailability } from '../types';

export function useUnavailability() {
  const teamId = useTeamId();
  const [unavailabilities, setUnavailabilities] = useState<Unavailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'unavailabilities');
    const q = query(col, orderBy('startDate'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Unavailability));
      setUnavailabilities(data);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  const addUnavailability = async (entry: Omit<Unavailability, 'id' | 'createdAt'>) => {
    const col = collection(db, 'teams', teamId, 'unavailabilities');
    await addDoc(col, { ...entry, createdAt: Date.now() });
  };

  const deleteUnavailability = async (id: string) => {
    const ref = doc(db, 'teams', teamId, 'unavailabilities', id);
    await deleteDoc(ref);
  };

  return { unavailabilities, loading, addUnavailability, deleteUnavailability };
}

/**
 * Returns player IDs that are unavailable for a given match (date + time overlap).
 */
export function getUnavailablePlayerIds(
  matchDate: string,
  matchStart: string,
  matchEnd: string,
  unavailabilities: Unavailability[]
): Set<string> {
  const unavailable = new Set<string>();

  for (const u of unavailabilities) {
    // Check date range overlap
    if (matchDate < u.startDate || matchDate > u.endDate) continue;

    // If no specific times, the whole day is blocked
    if (!u.startTime || !u.endTime) {
      unavailable.add(u.playerId);
      continue;
    }

    // Check time overlap
    if (matchStart < u.endTime && u.startTime < matchEnd) {
      unavailable.add(u.playerId);
    }
  }

  return unavailable;
}
