import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  query,
  where,
  setDoc,
  deleteDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Lineup, LineupPlayer } from '../types';

export function useLineup(matchId: string | null) {
  const teamId = useTeamId();
  const [lineup, setLineup] = useState<Lineup | null>(null);
  const [positions, setPositions] = useState<LineupPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to the lineup document (metadata: bench, shared, etc.)
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
        setLineup({ id: d.id, ...d.data(), players: [] } as unknown as Lineup);
      } else {
        setLineup(null);
      }
      setLoading(false);
    });
    return unsub;
  }, [teamId, matchId]);

  // Listen to per-player position sub-documents
  useEffect(() => {
    if (!teamId || !lineup?.id) return;
    const posCol = collection(db, 'teams', teamId, 'lineups', lineup.id, 'positions');
    const unsub = onSnapshot(posCol, (snap) => {
      const data = snap.docs.map((d) => ({
        playerId: d.id,
        x: d.data().x,
        y: d.data().y,
      } as LineupPlayer));
      setPositions(data);
    });
    return unsub;
  }, [teamId, lineup?.id]);

  // Merge positions into lineup for consumers
  const lineupWithPlayers = lineup ? { ...lineup, players: positions } : null;

  const createLineup = async (matchId: string): Promise<string> => {
    const col = collection(db, 'teams', teamId, 'lineups');
    const docRef = await addDoc(col, {
      matchId,
      bench: [],
      shared: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    });
    return docRef.id;
  };

  const setPlayerPosition = useCallback(
    async (playerId: string, x: number, y: number) => {
      if (!lineup) return;
      const posRef = doc(db, 'teams', teamId, 'lineups', lineup.id, 'positions', playerId);
      await setDoc(posRef, { x, y, updatedAt: Date.now() });
    },
    [lineup, teamId]
  );

  const removePlayerFromPitch = useCallback(
    async (playerId: string) => {
      if (!lineup) return;
      const posRef = doc(db, 'teams', teamId, 'lineups', lineup.id, 'positions', playerId);
      await deleteDoc(posRef);
    },
    [lineup, teamId]
  );

  const setPlayers = useCallback(
    async (players: LineupPlayer[]) => {
      if (!lineup) return;
      // Determine added, updated, and removed players
      const newIds = new Set(players.map((p) => p.playerId));

      // Remove players no longer on pitch
      for (const pos of positions) {
        if (!newIds.has(pos.playerId)) {
          await removePlayerFromPitch(pos.playerId);
        }
      }
      // Add/update positions
      for (const p of players) {
        const existing = positions.find((e) => e.playerId === p.playerId);
        if (!existing || existing.x !== p.x || existing.y !== p.y) {
          await setPlayerPosition(p.playerId, p.x, p.y);
        }
      }
      // Keep playerIds denormalized on lineup doc for conflict detection across lineups
      const lineupRef = doc(db, 'teams', teamId, 'lineups', lineup.id);
      await setDoc(lineupRef, { playerIds: players.map((p) => p.playerId) }, { merge: true });
    },
    [lineup, positions, teamId, setPlayerPosition, removePlayerFromPitch]
  );

  const setBench = useCallback(
    async (bench: string[]) => {
      if (!lineup) return;
      const ref = doc(db, 'teams', teamId, 'lineups', lineup.id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;
        const currentVersion = snap.data().version || 0;
        transaction.update(ref, { bench, updatedAt: Date.now(), version: currentVersion + 1 });
      });
    },
    [lineup, teamId]
  );

  const toggleShared = useCallback(async () => {
    if (!lineup) return;
    const ref = doc(db, 'teams', teamId, 'lineups', lineup.id);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      transaction.update(ref, {
        shared: !data.shared,
        updatedAt: Date.now(),
        version: (data.version || 0) + 1,
      });
    });
  }, [lineup, teamId]);

  const updateLineup = useCallback(
    async (data: Partial<Lineup>) => {
      if (!lineup) return;
      const ref = doc(db, 'teams', teamId, 'lineups', lineup.id);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) return;
        const currentVersion = snap.data().version || 0;
        const { players, ...rest } = data;
        // If players are included, handle via sub-docs
        if (players) {
          await setPlayers(players);
        }
        transaction.update(ref, { ...rest, updatedAt: Date.now(), version: currentVersion + 1 });
      });
    },
    [lineup, teamId, setPlayers]
  );

  return {
    lineup: lineupWithPlayers,
    loading,
    createLineup,
    updateLineup,
    setPlayers,
    setPlayerPosition,
    removePlayerFromPitch,
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
