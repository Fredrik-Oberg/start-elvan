import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Lineup, LineupPlayer } from '../types';

export function useLineup(matchId: string | null) {
  const teamId = useTeamId();
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!teamId || !matchId) {
      setLoading(false);
      return;
    }
    const col = collection(db, 'teams', teamId, 'lineups');
    const q = query(col, where('matchId', '==', matchId));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.docs.length > 0) {
        const d = snap.docs[0];
        setLineup({ id: d.id, ...d.data() } as Lineup);
      } else {
        setLineup(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [teamId, matchId]);

  const createLineup = async (matchId: string): Promise<string> => {
    const col = collection(db, 'teams', teamId, 'lineups');
    const docRef = await addDoc(col, {
      matchId,
      players: [],
      bench: [],
      shared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  };

  const updateLineup = useCallback(
    (data: Partial<Lineup>) => {
      if (!lineup) return;
      // Debounce saves
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const ref = doc(db, 'teams', teamId, 'lineups', lineup.id);
        await updateDoc(ref, { ...data, updatedAt: Date.now() });
      }, 500);
    },
    [lineup, teamId]
  );

  const setPlayers = useCallback(
    (players: LineupPlayer[]) => {
      if (!lineup) return;
      setLineup((prev) => (prev ? { ...prev, players } : null));
      updateLineup({ players });
    },
    [lineup, updateLineup]
  );

  const setBench = useCallback(
    (bench: string[]) => {
      if (!lineup) return;
      setLineup((prev) => (prev ? { ...prev, bench } : null));
      updateLineup({ bench });
    },
    [lineup, updateLineup]
  );

  const toggleShared = useCallback(async () => {
    if (!lineup) return;
    const ref = doc(db, 'teams', teamId, 'lineups', lineup.id);
    await updateDoc(ref, { shared: !lineup.shared, updatedAt: Date.now() });
  }, [lineup, teamId]);

  return {
    lineup,
    loading,
    createLineup,
    updateLineup,
    setPlayers,
    setBench,
    toggleShared,
  };
}

export function useAllLineups() {
  const teamId = useTeamId();
  const [lineups, setLineups] = useState<Lineup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'lineups');
    const unsub = onSnapshot(col, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Lineup));
      setLineups(data);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  return { lineups, loading };
}
