import { useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { sv } from 'date-fns/locale';
import theme from './theme';
import './i18n';
import { TeamContext, getOrCreateTeamId, useResolvePendingTeamName } from './hooks/useTeam';
import Layout from './components/Layout';
import MyTeamPage from './pages/MyTeamPage';
import MatchesPage from './pages/MatchesPage';
import LineupPage from './pages/LineupPage';
import LineupsListPage from './pages/LineupsListPage';

const initialTeamId = getOrCreateTeamId();

function AppContent() {
  const [teamId, setTeamId] = useState(initialTeamId);

  const handleTeamResolved = useCallback((resolvedId: string) => {
    setTeamId(resolvedId);
  }, []);

  useResolvePendingTeamName(handleTeamResolved);

  return (
    <TeamContext.Provider value={{ teamId }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<MyTeamPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/lineups" element={<LineupsListPage />} />
            <Route path="/lineup/:matchId" element={<LineupPage />} />
            <Route path="/lineup/id/:lineupId" element={<LineupPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TeamContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
        <CssBaseline />
        <AppContent />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
