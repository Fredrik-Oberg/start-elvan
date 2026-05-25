import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

interface TeamContextType {
  teamId: string;
}

export const TeamContext = createContext<TeamContextType>({ teamId: '' });

export function useTeamId(): string {
  const { teamId } = useContext(TeamContext);
  return teamId;
}

export function useTeamName() {
  const teamId = useTeamId();
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, 'teams', teamId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setTeamName(snap.data().name || '');
      }
      setLoading(false);
    });
    return unsub;
  }, [teamId]);

  const updateTeamName = useCallback(async (name: string) => {
    if (!teamId) return;
    const ref = doc(db, 'teams', teamId);
    await setDoc(ref, { name }, { merge: true });
  }, [teamId]);

  return { teamName, loading, updateTeamName };
}

export function getOrCreateTeamId(): string {
  const KEY = 'start-elvan-team-id';

  // Check URL for shared team ID or team name
  const params = new URLSearchParams(window.location.search);
  const sharedTeamId = params.get('team');
  const sharedTeamName = params.get('teamName');

  if (sharedTeamId) {
    localStorage.setItem(KEY, sharedTeamId);
    // Clean URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('team');
    url.searchParams.delete('teamName');
    window.history.replaceState({}, '', url.toString());
    return sharedTeamId;
  }

  if (sharedTeamName) {
    // Store name to resolve async after mount
    localStorage.setItem('start-elvan-pending-team-name', sharedTeamName);
    const url = new URL(window.location.href);
    url.searchParams.delete('teamName');
    window.history.replaceState({}, '', url.toString());
  }

  let teamId = localStorage.getItem(KEY);
  if (!teamId) {
    teamId = crypto.randomUUID();
    localStorage.setItem(KEY, teamId);
  }
  return teamId;
}

/**
 * Resolves a pending team name from the URL into a team ID by querying Firestore.
 * Takes the first match if names collide.
 */
export function useResolvePendingTeamName(onResolved: (teamId: string) => void) {
  useEffect(() => {
    const pendingName = localStorage.getItem('start-elvan-pending-team-name');
    if (!pendingName) return;
    localStorage.removeItem('start-elvan-pending-team-name');

    const resolve = async () => {
      const col = collection(db, 'teams');
      const q = query(col, where('name', '==', pendingName), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const teamId = snap.docs[0].id;
        localStorage.setItem('start-elvan-team-id', teamId);
        onResolved(teamId);
      }
    };
    resolve();
  }, [onResolved]);
}

export function getShareUrl(mode: 'id' | 'name' = 'id', teamName?: string): string {
  const teamId = localStorage.getItem('start-elvan-team-id') || '';
  const url = new URL(window.location.href);
  if (mode === 'name' && teamName) {
    url.searchParams.delete('team');
    url.searchParams.set('teamName', teamName);
  } else {
    url.searchParams.set('team', teamId);
    url.searchParams.delete('teamName');
  }
  // Remove any path-based routes for a clean share link
  url.pathname = '/';
  url.hash = '';
  return url.toString();
}
