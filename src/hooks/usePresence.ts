import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  query,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useTeamId } from './useTeam';

const PRESENCE_TTL_MS = 2 * 60 * 1000; // 2 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minute

function getVisitorId(): string {
  const KEY = 'start-elvan-visitor-id';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export interface PresenceEntry {
  visitorId: string;
  lastSeen: number;
}

export function usePresence() {
  const teamId = useTeamId();
  const visitorId = getVisitorId();
  const [activeUsers, setActiveUsers] = useState<number>(0);

  // Heartbeat: write presence doc periodically
  useEffect(() => {
    if (!teamId) return;

    const presenceRef = doc(db, 'teams', teamId, 'presence', visitorId);

    const updatePresence = () => {
      setDoc(presenceRef, { lastSeen: Date.now(), visitorId });
    };

    updatePresence();
    const interval = setInterval(updatePresence, HEARTBEAT_INTERVAL_MS);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      deleteDoc(presenceRef);
    };
  }, [teamId, visitorId]);

  // Listen to all presence docs
  useEffect(() => {
    if (!teamId) return;
    const col = collection(db, 'teams', teamId, 'presence');
    const q = query(col);
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      const active = snap.docs.filter((d) => {
        const lastSeen = d.data().lastSeen;
        return now - lastSeen < PRESENCE_TTL_MS;
      });
      setActiveUsers(active.length);
    });
    return unsub;
  }, [teamId]);

  return { activeUsers, visitorId };
}
