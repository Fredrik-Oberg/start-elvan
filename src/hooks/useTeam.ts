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
  let teamId = localStorage.getItem(KEY);
  if (!teamId) {
    teamId = crypto.randomUUID();
    localStorage.setItem(KEY, teamId);
  }
  return teamId;
}
