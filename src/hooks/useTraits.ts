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
import type { Trait } from '../types';

export function useTraits() {
  const teamId = useTeamId();
  const [traits, setTraits] = useState<Trait[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'traits');
    const q = query(col, orderBy('label'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Trait));
      setTraits(data);
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  const addTrait = async (trait: Omit<Trait, 'id'>) => {
    const col = collection(db, 'teams', teamId, 'traits');
    await addDoc(col, trait);
  };

  const updateTrait = async (id: string, data: Partial<Trait>) => {
    const ref = doc(db, 'teams', teamId, 'traits', id);
    await updateDoc(ref, data);
  };

  const deleteTrait = async (id: string) => {
    const ref = doc(db, 'teams', teamId, 'traits', id);
    await deleteDoc(ref);
  };

  return { traits, loading, addTrait, updateTrait, deleteTrait };
}
