import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Match } from '../types';

export function useMatches() {
  const teamId = useTeamId();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'matches');
    const q = query(col, orderBy('date'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Match));
      setMatches(data);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  const addMatch = async (match: Omit<Match, 'id' | 'createdAt'>) => {
    const col = collection(db, 'teams', teamId, 'matches');
    await addDoc(col, { ...match, createdAt: Date.now() });
  };

  const updateMatch = async (id: string, data: Partial<Match>) => {
    const ref = doc(db, 'teams', teamId, 'matches', id);
    await updateDoc(ref, data);
  };

  const deleteMatch = async (id: string) => {
    const ref = doc(db, 'teams', teamId, 'matches', id);
    await deleteDoc(ref);
  };

  return { matches, loading, addMatch, updateMatch, deleteMatch };
}
