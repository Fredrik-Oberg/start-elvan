import { createContext, useContext } from 'react';

interface TeamContextType {
  teamId: string;
}

export const TeamContext = createContext<TeamContextType>({ teamId: '' });

export function useTeamId(): string {
  const { teamId } = useContext(TeamContext);
  return teamId;
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
