import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  runTransaction,
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

  const addMatch = async (match: Omit<Match, 'id' | 'createdAt' | 'version'>) => {
    const col = collection(db, 'teams', teamId, 'matches');
    await addDoc(col, { ...match, createdAt: Date.now(), version: 1 });
  };

  const updateMatch = async (id: string, data: Partial<Match>) => {
    const ref = doc(db, 'teams', teamId, 'matches', id);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('Match not found');
      const currentVersion = snap.data().version || 0;
      transaction.update(ref, { ...data, version: currentVersion + 1 });
    });
  };

  const deleteMatch = async (id: string) => {
    const ref = doc(db, 'teams', teamId, 'matches', id);
    await deleteDoc(ref);
  };

  return { matches, loading, addMatch, updateMatch, deleteMatch };
}
