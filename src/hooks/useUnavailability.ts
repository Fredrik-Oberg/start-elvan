import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  type FieldValue,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Unavailability } from '../types';

/** Strip undefined values so Firestore doesn't reject them. */
function cleanForFirestore<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

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
    await addDoc(col, { ...cleanForFirestore(entry), createdAt: Date.now() });
  };

  const updateUnavailability = async (id: string, entry: Omit<Unavailability, 'id' | 'createdAt'>) => {
    const ref = doc(db, 'teams', teamId, 'unavailabilities', id);
    // Use set with merge:false to overwrite, but first delete optional fields that may have been cleared
    const cleaned = cleanForFirestore(entry);
    // Explicitly null out optional fields that were removed (Firestore won't remove fields on update)
    const payload: Record<string, unknown> = { ...cleaned };
    if (!entry.startTime) payload.startTime = null;
    if (!entry.endTime) payload.endTime = null;
    if (!entry.note) payload.note = null;
    await updateDoc(ref, payload as Record<string, FieldValue | Partial<unknown>>);
  };

  const deleteUnavailability = async (id: string) => {
    const ref = doc(db, 'teams', teamId, 'unavailabilities', id);
    await deleteDoc(ref);
  };

  return { unavailabilities, loading, addUnavailability, updateUnavailability, deleteUnavailability };
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
