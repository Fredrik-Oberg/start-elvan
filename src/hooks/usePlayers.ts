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
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';
import type { Player } from '../types';

export function usePlayers() {
  const teamId = useTeamId();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'players');
    const q = query(col, orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Player));
      setPlayers(data);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  const addPlayer = async (player: Omit<Player, 'id' | 'createdAt'>) => {
    const col = collection(db, 'teams', teamId, 'players');
    await addDoc(col, { ...player, createdAt: Date.now() });
  };

  const updatePlayer = async (id: string, data: Partial<Player>) => {
    const ref = doc(db, 'teams', teamId, 'players', id);
    await updateDoc(ref, data);
  };

  const deletePlayer = async (id: string) => {
    // Remove player from all lineups (pitch + bench)
    const lineupsCol = collection(db, 'teams', teamId, 'lineups');
    const lineupsSnap = await getDocs(lineupsCol);
    for (const lineupDoc of lineupsSnap.docs) {
      const data = lineupDoc.data();
      const hadOnPitch = data.players?.some((p: { playerId: string }) => p.playerId === id);
      const hadOnBench = data.bench?.includes(id);
      if (hadOnPitch || hadOnBench) {
        await updateDoc(lineupDoc.ref, {
          players: (data.players || []).filter((p: { playerId: string }) => p.playerId !== id),
          bench: (data.bench || []).filter((pid: string) => pid !== id),
          updatedAt: Date.now(),
        });
      }
    }

    const ref = doc(db, 'teams', teamId, 'players', id);
    await deleteDoc(ref);
  };

  return { players, loading, addPlayer, updatePlayer, deletePlayer };
}
