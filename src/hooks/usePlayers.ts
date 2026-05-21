import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  runTransaction,
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

  const addPlayer = async (player: Omit<Player, 'id' | 'createdAt' | 'version'>) => {
    const col = collection(db, 'teams', teamId, 'players');
    await addDoc(col, { ...player, createdAt: Date.now(), version: 1 });
  };


  const updatePlayer = async (id: string, data: Partial<Player>) => {
    const ref = doc(db, 'teams', teamId, 'players', id);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error('Player not found');
      const currentVersion = snap.data().version || 0;
      transaction.update(ref, { ...data, version: currentVersion + 1 });
    });
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
        await runTransaction(db, async (transaction) => {
          const freshSnap = await transaction.get(lineupDoc.ref);
          if (!freshSnap.exists()) return;
          const freshData = freshSnap.data();
          transaction.update(lineupDoc.ref, {
            players: (freshData.players || []).filter((p: { playerId: string }) => p.playerId !== id),
            bench: (freshData.bench || []).filter((pid: string) => pid !== id),
            updatedAt: Date.now(),
            version: (freshData.version || 0) + 1,
          });
        });
      }
    }

    const ref = doc(db, 'teams', teamId, 'players', id);
    await deleteDoc(ref);
  };

  return { players, loading, addPlayer, updatePlayer, deletePlayer };
}
