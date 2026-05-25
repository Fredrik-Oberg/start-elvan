import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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

  // Check URL for shared team ID
  const params = new URLSearchParams(window.location.search);
  const sharedTeamId = params.get('team');
  if (sharedTeamId) {
    localStorage.setItem(KEY, sharedTeamId);
    // Clean URL without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('team');
    window.history.replaceState({}, '', url.toString());
    return sharedTeamId;
  }

  let teamId = localStorage.getItem(KEY);
  if (!teamId) {
    teamId = crypto.randomUUID();
    localStorage.setItem(KEY, teamId);
  }
  return teamId;
}

export function getShareUrl(): string {
  const teamId = localStorage.getItem('start-elvan-team-id') || '';
  const url = new URL(window.location.href);
  url.searchParams.set('team', teamId);
  // Remove any path-based routes for a clean share link
  url.pathname = '/';
  url.hash = '';
  return url.toString();
}
